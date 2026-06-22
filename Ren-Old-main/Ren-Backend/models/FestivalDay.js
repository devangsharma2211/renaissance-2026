import mongoose from "mongoose";

const festivalDaySchema = new mongoose.Schema({
  day: { type: Number, enum: [1, 2, 3], required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
});

export default mongoose.model("FestivalDay", festivalDaySchema);
