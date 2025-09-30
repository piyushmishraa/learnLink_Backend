import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,

    },
    password:{
        type: String,
        required: true,
    }

},{
    timestamps:true
});


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

//in here we define the function to comapre  passwords 
userSchema.methods.comparePassword=async function(candidatePassword){
    return await bcrypt.compare(candidatePassword,this.password);
}

const User= mongoose.model("User",userSchema);
export default User;