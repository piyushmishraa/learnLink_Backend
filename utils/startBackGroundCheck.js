//get resource id
//check if resource is present
//if present do try catch blocka nad check for its url
//define  isEducational  as false for default and reson as ''
//if url contains youtube check through our checkyoutube if its not then check through checkgeneral
//if it comes out to be education then set isEducational true and you may proceed to save the resource with its status as approved

import Resources from "../models/resource.js"
import { checkGeneralContent } from "./checkGenralContent.js";
import { checkyoutubeVideo } from "./checkYoutubeVideo.js";
import { generateImageQuery } from "./generateImageQuery.js";
import { getUnsplashImage } from "./getUnsplashImage.js";

export const startBackGroundCheck = async (resourceId) => {
  // --- FIX: Change 'const' to 'let' here ---
  let isEducational = false; // <-- NOW IT CAN BE CHANGED
  let reason = "";           // <-- NOW IT CAN BE CHANGED

  try {
    const resource = await Resources.findById(resourceId);
    if (!resource) {
      // --- ALSO FIX: This line had a bug ---
      // You can't do resource.status(401) because 'resource' might be null.
      // Just throw an error or log it.
      console.error('Could not find resource in startbackgroundcheck');
      return;
    }
    const resourceUrl = resource.url;
    const title=resource.title;
    const category= resource.category;

    // --- FIX: Typo in 'youtu.be' ---
    if (resourceUrl.includes('youtube.com/') || resourceUrl.includes('youtu.be/')) {
      const result = await checkyoutubeVideo(resourceUrl);
      isEducational = result.approved; // <-- This is now allowed!
      reason = result.reason;          // <-- This is now allowed!

    } else {
      // --- FIX: Missing 'await' ---
      const result = await checkGeneralContent(resourceUrl, resource.title); // Added 'await'
      isEducational = result.approved;
      reason = result.reason;
    }

    //if isEducational is true then proceed to save with status change
    if (isEducational) {
      resource.status = 'approved';
      // --- FIX: Probably don't want to set rejection reason if it's approved ---
      try {
        const imageQuery=generateImageQuery(title,category);
        const unsplashData= await getUnsplashImage(imageQuery);
        if(unsplashData && unsplashData.imageUrl){
          resource.imageUrl=unsplashData.imageUrl;
          resource.imageAttribution = `Photo by ${unsplashData.photographerName} on Unsplash`;
        }

        
        console.log(`✅ Manager APPROVED resource: ${resourceId}`);
      } catch (error) {
        console.error('Failed to get Unsplash image:', error);
        resource.imageUrl = getIconForCategory(resource.category);
        resource.imageAttribution = '';
      }
      resource.rejectionReason = undefined; 
       await resource.save();

    } else {
      resource.status = 'rejected';
      resource.rejectionReason = reason;
      // --- FIX: Missing 'await' ---
      await resource.save(); // Added 'await'
      console.log(`❌ Manager REJECTED resource: ${resourceId}. Reason: ${reason}`);
    }

  } catch (error) {
    console.error('Manager had an error with resource:', resourceId, error);
    const resource = await Resources.findById(resourceId);
    if (resource) {
      resource.rejectionReason = `Check failed!! Had to perform check manually`;
      // --- FIX: Missing 'await' ---
      await resource.save(); // Added 'await'
    }
  }
}