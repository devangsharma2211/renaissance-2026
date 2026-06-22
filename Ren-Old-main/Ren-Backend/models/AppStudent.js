import mongoose from "mongoose";

const appStudentSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    devices: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "AppAdmin" }
  },
  { timestamps: true, collection: "appstaffs" }
);

export default mongoose.model("AppStudent", appStudentSchema);
