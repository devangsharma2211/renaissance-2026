import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['technical', 'splash', 'cultural'], required: true },
  isPaid: { type: Boolean, default: false }, // Renamed 'Paid' to 'isPaid' for consistency
  day: { type: String, required: true },
  venue: { type: String, default: "" },
  date: { type: String, default: "" }, // Example: "Thursday, 6 March"
  time: { type: String, default: "" }, // Example: "2:30 PM"
   // UI metadata
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  icon: { type: String, required: true },
  iconColor: { type: String, required: true },
  image: { type: String, required: true },
  description: { type: String, required: true },
  actionLabel: { type: String, required: true }
});


const Event = mongoose.model("Event", eventSchema);
export default Event;
