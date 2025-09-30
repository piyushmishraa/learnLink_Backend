import 'dotenv/config';
import { connectDB } from './db/db.js';
import Resources from './models/resource.js';
import { getUnsplashImage } from './utils/getUnsplashImage.js';

const migrateTitleBasedImages = async () => {
    console.log('🚀 Starting TITLE-BASED image migration...\n');
    
    try {
        await connectDB();
        console.log('✅ Connected to database');
        
        // Find ALL resources to replace category-based images with title-based ones
        const resourcesToUpdate = await Resources.find({
            // This will update ALL resources (both with and without images)
            $or: [
                { imageUrl: { $exists: false } },
                { imageUrl: null },
                { imageUrl: '' },
                { imageUrl: { $exists: true } } // This updates existing images too
            ]
        }) // Remove .limit(3) after testing

        console.log(`📊 Found ${resourcesToUpdate.length} resources to update with title-based images\n`);
        
        if (resourcesToUpdate.length === 0) {
            console.log('🎉 No resources need image updates!');
            process.exit(0);
        }

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < resourcesToUpdate.length; i++) {
            const resource = resourcesToUpdate[i];
            
            console.log(`\n[${i + 1}/${resourcesToUpdate.length}] Processing: "${resource.title}"`);
            
            try {
                // Clean up title for better search results
                const cleanTitle = cleanTitleForImageSearch(resource.title);
                
                console.log(`   🔍 Searching with title: "${cleanTitle}"`);
                
                // Get image based on title
                const imageData = await getUnsplashImage(cleanTitle);
                
                if (imageData) {
                    await Resources.findByIdAndUpdate(resource._id, {
                        imageUrl: imageData.imageUrl,
                        imageAttribution: `Photo by ${imageData.photographerName} (@${imageData.photographerUsername}) on Unsplash`
                    });
                    
                    console.log(`   ✅ SUCCESS: Added unique image by ${imageData.photographerName}`);
                    successCount++;
                } else {
                    // Fallback to category if title doesn't work
                    console.log(`   ⚠️  Title search failed, trying category: "${resource.category}"`);
                    
                    const fallbackImageData = await getUnsplashImage(resource.category || 'programming');
                    
                    if (fallbackImageData) {
                        await Resources.findByIdAndUpdate(resource._id, {
                            imageUrl: fallbackImageData.imageUrl,
                            imageAttribution: `Photo by ${fallbackImageData.photographerName} (@${fallbackImageData.photographerUsername}) on Unsplash`
                        });
                        console.log(`   ✅ SUCCESS (fallback): Added image by ${fallbackImageData.photographerName}`);
                        successCount++;
                    } else {
                        console.log(`   ❌ FAILED: Could not fetch image for this resource`);
                        failCount++;
                    }
                }
                
            } catch (error) {
                console.log(`   ❌ ERROR: ${error.message}`);
                failCount++;
            }
            
            // Rate limiting
            if (i < resourcesToUpdate.length - 1) {
                console.log(`   ⏳ Waiting 3 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        // Final results
        console.log('\n' + '='.repeat(50));
        console.log('🎉 TITLE-BASED MIGRATION COMPLETED!');
        console.log('='.repeat(50));
        console.log(`✅ Successfully updated: ${successCount} resources`);
        console.log(`❌ Failed to update: ${failCount} resources`);
        console.log(`📊 Total processed: ${resourcesToUpdate.length} resources`);
        
        if (successCount > 0) {
            console.log('\n🔥 Your resources now have unique, title-relevant images!');
        }
        
    } catch (error) {
        console.error('\n💥 MIGRATION FAILED:', error.message);
    } finally {
        console.log('\n👋 Closing database connection...');
        process.exit(0);
    }
};

// Helper function to clean titles for better image search
const cleanTitleForImageSearch = (title) => {
    return title
        .toLowerCase()
        // Remove common programming words that don't help with image search
        .replace(/\b(tutorial|guide|how to|learn|complete|beginner|advanced|course|lesson)\b/g, '')
        // Remove version numbers and special characters
        .replace(/\b(v?\d+(\.\d+)*)\b/g, '') // Remove version numbers like "v2.1", "3.0"
        .replace(/[^\w\s]/g, ' ') // Remove special characters
        // Remove extra spaces
        .replace(/\s+/g, ' ')
        .trim()
        // Limit to first few meaningful words (better search results)
        .split(' ')
        .slice(0, 3) // Take only first 3 words
        .join(' ')
        // Fallback if title becomes empty
        || 'programming technology';
};

// Run the migration
migrateTitleBasedImages();