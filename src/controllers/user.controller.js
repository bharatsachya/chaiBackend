import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiRespone.js";
import { ApiError } from "../utils/ApiHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

export default async function registerUser(req, res) {
  const { fullName, email, username, password } = req.body;
  console.log("Details:", fullName);

  if (
    [email, username, password, fullName].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //check if user already exists
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const avatarLocalPath = req.files.avatar[0].path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Image upload failed");
  }

  const user = await User.create({
    email,
    username,
    password,
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const userCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (userCreated) {
    res
      .status(201)
      .json(new ApiResponse(201, "User created successfully", user));
  } else {
    throw new ApiError(500, "User creation failed");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, "User created successfully", userCreated));
}
