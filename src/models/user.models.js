import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true, // Ensures fast query performance on username
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true, // Speeds up queries on email
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    avatar: {
      type: String,
      required: [true, "Avatar is required"],
    },
    coverImage: {
      type: String,
      required: false,
    },
    refreshToken: {
      type: String,
      required: false,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      lowercase: true,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
  },
  { timestamps: true }
);

// Hash password before saving user
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to check if the password is correct
userSchema.methods.isPasswordCorrect = function (password) {
  return bcrypt.compare(password, this.password);
};

// Combined token generation for access and refresh tokens
userSchema.methods.generateToken = function (type = "access") {
  const secretKey =
    type === "access"
      ? process.env.ACESS_TOKEN_SECRET
      : process.env.REFRESH_TOKEN_SECRET;
  const expiresIn =
    type === "access"
      ? process.env.ACESS_TOKEN_EXPIRY
      : process.env.REFRESH_TOKEN_EXPIRY;

  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    secretKey,
    { expiresIn }
  );
};

export const User = mongoose.model("User", userSchema);
