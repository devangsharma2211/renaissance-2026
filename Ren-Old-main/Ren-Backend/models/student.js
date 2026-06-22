import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    // unique: true prevents duplicate registrations (crucial for both flows)
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    branch: { type: String, required: true, trim: true },
    Year: { type: Number, required: true },
    phone: { type: String, trim: true, default: null },
    isPaid: { type: Boolean, default: false, required: true },    
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
    markedAt: { type: Date, default: null },
    password: { type: String, trim: true },
    token : { type: Number, default: 0 },
    passSent: { type: Boolean, default: false },
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: [] }] 
});

const Student = mongoose.model('Student', studentSchema);

export default Student;
