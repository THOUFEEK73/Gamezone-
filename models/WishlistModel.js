import mongoose from 'mongoose';


const wishlistSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    products:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:'Game',
        default:[],
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})
const Wishlist = mongoose.model('Wishlist', wishlistSchema);
export default Wishlist