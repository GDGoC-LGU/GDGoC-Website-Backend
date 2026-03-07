// Run once: node src/utils/seed.js
import 'dotenv/config';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    const existing = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    if (existing) {
      console.log('✅ Superadmin already exists:', existing.email);
      process.exit(0);
    }

    await Admin.create({
      name: 'GDCoC Admin',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'superadmin',
    });

    console.log('✅ Superadmin created!');
    console.log('   Email:   ', process.env.ADMIN_EMAIL);
    console.log('   Password:', process.env.ADMIN_PASSWORD);
    console.log('\n⚠️  Change this password after first login!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};
 
seed();