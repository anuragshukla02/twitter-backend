import User from "../models/user.model.js";
import jwt from "jsonwebtoken"

export const protectRoute = async (req,res,next)=>{
    try {
        const token = req.cookies.jwt;
        if(!token){
            return res.status(401).json({error:"Unauthorised: Token not provided"})
        }
    
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        // console.log(decoded)
        if(!decoded) {
            return res.status(401).json({error:"Unauthorised : Token not valid"})
        }
    
        const user = await User.findById(decoded.userId).select("-password")
    
        req.user = user;
        next()
    
        
    } catch (error) {
        console.log("Error in the protectRoute controller",error.message)
        res.status(500).json({error:"Internal Server Error"})

    }
}