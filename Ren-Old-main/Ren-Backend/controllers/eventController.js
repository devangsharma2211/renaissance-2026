import Pass from "../models/pass.js";
import Event from "../models/event.js";
import Student from "../models/student.js";
import sendPassesToStudent from "../utils/sendPasstoStudent.js"; // To send passes via email

const normalizeCategory = (cat) => {
  const c = (cat || "").toLowerCase().trim();
  if (!c) return c;
  if (c === "culture" || c.startsWith("cult")) return "cultural";
  if (c.includes("tech")) return "technical";
  if (c.includes("splash")) return "splash";
  return c;
};

const SPLASH_FREE_EXCEPTIONS = ["BGMI", "REAL CRICKET"];
const isSplashFreeException = (title = "") =>
  SPLASH_FREE_EXCEPTIONS.some((t) => String(title || "").toUpperCase().includes(t));

const idToString = (id) => String(id || "");
const hasEventId = (eventIds = [], targetId) => {
  const target = idToString(targetId);
  return eventIds.some((id) => idToString(id) === target);
};

const uniqueIdStrings = (eventIds = []) => {
  const set = new Set(eventIds.map((id) => idToString(id)).filter(Boolean));
  return Array.from(set);
};

const resolvePaidFlag = (event) => {
  if (!event) return false;
  if (typeof event.isPaid === "boolean") return event.isPaid;
  if (typeof event.Paid === "boolean") return event.Paid;
  if (typeof event.paid === "boolean") return event.paid;
  return false;
};

// Fetch all events (for frontend listing)
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().lean();
    const normalized = events.map((e) => {
      const category = normalizeCategory(e.category);
      const isPaid = category === "cultural" ? true : resolvePaidFlag(e);
      return { ...e, category, isPaid };
    });

    return res.status(200).json(normalized);
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({ message: "Failed to fetch events" });
  }
};

export const getTokenCount = async (req, res) => {
  try{
    const student = req.student;
    res.status(200).json({token: student.token});
  }
  catch(error){
    res.status(500).json({message: "Server error", error});
  }
}

export async function registerForEvent(req, res) {
  try {
    const { eventId } = req.body;
    const student = req.student; // Authenticated student from middleware
    console.log("Student attempting to register:", student);
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    const category = normalizeCategory(event.category);
    const isPaid = category === "cultural" ? true : resolvePaidFlag(event);

    if (!isPaid && student.token <= 0) {
      return res
        .status(400)
        .json({ message: "No tokens left for free events. Kindly pay and register offline." });
    }

    if (hasEventId(student.events, event._id)) {
      return res
        .status(400)
        .json({ message: "You have already registered for this event." });
    }

    const registeredEventIds = uniqueIdStrings(student.events);
    const registeredEvents = await Event.find({ _id: { $in: registeredEventIds } }).lean();
    const registeredFree = registeredEvents
      .map((e) => ({
        title: e.title || e.name || "",
        category: normalizeCategory(e.category),
        isPaid: normalizeCategory(e.category) === "cultural" ? true : resolvePaidFlag(e)
      }))
      .filter((e) => !e.isPaid);

    const hasSplashFree = registeredFree.some(
      (e) => e.category === "splash" && !isSplashFreeException(e.title)
    );
    const hasTechnicalFree = registeredFree.some((e) => e.category === "technical");

    const eventTitle = event.title || event.name || "";
    const isSplashException = category === "splash" && isSplashFreeException(eventTitle);

    if (!isPaid && category === "splash" && hasSplashFree && !isSplashException) {
      return res.status(400).json({
        message: "Can Register only one splash event. Kindly register and pay offline"
      });
    }

    if (!isPaid && category === "technical" && hasTechnicalFree) {
      return res.status(400).json({
        message: "Can Register only one technical event. Kindly register and pay offline"
      });
    }



    if (!isPaid) {
      const updatedStudent = await Student.findOneAndUpdate(
        {
          _id: student._id,
          token: { $gt: 0 },
          events: { $ne: event._id }
        },
        {
          $addToSet: { events: event._id },
          $inc: { token: -1 }
        },
        { new: true }
      );

      if (!updatedStudent) {
        const fresh = await Student.findById(student._id).select("token events");
        if (fresh && hasEventId(fresh.events, event._id)) {
          return res.status(400).json({ message: "You have already registered for this event." });
        }
        if (fresh && fresh.token <= 0) {
          return res
            .status(400)
            .json({ message: "No tokens left for free events. Kindly pay and register offline." });
        }
        return res.status(409).json({ message: "Registration conflict. Please retry." });
      }

      const updatedEventIds = uniqueIdStrings(updatedStudent.events);
      const updatedEvents = await Event.find({ _id: { $in: updatedEventIds } }).lean();
      const updatedFree = updatedEvents
        .map((e) => ({
          title: e.title || e.name || "",
          category: normalizeCategory(e.category),
          isPaid: normalizeCategory(e.category) === "cultural" ? true : resolvePaidFlag(e)
        }))
        .filter((e) => !e.isPaid);

      const splashFreeNonExceptionCount = updatedFree.filter(
        (e) => e.category === "splash" && !isSplashFreeException(e.title)
      ).length;
      const technicalFreeCount = updatedFree.filter((e) => e.category === "technical").length;

      const violatedSplash = splashFreeNonExceptionCount > 1;
      const violatedTechnical = technicalFreeCount > 1;

      if (violatedSplash || violatedTechnical) {
        await Student.updateOne(
          { _id: updatedStudent._id },
          { $pull: { events: event._id }, $inc: { token: 1 } }
        );

        if (violatedSplash) {
          return res.status(400).json({
            message: "Can Register only one splash event. Kindly register and pay offline"
          });
        }
        return res.status(400).json({
          message: "Can Register only one technical event. Kindly register and pay offline"
        });
      }

      const allRegisteredEvents = await Event.find({
        _id: { $in: updatedStudent.events },
      });
      await sendPassesToStudent(updatedStudent, allRegisteredEvents);

      return res
        .status(200)
        .json({
          message:
            "Successfully registered for the event. Pass sent via email.",
          student: {
            name: updatedStudent.name,
            email: updatedStudent.email,
            token: updatedStudent.token,
            events: updatedStudent.events,
          },
        });
    }

    // Paid event: record registration (no token change)
    const paidUpdated = await Student.findOneAndUpdate(
      { _id: student._id, events: { $ne: event._id } },
      { $addToSet: { events: event._id } },
      { new: true }
    );
    if (!paidUpdated) {
      return res.status(400).json({ message: "You have already registered for this event." });
    }
    return res
      .status(200)
      .json({ message: "Event is paid, kindly register offline and token won't be deducted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error registering for the event." });
  }
}
