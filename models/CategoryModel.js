import mongoose from 'mongoose';


const categorySchema = new mongoose.Schema({
    categoryName:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        
    },
    status:{
        type:String,
        enum:['active','inactive'],
        default:'active',
    }
})

const Category = mongoose.model('Category',categorySchema);
export default Category;
