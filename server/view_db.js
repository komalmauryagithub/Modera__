import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import User from './src/models/User.js';
import Event from './src/models/Event.js';

dotenv.config();

const viewDatabase = async () => {
  try {
    await connectDB();
    console.log('\n======================================================');
    console.log('             MEMORA DATABASE VIEWER                   ');
    console.log('======================================================\n');

    const users = await User.find({}, '-password');
    console.log(`📌 USERS (${users.length} found):`);
    console.table(
      users.map((u) => ({
        ID: u._id.toString(),
        Name: u.name,
        Email: u.email,
        CreatedAt: u.createdAt?.toLocaleString(),
      }))
    );

    const events = await Event.find({}).populate('user', 'name email');
    console.log(`\n🎉 EVENTS (${events.length} found):`);
    console.table(
      events.map((e) => ({
        ID: e._id.toString(),
        Title: e.title,
        Date: e.date,
        Time: e.time || '-',
        Category: e.category,
        Photo: e.imageUrl ? 'Yes' : 'No',
        ImageUrl: e.imageUrl || '-',
        User: e.user?.name || 'Unknown',
      }))
    );

    console.log('\n======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('Error reading database:', err);
    process.exit(1);
  }
};

viewDatabase();
