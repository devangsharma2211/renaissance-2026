import { Resend } from 'resend';
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
console.log("✅ Resend initialized.");

const awssendEmail = async (to, subject, html, attachments = []) => {
  try {
    if (!to || !subject || !html) {
      throw new Error("Missing email parameters.");
    }

    const resendAttachments = attachments.map((att, index) => {
      // Case 1: already correct format
      if (att?.content && att?.filename) {
        return att;
      }

      // Case 2: raw Buffer (your pass case)
      if (Buffer.isBuffer(att)) {
        return {
          filename: `attachment-${index + 1}.png`,
          content: att
        };
      }

      throw new Error("Invalid attachment format");
    });

    const { data, error } = await resend.emails.send({
      from: `Team Renaissance <${process.env.VERIFIED_FROM_EMAIL}>`,
      to,
      subject,
      html,
      attachments: resendAttachments
    });

    if (error) {
      console.error("❌ Resend API Error:", error);
      return;
    }

    console.log(`✅ Email sent to ${to}. ID: ${data.id}`);
  } catch (err) {
    console.error("❌ Mailer Error:", err.message);
  }
};

export default awssendEmail;







