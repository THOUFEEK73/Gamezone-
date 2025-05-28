// models/userModel.js
import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    googleId:{
        type:String,
        required:false,
    },
    name:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phone:{
        type:String,
        required:false,
    },
    password:{
        type:String,
        required:function(){
            return !this.googleId
        }
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    avatar:{
        type:String,
        default: null
        
    },
    resetPasswordToken:{
        type:String,
    },
    resetPasswordExpires:{
        type:Date,
    },
    
},{timestamps:true});

const User = mongoose.model('User', userSchema); // usersSchema is the strucute of how the datas are wants to store on the database

export default User;
