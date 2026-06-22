import generatePass from "./bookEventPasses.js"; // Your pass generation function
import awssendEmail from "./awsSendEmail.js"; // The mail sender function
import Student from "../models/student.js";
import enqueueEmail from "./emailQueue.js";

const sendPassesToStudent = async (student, events) => {
  return enqueueEmail(async () => {
    try {
      const attachments = [];

      for (const event of events) {
        const passBuffer = await generatePass(student, event);
        attachments.push({
          filename: `Pass-${student.name}-${event.name}.png`,
          content: passBuffer
        });
      }

  // Insider email template (includes Email ID and Password placeholders)
  const emailBody = `
  <div style="font-family: Arial, sans-serif; font-size: 15px; color: #333;">
    <p>Your Registration for <strong>Renaissance 2026</strong> is Confirmed! 🎉</p>

    <p>Dear ${student.name},</p>

    <p>Thank you for registering for Renaissance 2026! Your pass is attached to this email.</p>
    
    <p><strong>⚠ Please note:</strong> Tickets are non-transferable and valid only for the registered participant.</p>
    
    <p>Get ready for an unforgettable experience! We can’t wait to see you at Renaissance 2026! 🎭🎶🔥</p>
    <p>Best Regards, <br>
    <strong>Team Renaissance</strong> <br>
    JECRC Foundation</p>
  </div>
  `;

  // ✅ ALWAYS SEND (no checks)
      await awssendEmail(
        student.email,
        "Your Event Pass",
        emailBody,
        attachments
      );

    } catch (err) {
      console.error("❌ Error sending event passes:", err);
    }
  });
};

export default sendPassesToStudent;
