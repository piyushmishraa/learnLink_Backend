import 'dotenv/config';  
import mongoose from 'mongoose';
 // 🔄 Adjust path to your Resources model
import { db_name } from './constants.js';
import Resources from './models/resource.js';

// Your database connection logic (copy from your main server file)
const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.CONNECTION_STRING}/${db_name}`);// 🔄 Your connection string
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

async function migrate() {
  await connectDB();
  
  try {
    const documentsToUpdate = await Resources.find({
      $or: [
        { likes: { $type: "number" } },
        { likes: { $exists: false } },
        { saves: { $exists: false } }
      ]
    });

    console.log(`Found ${documentsToUpdate.length} documents to migrate`);

    for (const doc of documentsToUpdate) {
      await Resources.updateOne(
        { _id: doc._id },
        { $set: { likes: [], saves: [] } }
      );
      console.log(`Migrated: ${doc._id}`);
    }

    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

migrate();