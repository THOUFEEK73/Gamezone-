import Order from "../models/orderModel.js";
import User from "../models/userModel.js";

export const getDashBoardPage = async(req,res)=>{

 try{

  const totalRevenue = await Order.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        items: {
          $elemMatch: { status: 'Delivered' }
        },
        'items.status':{$nin: ['Cancelled','Returned']}
      }
    },
    {
      $group: {
        _id: null,
        sum: { $sum: "$grandTotal" }
      }
    }
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
    const { filter, from, to } = req.query;
    let match = {};
    const now = new Date();

    // Default: current year
    let start = new Date(now.getFullYear(), 0, 1);
    let end = new Date(now.getFullYear() + 1, 0, 1);

    // Custom date range
    if (filter === 'custom' && from && to) {
      start = new Date(from);
      end = new Date(to);
      end.setHours(23, 59, 59, 999);
    }

    match.createdAt = { $gte: start, $lt: end };

    const totalRevenue = await Order.aggregate([
      { $match: { ...match, paymentStatus: 'paid',
        $nor: [
          { items: { $elemMatch: { status: 'Cancelled' } } },
          { items: { $elemMatch: { status: 'Returned' } } }
        ]
      }},
      { $group: { _id: null, sum: { $sum: "$grandTotal" } } }
    ]);
    const totalOrders = await Order.countDocuments(match);
    const totalCustomers = await User.countDocuments();
    const pendingDelivery = await Order.countDocuments({ ...match, 'items.status': { $in: ['Pending'] } });

    // --- Dynamic Sales Target Calculation ---
    let monthlyTarget = 0;
    let dailyTarget = 0;
    const revenue = totalRevenue[0]?.sum || 0;

    if (filter === 'custom' && from && to) {
      const startDate = new Date(from);
      const endDate = new Date(to);
      // Calculate number of days and months in range
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const months =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth()) + 1;

      if (
        startDate.getFullYear() === endDate.getFullYear() &&
        startDate.getMonth() === endDate.getMonth()
      ) {
        // If within one month, show daily target
        dailyTarget = Math.round(revenue / days) || 0;
        monthlyTarget = revenue;
      } else {
        // If multi-month, show monthly target
        monthlyTarget = Math.round(revenue / months) || 0;
        dailyTarget = Math.round(revenue / days) || 0;
      }
    } else if (filter === 'daily') {
      // Current month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      dailyTarget = Math.round(revenue / daysInMonth) || 0;
      monthlyTarget = revenue;
    } else {
      // Default: current year
      monthlyTarget = Math.round(revenue / 12) || 0;
      const daysInYear = (new Date(now.getFullYear(), 11, 31) - new Date(now.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24) + 1;
      dailyTarget = Math.round(revenue / daysInYear) || 0;
    }

    // ... salesChart logic remains unchanged ...

    let salesChart = { labels: [], data: [] };

    if (filter === 'daily') {
      // Daily sales for current month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dayStart = new Date(now.getFullYear(), now.getMonth(), d);
        const dayEnd = new Date(now.getFullYear(), now.getMonth(), d + 1);
        const orders = await Order.aggregate([
          { $match: { paymentStatus: 'paid', createdAt: { $gte: dayStart, $lt: dayEnd },
            $nor: [
              { items: { $elemMatch: { status: 'Cancelled' } } },
              { items: { $elemMatch: { status: 'Returned' } } }
            ]
          } },
          { $group: { _id: null, sum: { $sum: "$grandTotal" } } }
        ]);
        salesChart.labels.push(`${d} ${now.toLocaleString('default', { month: 'short' })}`);
        salesChart.data.push(orders[0]?.sum || 0);
      }
    } else if (filter === 'custom' && from && to) {
      const startDate = new Date(from);
      const endDate = new Date(to);
      if (
        startDate.getFullYear() === endDate.getFullYear() &&
        startDate.getMonth() === endDate.getMonth()
      ) {
        // Daily sales for custom range within one month
        for (
          let d = new Date(startDate);
          d <= endDate;
          d.setDate(d.getDate() + 1)
        ) {
          const dayStart = new Date(d);
          const dayEnd = new Date(d);
          dayEnd.setDate(dayEnd.getDate() + 1);
          const orders = await Order.aggregate([
            { $match: { paymentStatus: 'paid', createdAt: { $gte: dayStart, $lt: dayEnd },
              $nor: [
                { items: { $elemMatch: { status: 'Cancelled' } } },
                { items: { $elemMatch: { status: 'Returned' } } }
              ]
            } },
            { $group: { _id: null, sum: { $sum: "$grandTotal" } } }
          ]);
          salesChart.labels.push(
            `${dayStart.getDate()} ${dayStart.toLocaleString('default', { month: 'short' })}`
          );
          salesChart.data.push(orders[0]?.sum || 0);
        }
      } else {
        // Month-wise sales for custom range spanning multiple months
        let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        const last = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 1);
        while (current < last) {
          const monthStart = new Date(current);
          const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 1);
          const orders = await Order.aggregate([
            { $match: { paymentStatus: 'paid', createdAt: { $gte: monthStart, $lt: monthEnd },
              $nor: [
                { items: { $elemMatch: { status: 'Cancelled' } } },
                { items: { $elemMatch: { status: 'Returned' } } }
              ]
            } },
            { $group: { _id: null, sum: { $sum: "$grandTotal" } } }
          ]);
          salesChart.labels.push(
            monthStart.toLocaleString('default', { month: 'short', year: 'numeric' })
          );
          salesChart.data.push(orders[0]?.sum || 0);
          current.setMonth(current.getMonth() + 1);
        }
      }
    } else {
      // Month-wise sales for current year (default)
      for (let m = 0; m < 12; m++) {
        const monthStart = new Date(now.getFullYear(), m, 1);
        const monthEnd = new Date(now.getFullYear(), m + 1, 1);
        const orders = await Order.aggregate([
          { $match: { paymentStatus: 'paid', createdAt: { $gte: monthStart, $lt: monthEnd },
            $nor: [
              { items: { $elemMatch: { status: 'Cancelled' } } },
              { items: { $elemMatch: { status: 'Returned' } } }
            ]
          } },
          { $group: { _id: null, sum: { $sum: "$grandTotal" } } }
        ]);
        salesChart.labels.push(
          new Date(now.getFullYear(), m, 1).toLocaleString('default', { month: 'short' })
        );
        salesChart.data.push(orders[0]?.sum || 0);
      }
    }




    const topProducts = await Order.aggregate([

      { $match: { paymentStatus: 'paid' } },

    
      { $unwind: '$items' },


      {
        $match: {
          'items.status': { $nin: ['Cancelled', 'Returned'] }
        }
      },


      {
        $group: {
          _id: '$items.productId',
          totalSold: { $sum: '$items.quantity' }
        }
      },

      // Join with Game collection
      {
        $lookup: {
          from: 'games',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },

      {
        $project: {
          title: '$product.title',
          coverImage: '$product.media.coverImage',
          totalSold: 1
        }
      },


      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);


    const topCategories = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      { $match: { 'items.status': { $nin: ['Cancelled', 'Returned'] } } },
      {
        $lookup: {
          from: 'games',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'game'
        }
      },
      { $unwind: '$game' },
      {
        $group: {
          _id: '$game.category', // This is likely a string (category name)
          totalSold: { $sum: '$items.quantity' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',      // category name
          foreignField: '_id',   // categories.name
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          name: '$category.categoryName',
          totalSold: 1
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);


    const topBrands = await Order.aggregate([
      // 1. Only paid orders
      { $match: { paymentStatus: 'paid' } },
    
      // 2. Unwind items array
      { $unwind: '$items' },
    
      // 3. Exclude cancelled and returned items
      {
        $match: {
          'items.status': { $nin: ['Cancelled', 'Returned'] }
        }
      },
    
      // 4. Lookup Game to get company (brand) info
      {
        $lookup: {
          from: 'games',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'game'
        }
      },
      { $unwind: '$game' },
    
      // 5. Group by company (brand) ID and sum quantities
      {
        $group: {
          _id: '$game.company',
          totalSold: { $sum: '$items.quantity' }
        }
      },
    
      // 6. Lookup company (brand) details
      {
        $lookup: {
          from: 'gamecompanies', // Make sure your GameCompany collection is named this
          localField: '_id',
          foreignField: '_id',
          as: 'brand'
        }
      },
      { $unwind: '$brand' },
    
      // 7. Project brand name and totalSold
      {
        $project: {
          name: '$brand.name',
          totalSold: 1
        }
      },
    
      // 8. Sort and limit
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);
    

 
    

   

    res.json({
      totalRevenue: revenue,
      totalOrders,
      totalCustomers,
      pendingDelivery,
      salesChart,
      monthlyTarget,
      topProducts,
      topCategories,
      topBrands,
      dailyTarget
    });
  } catch (error) {
    console.error('Error while fetching dashboard summary', error);
    res.status(500).json({ error: 'Server error' });
  }
};


