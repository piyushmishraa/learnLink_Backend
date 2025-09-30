import axios from "axios";

export const checkBrowsing= async (url )=>{
    try {
         const response = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_API_KEY}`,
      {
        client: {
          clientId: "myfullstackapp",
          clientVersion: "1.0.0",
        },
        threatInfo: {
          threatTypes: [
            "MALWARE",
            "SOCIAL_ENGINEERING",
            "UNWANTED_SOFTWARE",
            "POTENTIALLY_HARMFUL_APPLICATION",
          ],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      }
    );
    if(response.data && response.data.matches){//means matches is not empty which means that it matched with malware,phising and other stuff
        return false ;
    }
    return true ;



    } catch (error) {
    console.error("Safe Browsing API error:", error);
    return false;
    }
}