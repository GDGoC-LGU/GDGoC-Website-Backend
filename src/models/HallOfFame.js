import mongoose from 'mongoose';

const hallOfFameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    photo: {
      type: String, // /uploads/halloffame/filename.jpg
      default: null,
    },
    achievement: {
      type: String,
      required: [true, 'Achievement is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    year: {
      type: String,
      trim: true,
      default: null, // e.g. "2024" — for the "Our Legends" grid
    },
    // Member of the Month specific fields
    isMemberOfMonth: {
      type: Boolean,
      default: false,
    },
    month: {
      type: String,
      trim: true,
      default: null, // e.g. "February 2026"
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('HallOfFame', hallOfFameSchema);