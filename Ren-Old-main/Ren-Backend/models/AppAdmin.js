import mongoose from "mongoose";

const appAdminSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "App Admin" },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    devices: [{ type: String }]
  },
  { timestamps: true }
);

export default mongoose.model("AppAdmin", appAdminSchema);
