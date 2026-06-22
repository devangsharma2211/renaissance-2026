import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OutsiderPass from '../models/OutsiderPass.js';
import { generateOutsiderEventTicket, generateOutsiderTicket } from '../utils/sendPassToOutsider.js';

dotenv.config();
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/renaissance';

async function run() {
  await mongoose.connect(MONGO);
  const pending = await OutsiderPass.find({ ticketSent: { $ne: true }, $or: [{ email: { $exists: true } }, { phone: { $exists: true } }] }).limit(100);
  console.log('Pending count:', pending.length);
  for (const p of pending) {
    try {
      const isEventPass = p.passType === "EVENT" || !!p.eventName;
      const generator = isEventPass ? generateOutsiderEventTicket : generateOutsiderTicket;
      await generator(p);
      console.log('Sent for', p.email || p.phone);
    } catch (e) {
      console.error('Failed to send for', p._id, e?.message || e);
    }
  }
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
