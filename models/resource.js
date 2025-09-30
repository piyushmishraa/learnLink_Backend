import mongoose from "mongoose";

const resourcesSchema=  new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  // likes: { type: Number, default: 0, min: 0 },
  // dislikes: { type: Number, default: 0, min: 0 }
  likes:[{type:mongoose.Schema.Types.ObjectId,ref:'User'}],
  saves:[{type:mongoose.Schema.Types.ObjectId,ref:'User',default: []}],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  status:{ type : String,enum:['pending','rejected','approved'],default:'pending'},//This is like a dropdown menu. The status can ONLY be one of these three words.
  rejectionReason:{type:String},
  imageUrl:{type:String},
  imageAttribution: { type: String }
},{timestamps:true });

const Resources = mongoose.model("Resources",resourcesSchema);
export default Resources;