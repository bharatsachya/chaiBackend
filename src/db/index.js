import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;

  try {
    const connectionInstance = await mongoose.connect(uri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error(error);
  }
}
