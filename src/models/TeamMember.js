import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    image: {
      type: String, // /uploads/team/filename.jpg
      default: null,
    },
    socials: {
      linkedin: { type: String, trim: true, default: '' },
      github:   { type: String, trim: true, default: '' },
      twitter:  { type: String, trim: true, default: '' },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0, // for controlling display order on frontend
    },
  },
  { timestamps: true }
);

export default mongoose.model('TeamMember', teamMemberSchema);