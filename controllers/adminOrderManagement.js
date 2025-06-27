import { response } from 'express';
import Order from '../models/orderModel.js'
import { getActiveOffers } from '../utils/offerUtils.js';
import User from '../models/userModel.js';
import Wallet from '../models/walletModel.js';

export const getOrdersPage = async(req,res)=>{
  try{
 
    

    const page = parseInt(req.query.page) || 1;   
    const limit = 5;                            
    const skip = (page - 1) * limit;



    const totalOrders = await Order.countDocuments();  // Total number of orders
    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await Order.find()
      .populate('userId', 'name email')
      .populate('items.productId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      const activeOffers = await getActiveOffers();


      orders.forEach(order=>{
        order.items = order.items.map(item =>{
         
           const product = item.productId;
           if (!product) return item;

           // Find applicable offers
           const productOffer = activeOffers.find(offer =>
               offer.offerType === 'product' &&
               offer.items.includes(product._id.toString())
           );
           const categoryOffer = activeOffers.find(offer =>
               offer.offerType === 'category' &&
               offer.items.includes(product.category?.toString())
           );

         
           const bestOffer = [productOffer, categoryOffer]
               .filter(Boolean)
               .sort((a, b) => b.discountPercentage - a.discountPercentage)[0];

           if (bestOffer) {
               item.originalPrice = product.price;
               item.discountPercentage = bestOffer.discountPercentage;
               item.discountedPrice = Math.round(product.price * (1 - bestOffer.discountPercentage / 100));
               item.offerName = bestOffer.offerName;
           } else {
               item.discountedPrice = product.price;
           }
           return item;
        })
      })
      res.render('admin/orders',{order:orders, 
        currentPage: page,
        totalPages: totalPages
      });

  }catch(error){
     console.error(error);
      res.status(500).render('error',{message:'server is down please try again later'});
  }
}

export const searchOrders = async (req, res) => {
  try {
    const { q = '', page = 1 } = req.query;
    console.log('Search query:', q, 'Page:', page);
    const limit = 5;
    const skip = (page - 1) * limit;

    let filter = {};
    if (q.trim()) {
      // Find users whose email matches the query
      const matchedUsers = await User.find({
        email: { $regex: q, $options: 'i' }
      }).select('_id');
      const userIds = matchedUsers.map(user => user._id);

      // Search by orderId or user email
      filter = {
        $or: [
          { orderId: { $regex: q, $options: 'i' } },
          { userId: { $in: userIds } }
        ]
      };
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('userId', 'name email')
        .populate('items.productId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter)
    ]);

    const activeOffers = await getActiveOffers();

    orders.forEach(order => {
      order.items = order.items.map(item => {
        const product = item.productId;
        if (!product) return item;

        const productOffer = activeOffers.find(offer =>
          offer.offerType === 'product' &&
          offer.items.includes(product._id.toString())
        );
        const categoryOffer = activeOffers.find(offer =>
          offer.offerType === 'category' &&
          offer.items.includes(product.category?.toString())
        );

        const bestOffer = [productOffer, categoryOffer]
          .filter(Boolean)
          .sort((a, b) => b.discountPercentage - a.discountPercentage)[0];

        if (bestOffer) {
          item.originalPrice = product.price;
          item.discountPercentage = bestOffer.discountPercentage;
          item.discountedPrice = Math.round(product.price * (1 - bestOffer.discountPercentage / 100));
          item.offerName = bestOffer.offerName;
        } else {
          item.discountedPrice = product.price;
        }
        return item;
      });
    });

    res.json({ orders, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
};



export const postOrderStatus = async(req,res)=>{
    try{

      console.log('testing the document')
        
        const {status} = req.body;
        const {orderId,itemId} = req.params;
      
        console.log('status is ',status)

      const order = await Order.findById(orderId);
   
     
      if(!order) 
        return res.status(404).json({message:'Order not found'});
         console.log(order);
         
        
 const item = order.items.id(itemId);
     if (!item) return res.status(404).json({ message: 'Item not found' });

     
     item.status = status;

     if(order.paymentMethod==='cod' && status==='Delivered'){
        order.paymentStatus = 'paid';
     }
     if(order.paymentMethod==='wallet' && status==='Delivered'){
        order.paymentStatus = 'paid';
     }

     console.log('thhis is the payment method',order.paymentMethod)

      await order.save();
        res.json({success:true})

        console.log('final triggering');
    }catch(error){

        console.error(error);
        res.status(500).json({ success: false, error: error.message });

    }
}


export const getOrderDetail = async(req,res)=>{
  try{
    const orderId = req.params.id;
    const orders = await Order.findById(orderId)
      .populate('userId')
      .populate('items.productId')
      .lean();

    

    if(!orders){
      return res.status(404).render('Order not found');
    }

    const activeOffers = await getActiveOffers();
    orders.items = orders.items.map(item=>{
      const product = item.productId;
      if(!product) return item;

      const productOffer = activeOffers.find(offer =>
        offer.offerType === 'product' &&
        offer.items.includes(product._id.toString())
      );
      const categoryOffer = activeOffers.find(offer =>
        offer.offerType === 'category' &&
        offer.items.includes(product.category?.toString())
      );

      const bestOffer = [productOffer, categoryOffer]
        .filter(Boolean)
        .sort((a, b) => b.discountPercentage - a.discountPercentage)[0];

      if (bestOffer) {
        item.originalPrice = product.price;
        item.discountPercentage = bestOffer.discountPercentage;
        item.discountedPrice = Math.round(product.price * (1 - bestOffer.discountPercentage / 100));
        item.offerName = bestOffer.offerName;
      } else {
        item.discountedPrice = product.price;
      }
      return item;
    });

    // Calculate subtotal (sum of discounted prices)
    let subtotal = 0;
    orders.items.forEach(item => {
      subtotal += (item.discountedPrice ? item.discountedPrice : item.productId.price) * item.quantity;
    });

    // Use order.discount and order.totalAmount if present, else fallback
    const couponDiscount = orders.discount || 0;
    const finalTotal = Math.max(subtotal - couponDiscount, 0);
  

    let summaryStatus = 'Mixed';
    if (orders.items && orders.items.length > 0) {
      const statuses = orders.items.map(i => i.status);
      const uniqueStatuses = [...new Set(statuses)];
      summaryStatus = uniqueStatuses.length === 1 ? uniqueStatuses[0] : 'Mixed';
    }

    return res.render('admin/Userorderdetail', {
      order: orders,
      summaryStatus,
      total: subtotal,
      finalTotal,
      couponDiscount
    });

  }catch(error){
    console.error(error);
    res.status(500).render('error',{ message:'server is down please try again later'});
  }
}


export const updateReturnStatus = async(req,res)=>{
  try{

    const {orderId,itemId} = req.params
    const {returnStatus} = req.body;
   

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    if (item.returnStatus !== 'Pending') {
      return res.status(400).json({ message: 'No pending return request' });
    }

    item.returnStatus = returnStatus;
    if(returnStatus === 'Accepted'){
      item.status ='Returned';

      // --- Process refund here ---
      const userId = order.userId;
      const wallet = await Wallet.findOne({ userId });
      if (wallet) {
        // Calculate total order item value (for coupon proration)
        const totalOrderItemValue = order.items.reduce((sum, i) => {
          return sum + ((i.discountedPrice || i.price) * i.quantity);
        }, 0);
        const itemValue = (item.discountedPrice || item.price) * item.quantity;
        let couponDiscountShare = 0;
        if (order.discount && totalOrderItemValue > 0) {
          couponDiscountShare = (itemValue / totalOrderItemValue) * order.discount;
        }
        let refundAmount = 0;
        if (item.discountedPrice) {
          refundAmount = item.discountedPrice * item.quantity;
          if (order.deliveryCharge) {
            refundAmount += order.deliveryCharge;
          }
        } else if (item.price) {
          refundAmount = item.price * item.quantity;
        } else {
          const product = await Game.findById(item.productId);
          refundAmount = product ? product.price * item.quantity : 0;
        }
        refundAmount -= couponDiscountShare;
        refundAmount = Math.max(0, Math.round(refundAmount));

        wallet.balance += refundAmount;
        wallet.transactions.push({
          id: Date.now().toString(),
          type: 'credit',
          amount: refundAmount,
          description: `Refund for approved return (${order.orderId})`,
          date: new Date(),
          status: 'completed'
        });
        await wallet.save();
      }

    }
    

    await order.save();
    return  res.json({success:true});

  }catch(error){
    res.status(500).render('error',{ message:'server is down please try again later'});
  }
}

