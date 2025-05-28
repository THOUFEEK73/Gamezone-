import { response } from 'express';
import Order from '../models/orderModel.js'

export const getOrdersPage = async(req,res)=>{
    try{

        const orders = await Order.find().populate('userId','name email').sort({createdAt:-1}).lean()

        res.render('admin/orders',{order:orders});

    }catch(error){

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
         console.log(orderId);
         const orders = await Order.findById(orderId).populate('userId').populate('items.productId').populate('shippingAddress')
      console.log(orders.items)
         if(!orders){
            return res.status(404).render('Order not found');
         }


 console.log('helo');
 
return res.render('admin/Userorderdetail',{order:orders});


     }catch(error){

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