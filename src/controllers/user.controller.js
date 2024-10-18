import {asyncHandler} from '../utils/asynchandler.js';
import { User } from '../models/user.models.js';
import { ApiResponse } from '../utils/ApiRespone.js';
import { ApiError } from '../utils/ApiHandler.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const generateAccessAndRefreshToken = async(userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAcessToken()
    const refreshToken = user.generateRefreshToken() 

    user.refreshToken = refreshToken()

    await user.save({validateBeforeSave:false})
    return {accessToken,refreshToken} 

  } catch (error) {
    throw new ApiError(500,"something went wrong while generating access and refresh token")
  }
};


const registerUser = asyncHandler(async (req,res,next)=>{


    // //get user details from request body
    const { fullName, email, username, password} = req.body;
    console.log(fullName, email, username, password);
    
    
    //check validations
    console.log("email: ",email);
    if([email,username,password,fullName].some((field) => field?.trim() === "")){
        throw new ApiError(400,"All fields are required");
    }
    
    //check if user already exists
    const existedUser = await User.findOne({
        $or:[{email},{username}]
     })
     if(existedUser){
         throw new ApiError(409,"User already exists");
     }
    //check for images,coverimage
    console.log(req.files)

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
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
    const user = await User.create({
        email,
        username,
        password,
        fullName,
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

const loginUser = asyncHandler(async (req,res)=>{
    // req->body->data
   const {email,username,passwordx}=req.body
   //username access 
   if(!username || !email)
   {
    throw new ApiError(400,"username or email is required")
   }
    //ind the user
   const user = await User.findOne({
     $or:[{username},{email}]
   })
   
   if(! user){
    throw new ApiError(404,"user is not found")
   }
    
    //password check

   const isPasswordValid = await user.isPasswordCorrect(password)
 
   if(!isPasswordValid){
     throw new ApiError(400,"Entered Correct PAssword")
   }
    
    //acess and refresh token generate
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    //send cookies
    const userLoggedIn = await User.findById(user._id).select("-password","-refreshToken")
    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:userLoggedIn, acessToken, refreshToken
            },
            "user Logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req, res) =>{
    await User.findByIdAndUpdate(req.user._id,{
        $set:{
            refreshToken:undefined
        }
    },
    {
    new:true
    }
    )
    const options = {
        httpOnly:true,
        secure:true
    }
   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200,{}, "User logged out successfully"))
})

export {registerUser,
    loginUser,
    logoutUser
};
