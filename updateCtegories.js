import 'dotenv/config'; 
import mongoose from "mongoose";
import Resources from "./models/resource.js";
import { connectDB } from "./db/db.js";

const categoryMapping={
    "DSA Practice": "Practice & Coding Challenges",
  "Practice": "Practice & Coding Challenges",
  "Documentation": "Documentation & References",
  "Courses": "Learning & Courses",
  "System Design": "System Design & Architecture",
  "Tools": "Tools & Utilities",
  "Cheatsheets": "Quick References & Cheatsheets",
  "Learning Tools": "Learning Resources & Guides",
  "Theory": "Learning Resources & Guides",
  "Collections": "Collections & Open Source",
  "Open Source": "Collections & Open Source",
  "Roadmaps": "Learning Resources & Guides",
  // Handle test/invalid categories
  "testing": null, // Will be handled specially
  "testing 2": null,
  "Education": "Learning & Courses"

};

async function updateCategories() {
    try {
        await connectDB();
        const resources= await Resources.find({});
        console.log("found all resource" + resources.length);

        let updates=0;
        let skipped=0;
        for(const resource of resources){
            const oldCategory=resource.category;
            const newCategory=categoryMapping[oldCategory];//it might look like an getting stuff from array but object[item] works on object as well so its fine
            if(newCategory){
                await Resources.findByIdAndUpdate(resource._id,{category:newCategory});
                updates++;
            }else if (newCategory === null) {
        // Handle test resources - maybe delete them?
                console.log(`Skipping test resource: ${resource.title}`);
                skipped++;
            } else {
                // Unknown category - log for manual review
                console.log(`Unknown category: ${oldCategory} for resource: ${resource.title}`);
                skipped++;
            }
        }

           console.log(`\nMigration complete!`);
           console.log(`Updated: ${updates} resources`);
           console.log(`Skipped: ${skipped} resources`);
    } catch (error) {
        console.error('Migration failed:', error);
    }finally{
        await mongoose.connection.close();
    }
    
    
}
updateCategories();