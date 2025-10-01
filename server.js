import 'dotenv/config';
import bodyParser from "body-parser";
import express from "express";
import cors from "cors";
import fs from "fs" ;
import { fileURLToPath } from "url";
import { dirname,join } from "path";
import axios from "axios";
import {connectDB} from "./db/db.js"
import User from './models/user.js';
import jwt from "jsonwebtoken";
import Resources from './models/resource.js';
import { checkBrowsing } from './utils/checkBrowsing.js';
import { checkToxicity } from './utils/checkToxicity.js';
import { checkBadWord } from './utils/checkBadWords.js';
import { startBackGroundCheck } from './utils/startBackGroundCheck.js';
const app=express();
const PORT = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)
//middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(bodyParser.json());


//middleware to check auth

const authmiddleware= (req,res,next)=>{
  const token= req.header('Authorization')?.replace('Bearer ','');
  if(!token){
      return res.status(401).json({message:"No token was found"});

   }
  try {
    
    const decoded=jwt.verify(token,process.env.JWT_SECRET);//decode the token from string to what the payload we send 
    req.user=decoded;
    next();

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
}




//connect to database

connectDB();
app.get('/resources', authmiddleware, async (req, res) => {
  try {
    const currentUser = req.user.userId;
    
    const resources = await Resources.find({
      $or: [
        { status: 'approved' },
        { status: { $exists: false } }
      ]
    }).populate('userId', 'email');

    const resourcesWithLikeStatusSavedStatus = resources.map(resource => ({
      _id: resource._id,
      title: resource.title,
      imageUrl: resource.imageUrl,
      description: resource.description,
      url: resource.url,
      userId: resource.userId, 
      likes: resource.likes,
      saved:resource.saves,
      noOfLikes: resource.likes ? resource.likes.length : 0,
      isLikedByUser: resource.likes ? 
        resource.likes.some(id=>id.toString()===currentUser.toString()):false,
      isSavedByUser:resource.saves?
        resource.saves.some(id=>id.toString()===currentUser.toString()):false,
      category:resource.category
    }));
    
    res.json({
      resource: resourcesWithLikeStatusSavedStatus,
      currentUser
    });
    
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



//articles route
app.get('/articles', authmiddleware,(req, res) => {

    const promise = axios.get('https://dev.to/api/articles');
    promise.then((response) => {
        
        res.json(response.data);
    }).catch((error) => {
       
        res.status(500).json({ message: "Failed to fetch articles" });
    });
});

//dlike post request route 
app.post('/resources/:id/like', authmiddleware, async (req, res) => {
    const userId = req.user.userId;
    const resourceId = req.params.id;
    
    try {
        const resource = await Resources.findById(resourceId);
        
        if (!resource) {
            return res.status(404).json({ message: "resource not found" });
        }
        
        // Toggle like status
        if (resource.likes.some(id => id.toString() === userId.toString())) {
            resource.likes.pull(userId);
        } else {
            resource.likes.push(userId);
        }
        
        // Save to database
        const savedResource = await resource.save();
        res.json(savedResource);
        
    } catch (error) {
        console.error('Like endpoint error:', error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});


//dislike post request route 

app.post('/resources/:id/save',authmiddleware,async(req,res)=>{
  const userId=req.user.userId;
  const resourceId=req.params.id;

  if(!resourceId){
  return   res.status(404).json({message:"resource not found"});
  }
  const resource=await Resources.findById(resourceId);
  if(!resource){
    return res.status(404).json({message:"resource notfound"}); 

  }
  if(resource.saves.some(id=>id.toString()===userId.toString())){
    resource.saves.pull(userId);
  }else{
    resource.saves.push(userId);
  }
   
  await resource.save();
  res.json(resource);

})

// testing in neovim
//post resource route 
app.post('/resources',authmiddleware,async(req,res)=>{
    const {title,category,url}=req.body;
    const isSafe=  await checkBrowsing(url);
    const  isTitleSafe= await checkToxicity(title);
    const  isCategorysafe= await checkToxicity(category);

    const urlProfane=  checkBadWord(url);
    const titleProfane= checkBadWord(title);
    const categoryProfane =checkBadWord(category);


    if(!isSafe){
    return  res.status(400).json({message:"unsafe  url link"});
    }

    if(!isTitleSafe){
      return res.status(400).json({message:"Title contains inappropriate content"})
    }
    
     if(!isCategorysafe){
      return res.status(400).json({message:"Category contains inappropriate content"})
    }

    //profanity checks 

    if (!titleProfane) {
            return res.status(400).json({ message: "Title contains inappropriate words" });
    }
     if (!categoryProfane) {
            return res.status(400).json({ message: "Category contains inappropriate words" });
    }

     if (!urlProfane) {
            return res.status(400).json({ message: "url contains inappropriate words" });
    }
    try {
      const resource= new Resources({
      title,
      category,
      url,
      userId:req.user.userId,
      status:'pending' //This is new! We are explicitly setting the status.
     });

    await resource.save();
    res.status(202).json({message:"Resource submitted successfully,it is now under review and will appear if approved ",resourceId:resource._id});
    startBackGroundCheck(resource._id);
    } catch (error) {
      res.status(500).json({ message: 'could not upload resource ' });
    }
    



})


//sign up route 
app.post('/api/signup',async (req,res)=>{
  const {email,password}= req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user= new User({email,password});
    await user.save();
    res.status(201).json({message:"user successfully created "});
  } catch (error) {
    console.log("sign up error"+error.message);
    res.send(500).json({message:"signup could not be compelted due to serve error "});
    
  }

});

//login ropute 
 app.post('/api/login',async (req,res)=>{
  const{email,password}= req.body;
  try {
    const user= await User.findOne({email});
    if(!user){
      return res.status(400).json({message:"invalid credentials"});

    }
     const isMatch=await user.comparePassword(password);
     if(!isMatch){
      return res.status(400).json({message:"invalid credentiasl"});
     }
     const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
     res.json({token});
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed due to server error' });
  }
  
 })


 //profile route 
 app.get('/api/profile',authmiddleware,async (req,res)=>{

  try {
    const user= await User.findById(req.user.userId).select('-password');
    if(!user){
      res.status(401).json({message:"User is noth authorised in profile"});
    }
    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
 })


 // migration 

 // Run this ONCE to fix your existing default resources


app.listen(PORT,()=>{
    console.log(`app is listening on port ${PORT}`);
    
})
