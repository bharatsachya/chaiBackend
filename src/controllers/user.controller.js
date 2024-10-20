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
    user.refreshToken = refreshToken
    console.log(user.refreshToken)
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
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required");
    }


    let coverImageLocalPath;
    console.log(req.files)
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
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
    // console.log(user)
    //remove password and refresh token from response
    //check for errors
    const userCreated = await User.findById(user._id).select("-password -refreshToken")
    
    if(!userCreated){
        throw new ApiError(500,"User creation failed");
    }
    // console.log(userCreated)
    //send response
    return res.status(201).json(new ApiResponse(200,"User created successfully",userCreated))
})

const loginUser = asyncHandler(async (req,res)=>{
    // req->body->data
   const {email,username,password}=req.body
   //username access 
   if(!(username || email))
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
    const userLoggedIn = await User.findById(user._id).select("-password -refreshToken")
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
                user:userLoggedIn, accessToken, refreshToken
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

const refreshAcessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.body.refershToken || req.cookies.refershToken
  
    if(!incomingRefreshToken){
        throw new ApiError(401,"refresh Token is not valid")
    }
    
    try {
        const decodedToken = await jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"User is invalid")
        }
        if(incomingRefreshToken !== user.refershToken){
            throw new ApiError(400,"User doesnt Exist")
        }
        const options = {
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        res
        .status(200)
        .cookie("acessToken",acessToken,options)
        .cookie("refreshToken",refershToken,options)
        .json(
           new ApiRespone(200,
            {acessToken,refreshToken:newRefreshToken},
            "acess token is refreshed sucessfully"
           )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "something went wrong" )
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {newPassword,oldPassword } = req.body

    if(!(newPassword || oldPassword)){
        throw new ApiError(400, "Please Enter Password")
    }

    const user = await User.findById(req.user._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new ApiError(400,"Password is Incorrect")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200).json(
        new ApiRespone(200,req.user,"Here Is your current User")
    )
})

const getCurrentUser = asyncHandler(async (req,res)=>{
   return res.status(200).json(
    new ApiRespone(200,req.user,"Here Is your current User")
   )
})

const updateAccountDetails = asyncHandler( async(req,res)=>{
    const {email,fullName} = req.body
    if(!(email || fullName)){
        throw new ApiError(400,"email and username is required")
    }
   try {
     const user = await User.findByIdAndUpdate(req.user?._id,
    {
       $set:{
          email:email,
         fullName:fullName
       }
     },{
         new:true
     }).select("-password")
 
     res.status(200)
     .json(
      new ApiRespone(   
        200,
        {},
        "User updated Sucessfully")
     )
   } catch (error) {
      throw new ApiError(400,"something went wrong")
   }
})

const updateAvatarImage = asyncHandler(async(req,res)=>{
   const avatarImageLocalPath= req.file?.path
   if(!avatarImageLocalPath) {
    throw new ApiError(400,"avatar is missing")
   }

   const avatar = await uploadOnCloudinary(avatarImageLocalPath)
   if(!avatar.url){
    throw new ApiError(400,"error while uploading")
   }

   const user = await User.findById(
     req.user?._id,
     {
        $set:{
            avatar:avatar.url
        }
     },
     {
        new :true   
     }
   ).select("-password")

   return res.status(200).json(new ApiRespone(200,
    user,"avatar is updated successfully")
   )
})


const updateCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath= req.file?.path
    if(!coverImageLocalPath) {
     throw new ApiError(400,"cover is missing")
    }
 
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
     throw new ApiError(400,"error while uploading cover")
    }
 
    const user = await User.findById(
      req.user?._id,
      {
         $set:{
             coverImage:coverImage.url
         }
      },
      {
         new :true   
      }
    ).select("-password")
 
    return res.status(200).json(new ApiRespone(200,
     user,"coverImage is updated successfully")
    )
 })


export {registerUser,
    loginUser,
    logoutUser,
    refreshAcessToken
};
