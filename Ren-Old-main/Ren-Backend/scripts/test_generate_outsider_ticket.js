import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OutsiderPass from '../models/OutsiderPass.js';
import { generateOutsiderTicket } from '../utils/sendPassToOutsider.js';

dotenv.config();
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/renaissance';

async function run() {
  await mongoose.connect(MONGO);
  const outsider = await OutsiderPass.findOne({ email: 'vanshikast05@gmail.com' });
  if (!outsider) {
    console.error('Test outsider not found');
    process.exit(1);
  }

  try {
    await generateOutsiderTicket(outsider);
    console.log('generateOutsiderTicket completed');
  } catch (e) {
    console.error('generateOutsiderTicket failed:', e);
  }

  await mongoose.disconnect();
}

run().catch(e=>{ console.error(e); process.exit(1); });