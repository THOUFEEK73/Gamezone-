import mongoose, { mongo } from 'mongoose';


const cartSchema = new mongoose.Schema({
  
 
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    },
    products:[{
        productId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Game',
        required:true,
        
    },
    quantity:{
        type:Number,
        required:true,
        min:1,
        default:1,
    },
    name:String,
    price:Number
}],

    active:{
        type:Boolean,
        default:true,
    },
    modifiedOn:{
        type:Date,
        default:Date.now
    }
 

},{timestamps:true})

const Cart = mongoose.model('Cart',cartSchema);

export default Cart;