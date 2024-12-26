import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

export const signup = async(req,res)=>{
    
    try {

        const {username,email,fullName,password} = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if(!emailRegex.test(email)){
           return  res.status(400).json({error:"Invalid email format"})
        }
    
        const existingUser = await User.findOne({username});
        if(existingUser){
            return res.status(400).json({error:"username already taken"})
        }
    
        const existingEmail = await User.findOne({email});
        if(existingEmail){
            return res.status(400).json({error:"Email already taken"})
        }
    
        if(password.length<6){
            return res.status(400).json({error:"password length must be atlest 6 characters"})
        }
    
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt)
    
        const newUser = new User({
            fullName,
            email,
            username,
            password:hashedPassword
        })
    
        if(newUser){
            generateTokenAndSetCookie(newUser._id,res);
            await newUser.save();
    
            res.status(201).json({
                _id:newUser._id,
                username:newUser.username,
                email:newUser.email,
                fullName:newUser.fullName,
                coverImg:newUser.coverImg,
                profileImg:newUser.profileImg,
                followers:newUser.followers,
                following:newUser.following
            })
    
        }
    
        else {
            res.status(400).json({error:"Invalid user data"})
        }

        
    } catch (error) {
        console.log("Error in Signup controller",error.message)
        res.status(500).json({error:"Internal Server Error"})
        
    }

}

export const login = async(req,res)=>{
   try {

    const {username,password} = req.body;
    const user = await User.findOne({username})
    const isPasswordCorrect  = await bcrypt.compare(password,user?.password||"") // "?" is used because user can be null 

    if(!user || !isPasswordCorrect){
        return res.status(400).json({error:"Invalid username or password"})
    }

    
    generateTokenAndSetCookie(user._id,res);

    res.status(200).json({
        _id:user._id,
        username:user.username,
        fullName: user.fullName,
		email: user.email,
		followers: user.followers,
		following: user.following,
		profileImg: user.profileImg,
		coverImg: user.coverImg,

    })
    
    
   } catch (error) {
    console.log("Error in Login controller",error.message)
        res.status(500).json({error:"Internal Server Error"})
   }
}

export const logout = async(req,res)=>{
    try {
      res.cookie("jwt","",{maxAge:0})  
        res.status(200).json({message:"Logged out successfully"})
    } catch (error) {
        console.log("Error in Logout controller",error.message)
        res.status(500).json({error:"Internal Server Error"})
    }
}

export const getMe = async(req,res)=>{
    try {
        const user = await User.findById(req.user._id).select("-password")
        res.status(200).json(user)
      
    } catch (error) {
        console.log("Error in getMe controller",error.message)
        res.status(500).json({error:"Internal Server Error"})
    }
}