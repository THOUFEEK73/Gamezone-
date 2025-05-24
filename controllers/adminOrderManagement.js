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


export const getOrderDetailPage = async(req,res)=>{
     try{
    
         const orderId = req.params.id;
         console.log(orderId);
         const orders = await Order.findById(orderId).populate('userId').populate({path:'items.productId'}).populate('shippingAddress')
      console.log(orders.items)
         if(!orders){
            return res.status(404).render('Order not found');
         }



res.render('admin/userOrderDetail',{order:orders});
     }catch(error){

     }
    
}