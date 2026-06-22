import mongoose from "mongoose";

const outsiderPassSchema = new mongoose.Schema(
  {
    name: { type: String, required: false },
    email: { type: String },
    phone: { type: String },
    eventName: { type: String },
    passType: { type: String, enum: ["MASTER", "EVENT"], default: "MASTER" },
    participants: { type: String },
    participantsCount: { type: Number, default: 1 },

    Day1: { type: Boolean, default: false },
    Day2: { type: Boolean, default: false },
    Day3: { type: Boolean, default: false },

    qrToken: { type: String, unique: true, sparse: true },
    // mark whether a ticket/email has already been sent for this pass
    ticketSent: { type: Boolean, default: false },

    attendedDay1: { type: Boolean, default: false },
    attendedDay2: { type: Boolean, default: false },
    attendedDay3: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("OutsiderPass", outsiderPassSchema);
