import { response } from 'express';
import Order from '../models/orderModel.js'
import { getActiveOffers } from '../utils/offerUtils.js';

export const getOrdersPage = async(req,res)=>{
    try{

        const orders = await Order.find().populate('userId','name email').populate('items.productId').sort({createdAt:-1}).lean()
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
        res.render('admin/orders',{order:orders});

    }catch(error){
       console.error(error);
        res.status(500).render('error',{message:'server is down please try again later'});
    }
}


export const postOrderStatus = async(req,res)=>{
    try{
        
        const {status} = req.body;
        const {orderId,itemId} = req.params;
        console.log(orderId,itemId)
        

      const order = await Order.findById(orderId);
      console.log(status)
     
      if(!order) 
        return res.status(404).json({message:'Order not found'});
         console.log(order);
         
        
 const item = order.items.id(itemId);
     if (!item) return res.status(404).json({ message: 'Item not found' });

     item.status = status;

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
    console.log('couponDiscount',couponDiscount)

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
        console.log('triggered')
        const {orderId,itemId} = req.params
        const {returnStatus} = req.body;
        console.log(itemId);
        
         
        const order = await Order.findById(orderId);
     if (!order) return res.status(404).json({ message: 'Order not found' });
      console.log('function triggering 1');
      
     const item = order.items.id(itemId);
     if (!item) return res.status(404).json({ message: 'Item not found' });
       console.log('function triggering 2');

        if (item.returnStatus !== 'Pending') {
      return res.status(400).json({ message: 'No pending return request' });
    }
    console.log('function triggered here')
    item.returnStatus = returnStatus;
    if(returnStatus === 'Accepted'){
        item.status ='Returned';
    }
    console.log('last trigger')

    await order.save();
     return  res.json({success:true});

      }catch(error){
         res.status(500).render('error',{ message:'server is down please try again later'});
      }
}