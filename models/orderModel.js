import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    items:[{
             productId:{
               type:mongoose.Schema.Types.ObjectId,
               ref:'Game',
               required:true,
               
           },
        quantity:Number,
        // total:Number,
         status: {
      type: String,
      enum: [
        'Pending',
        'Shipped',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'Returned'
      ],
      default: 'Pending'
    },
      returnStatus: {
    type: String,
    enum: ['None', 'Pending', 'Accepted', 'Denied'],
    default: 'None'
  },
   returnReason:{type:String}
    }],


shippingAddress:{
    // name:String,
    // phone:Number,
    // city:String,
    // state:String,
    // zipCode:String,
    // country:String,
    // type:String
      type: mongoose.Schema.Types.ObjectId,
  ref: 'Address',
  required: true

},

orderId:{
 type:String,
 unique:true,
 required:true,

},

  paymentMethod: { type: String, enum: ['cod', 'online', 'wallet'], default: 'cod' },



  

  totalAmount: Number,
  createdAt: { type: Date, default: Date.now }
});


const Order = mongoose.model('Order',orderSchema);

export default Order;

