import mongoose from 'mongoose';

const gameCompanySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
    },
    status:{
        type:String,
        enum:['active','inactive'],
        default:'active',
    }
},{timestamps:true});

export default mongoose.model('GameCompany',gameCompanySchema);