import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },


    role: {
      type: String,
      enum: ["superadmin", "admin", "hod", "dean"],
      required: true
    },

    branch: {
      type: String,
      enum: ["CSE", "CSAI", "AIDS", "IT", "ECE", "EE", "ME", "CE"],
      required: function () {
        return ["hod"].includes(this.role);
      }
    },

    year: {
      type: Number,
      min: 1,
      max: 4,
      default: 1,
      required: function () {
        return ["dean"].includes(this.role);
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model('Teacher', teacherSchema);
