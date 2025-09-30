import axios from "axios";


export const checkToxicity=async(text)=>{

    try {
        const response=await axios.post(`https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${process.env.GOOGLE_SAFE_API_KEY}`,
            {
             comment: { text: text },
                requestedAttributes: {
                    TOXICITY: {}
                }
            }
            
             
        )
        const toxicityScore = response.data.attributeScores.TOXICITY.summaryScore.value;
        if(toxicityScore>0.7){
            return false ;
        }
        return true ;
        
    } catch (error) {
        console.log("persepctive api errro"+error);
        return false;
        
    }


}