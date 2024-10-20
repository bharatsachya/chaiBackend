import { ApiError } from "../utils/ApiHandler.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.models.js";
import jwt from 'jsonwebtoken'
 
export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
         const token = req.cookies?.accessToken || req.headers("Authorization")?.replace("Bearer","")   
            if(!token){
                throw new ApiError(401,"unauthorized user")
            }
            const decodedToken = jwt.verify(token,process.env.ACESS_TOKEN_SECRET)
    
           const user = await User.findById(decodedToken._id).select("-refershToken, -password")
    
           if(!user){
                  throw new ApiError(401,"unauthorized user")
               }    
           req.user=user
        next()
    } catch (error) {
        throw new ApiError(401,"unauthorized user")
    }
})