import mongoose from 'mongoose';
import dotenv from 'dotenv';
import OutsiderPass from '../models/OutsiderPass.js';

dotenv.config();
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/renaissance';

async function run() {
  await mongoose.connect(MONGO);
  const emails = ['abc@gmail.com','vanshikast05@gmail.com','john@mail.com','neha@test.com','karan@test.com'];
  const docs = await OutsiderPass.find({ email: { $in: emails } });
  console.log('Found', docs.length, 'documents');
  for (const d of docs) {
    console.log({ name: d.name, email: d.email, phone: d.phone, Day1: d.Day1, Day2: d.Day2, Day3: d.Day3, ticketSent: d.ticketSent });
  }
  await mongoose.disconnect();
}

run().catch(e=>{ console.error(e); process.exit(1); });
