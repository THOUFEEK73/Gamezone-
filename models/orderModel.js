import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    items:[{
        productsId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Game'
        },
        quantity:Number,
        // total:Number,
    }
],


shippingAddress:{
    name:String,
    phone:Number,
    city:String,
    state:String,
    zipCode:String,
    country:String,
    type:String

},

orderId:{
 type:String,
 unique:true,
 required:true,

},

  paymentMethod: { type: String, enum: ['cod', 'online', 'wallet'], default: 'cod' },
  status: { type: String, enum: ['Placed', 'Cancelled', 'Returned'], default: 'Placed' },
  totalAmount: Number,
  createdAt: { type: Date, default: Date.now }
});


const Order = mongoose.model('Order',orderSchema);

export default Order;

