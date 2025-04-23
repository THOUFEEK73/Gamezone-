// models/userModel.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String }, // Optional: include phone if you're collecting it
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: true }, // Add this field for email verification
  isAdmin: { type: Boolean, default: false },
  joinedDate:{type:Date,default:Date.now} // Add this field for admin access
  
}, { timestamps: true }); // automatically add createdAt , updateAt field on your schema to track when records are created or updates

const User = mongoose.model('User', userSchema); // usersSchema is the strucute of how the datas are wants to store on the database

export default User;
