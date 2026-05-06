import mongoose from 'mongoose';

const sponsorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Sponsor name is required'],
      trim: true,
    },
    logo: {
      type: String, // /uploads/sponsors/filename.jpg
      default: null,
    },
    url: {
      type: String,
      trim: true,
      default: '#',
    },
    tier: {
      type: String,
      enum: ['platinum', 'gold', 'community'],
      required: [true, 'Tier is required'],
      default: 'community',
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

export default mongoose.model('Sponsor', sponsorSchema);