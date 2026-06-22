import mongoose from 'mongoose';
import { v4 as uuid } from 'uuid';

const FestivalPassSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
    unique: true
  },

  Day1: { type: Boolean, default: false },
  Day2: { type: Boolean, default: false },
  Day3: { type: Boolean, default: false },

  isActive: { type: Boolean, default: true }
});


export default mongoose.model('FestivalPass', FestivalPassSchema);