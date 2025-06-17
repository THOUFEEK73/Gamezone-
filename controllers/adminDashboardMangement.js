import Order from "../models/orderModel.js";
import User from "../models/userModel.js";

export const getDashBoardPage = async(req,res)=>{

 try{

    const totalRevenue = await Order.aggregate([
        { $match: {paymentStatus: 'paid' } },
        { $group: { _id: null, sum: { $sum: "$grandTotal" } } }
      ]);

      const totalOrders = await Order.countDocuments();
      const totalCustomers = await User.countDocuments();
      const pendingDelivery = await Order.countDocuments({'items.status':{$in:['Pending']}})

      res.render('admin/dashboard', {
        totalRevenue: totalRevenue[0]?.sum || 0,
        totalOrders,
        totalCustomers,
        pendingDelivery,
     
      });
 }catch(error){
    console.error('Error while fetching admin Dashboard',error);
    res.status(500).render('error',{message: 'server is down please try again later'});
 }

  
}


export const getDashBoardFilter = async (req, res) => {
    try {
      const { filter } = req.query;
    
      let match = {};
      const now = new Date();
  
      if (filter === 'daily') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        match.createdAt = { $gte: start, $lt: end };
      } else if (filter === 'yearly') {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear() + 1, 0, 1);
        match.createdAt = { $gte: start, $lt: end };
      } else if (filter === 'monthly') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        match.createdAt = { $gte: start, $lt: end };
      }
  
      const totalRevenue = await Order.aggregate([
        { $match: { ...match, paymentStatus: 'paid' } },
        { $group: { _id: null, sum: { $sum: "$grandTotal" } } }
      ]);
      const totalOrders = await Order.countDocuments(match);
      const totalCustomers = await User.countDocuments();
      const pendingDelivery = await Order.countDocuments({ ...match, 'items.status': { $in: ['Pending'] } });
  
      res.json({
        totalRevenue: totalRevenue[0]?.sum || 0,
        totalOrders,
        totalCustomers,
        pendingDelivery
      });
    } catch (error) {
      console.error('Error while fetching dashboard summary', error);
      res.status(500).json({ error: 'Server error' });
    }
  };