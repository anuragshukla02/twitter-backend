import Post from "../models/post.model.js"
import User from "../models/user.model.js"
import Notification from "../models/notification.model.js";
import { v2 as cloudinary } from "cloudinary";

export const createPost = async(req,res)=>{
    try {
      const {text} = req.body;
      let {img} = req.body;
      
      const userId = req.user._id.toString();
      
      const user = await User.findById(userId);
      if(!user){
        return res.status(404).json({message:"User not found"});
      }

      if(!text && !img){
        return res.status(400).json({error:"Post must have either a image or text"});
      }

      if(img){

        const uploaderResponse = await cloudinary.uploader.upload(img);
        img = uploaderResponse.secure_url;
      }

      const newPost = new Post({
        user:userId,
        text,
        img
      })

      await newPost.save()

      res.status(201).json(newPost)

    } catch (error) {
        console.log("Error in the createPost controller",error.message);
        return res.status(500).json({error:"Internal Server Error"})
    }
}

export const deletePost = async(req,res)=>{
    const postId = req.params.id;
    try {
     const post = await Post.findById(postId)
     if (!post){
        return res.status(404).json({error:"Post not found"})
     }

     if(post.user.toString() !== req.user._id.toString()){
        return res.status(401).json({error:"You are not authorised to delete this post"})
     }

     if(post.img){
        const imgId = post.img.split('/').pop().split(".")[0];
        await cloudinary.uploader.destroy(imgId)
     }

     await Post.findByIdAndDelete(postId);

     res.status(200).json({message:"Post deleted successfully"})
        
    } catch (error) {
        console.log("Error in the deletePost controller",error.message);
        return res.status(500).json({error:"Internal Server Error"})
    }
}

export const commentOnPost = async(req,res)=>{
    const {text} = req.body;
    const postId = req.params.id;
    const userId = req.user._id;
    try {
        if(!text){
            return res.status(400).json({error:"Text field is required"})
        }

        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({error:"Post not found"})
        }

        const comment = {user:userId,text};
        post.comments.push(comment)
        
        await post.save()
        res.status(200).json(post)

    } catch (error) {
        console.log("Error in the commentOnPost controller",error.message);
        return res.status(500).json({error:"Internal Server Error"})
    }
}

export const likeUnlikePost = async(req,res)=>{
    const {id:postId} = req.params;
    const userId = req.user._id;
    try {
      const post = await Post.findById(postId);
      if(!post){
        return res.status(404).json({error:"Post not found"})
      }  

      const userLikedPost = post.likes.includes(userId)
      if(userLikedPost){
        // unlike post
        await Post.updateOne({_id:postId},{$pull:{likes:userId}})
        await User.updateOne({_id:userId},{$pull:{likedPosts:postId}})
        const updatedLikes = post.likes.filter((id)=>id.toString()!== userId.toString())
        return res.status(200).json(updatedLikes)
      }

      else{
        // like post
        post.likes.push(userId);
        await User.updateOne({_id:userId},{$push:{likedPosts:postId}})
        await post.save();

        const notification = new Notification({
            from:userId,
            to: post.user,
            type:"like"
        })

        await notification.save()

        const updatedLikes = post.likes;
        res.status(200).json(updatedLikes)
      }

        
    } catch (error) {
        console.log("Error in the likeUnlikePost controller",error.message);
        return res.status(500).json({error:"Internal Server Error"})
    }
}

export const getAllPosts = async(req,res)=>{
    try {
        const posts = await Post.find()
                    .sort({createAt:-1}) 
                    .populate({
                        path:"user",
                        select:"-password"
                    })
                    .populate({
                        path:"comments.user",
                        select:"-password"
                    })

        if(posts.length === 0){
            return res.status(200).json([])
        }
        
        res.status(200).json(posts)
    } catch (error) {
        console.log("Error in the getAllPosts controller",error.message);
        return res.status(500).json({error:"Internal Server Error"})
    }
}

export const getLikedPosts = async(req,res)=>{
    const userId = req.params.id
    try {
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({error:"User not found"})
        }

        const likedPosts = await Post.find({_id:{$in:user.likedPosts}})
                                    .populate({
                                        path:"user",
                                        select:"-password"
                                    })
                                    .populate({
                                        path:"comments.user",
                                        select:"-password"
                                    })

        res.status(200).json(likedPosts)

        
    } catch (error) {
        console.log("Error in the getLikedPosts controller",error.message);
        return res.status(500).json({error:"Internal Server Error"})
    }
}

export const getFollowingPosts = async(req,res)=>{
    const userId = req.user._id.toString()
    try {

        const user = await User.findById(userId)
        if(!user){
            return res.status(404).json({error:"User not found"})
        }        

        const following = user.following;

        const feedPosts = await Post.find({user:{$in:following}})
                                    .sort({createAt:-1})
                                    .populate({
                                        path:"user",
                                        select:"-password"
                                    })
                                    .populate({
                                        path:"comments.user",
                                        select:"-password"
                                    })

        res.status(200).json(feedPosts)
    } catch (error) {
        console.log("Error in the getFollowingPosts controller",error.message);
        return res.status(500).json({error:"Internal Server Error"})
    }
}

export const getUserPosts = async(req,res)=>{
    const username = req.params.username;
    try {
       const user = await User.findOne({username});

       if(!user){
        return res.status(404).json({error:"User not found"})
       }

       const userPosts = await Post.find({user:user._id})
                                   .sort({createAt:-1}) 
                                   .populate({
                                    path:"user",
                                    select:"-password"
                                   }) 
                                   .populate({
                                    path:"comments.user",
                                    select:"-password"
                                   })

        res.status(200).json(userPosts)
    } catch (error) {
        console.log("Error in the getUserPosts controller",error.message);
        return res.status(500).json({error:"Internal Server Error"})
    }
}