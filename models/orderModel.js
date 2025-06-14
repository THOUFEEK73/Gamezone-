import mongoose from 'mongoose';
import Razorpay from 'razorpay';

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true,

    },
    productTitle: String,
    quantity: Number,

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
    returnReason: { type: String }
  }],
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  orderId: {
    type: String,
    unique: true,
    required: true,

  },
  razorpayOrderId: {
    type: String,
    unique: true,
    sparse: true
  },
  coupon: {
    type: String,
  },
  discount: {
    type: Number, default: 0
  },
  paymentMethod: { type: String, enum: ['cod', 'razorpay', 'wallet'], default: 'cod' },
  paymentStatus:{
    type: String, 
    enum: ['pending', 'paid', 'failed'], 
    default: 'pending' 
  },
  totalAmount: Number,
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

export default Order;

