import express from "express";

import { protectRoute } from "../middleware/protectRoute.js";
import { createPost,deletePost,commentOnPost,likeUnlikePost,getAllPosts,getLikedPosts,getFollowingPosts,getUserPosts} from "../controllers/post.controller.js";

const router = express.Router();

router.get('/all',protectRoute,getAllPosts)
router.get('/following',protectRoute,getFollowingPosts)
router.get('/user/:username',protectRoute,getUserPosts)
router.get('/like/:id',protectRoute,getLikedPosts)
router.post('/create',protectRoute,createPost)
router.post('/comment/:id',protectRoute,commentOnPost)
router.post('/like/:id',protectRoute,likeUnlikePost)
router.delete('/:id',protectRoute,deletePost)

export default router;