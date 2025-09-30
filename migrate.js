// ===== IMPORTS SECTION ===== this is written by chat gpt
import 'dotenv/config';           // Loads environment variables from .env file (like database connection string)
import { connectDB } from './db/db.js';  // Your custom function to connect to MongoDB
import Resource from './models/resource.js';  // Your MongoDB model/schema for resources
import fs from 'fs';              // File system module to read files
import { fileURLToPath } from 'url';  // Converts import.meta.url to file path
import { dirname, join } from 'path';  // Path utilities for working with file paths
import Resources from './models/resource.js';

// ===== PATH SETUP =====
const __filename = fileURLToPath(import.meta.url);  // Gets current file's full path
const __dirname = dirname(__filename);               // Gets current directory path
// Note: In ES modules, __dirname isn't available by default, so we create it manually

// ===== MAIN MIGRATION FUNCTION =====
async function migrate() {
    try {
        // STEP 1: Connect to MongoDB database
        await connectDB();
        console.log("✅ Connected to MongoDB");

        // STEP 2: Read and parse the JSON file
        const db = JSON.parse(fs.readFileSync(join(__dirname, 'db.json'), 'utf-8'));
        console.log("✅ Read db.json file");

        // STEP 3: Transform the data to match MongoDB schema
        const resources = db.resources.map(resource => ({
            title: resource.title,           // Copy title as-is
            category: resource.category,     // Copy category as-is
            url: resource.url,              // Copy URL as-is
            likes: resource.like || 0,      // Use 'like' field, default to 0 if missing
            dislikes: resource.dislike || 0, // Use 'dislike' field, default to 0 if missing
            userId: null,                   // Set to null (public resources)
        }));
        console.log(`✅ Transformed ${resources.length} resources`);

        // STEP 4: Clear existing data (optional but recommended for clean migration)
        await Resources.deleteMany({});
        console.log("✅ Cleared existing resources from MongoDB");

        // STEP 5: Insert all transformed data into MongoDB
        const inserted = await Resource.insertMany(resources);
        console.log(`✅ Migration successful: ${inserted.length} resources added`);

    } catch (error) {
        // If anything goes wrong, log the error
        console.error('❌ Migration error:', error);
    } finally {
        // Always exit the process when done (success or failure)
        process.exit();
    }
}

// ===== RUN THE MIGRATION =====
migrate();
