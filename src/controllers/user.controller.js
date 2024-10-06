import {asyncHandler} from '../utils/asynchandler.js';
import { upload } from '../middlewares/multer.middleware.js';
import { User } from '../models/user.models.js';
import { ApiResponse } from '../utils/ApiRespone.js';
import { ApiError } from '../utils/ApiHandler.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
const registerUser = asyncHandler(async (req,res,next)=>{
    //get user details from request body
    const { fullName, email, username, password} = req.body()
    
    //check validations
    console.log("email: ",email);
    if([email,username,password,fullName].some((field) => field?.trim() === "")){
        throw new ApiError(400,"All fields are required");
    }
    
    //check if user already exists
    const existedUser = User.findOne({
        $or:[{email},{username}]
     })
     if(existedUser){
         throw new ApiError(409,"User already exists");
     }
    //check for images,coverimage
    console.log(req.files)
    const avatarLocalPath = await req.files?.avatar[0]?.path;
    const coverImageLocalPath = await req.files?.coverImage[0]?.path;
    
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required");
    }

    //uplaod images to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(500,"Image upload failed");
    }

    //create user
    User.create({
        email,
        username,
        password,
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
    })
    //remove password and refresh token from response
    //check for errors
    const userCreated = await User.findById(user._id).select("-password -refreshToken")
    
    if(userCreated){
            res.status(201).json(new ApiResponse(201,"User created successfully",user))
    }
    else{
        throw new ApiError(500,"User creation failed");
    }
    //send response
    return res.status(201).json(new ApiResponse(200,"User created successfully",userCreated))
})

export {registerUser};
