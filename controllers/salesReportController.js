import Order from '../models/orderModel.js';

export const getSalesReportPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    let matchConditions = {
      $or: [
        { paymentStatus: 'paid' },
        { paymentMethod: 'cod', 'items.status': 'Delivered' },
        { paymentMethod: 'wallet', paymentStatus: 'paid' }
      ]
    };

    const filter = req.query.filter;

    console.log('Filter:', filter);
    let dateFilter = {};
    const now = new Date();

    // --- Custom date validation ---
    let errors = {};
    if (filter === 'custom' && req.query.from && req.query.to) {
      const fromDate = new Date(req.query.from);
      const toDate = new Date(req.query.to);
      const today = new Date();
      today.setHours(0,0,0,0);

      if (fromDate > toDate) {
        errors.date = 'From date cannot be after To date.';
      }
      // Uncomment if you want to block future dates
      // if (fromDate > today || toDate > today) {
      //   errors.future = 'Dates cannot be in the future.';
      // }

      if ((req.headers.accept && req.headers.accept.includes('application/json')) && Object.keys(errors).length) {
        return res.status(400).json({ errors });
      }

      if (Object.keys(errors).length) {
        req.flash('error', Object.values(errors).join(' '));
        return res.redirect('/admin/salesReport');
      }
    }

    if (filter === 'daily') {
     console.log('Daily filter applied');
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      dateFilter = { $gte: start, $lt: end };
    } else if (filter === 'weekly') {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0,0,0,0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      dateFilter = { $gte: start, $lt: end };
    } else if (filter === 'yearly') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      dateFilter = { $gte: start, $lt: end };
    } else if (filter === 'custom' && req.query.from && req.query.to) {
      dateFilter = {
        $gte: new Date(req.query.from),
        $lte: new Date(req.query.to)
      };
    }

    if (Object.keys(dateFilter).length) {
      matchConditions.createdAt = dateFilter;
    }

    // 1. Aggregate offerDiscount from items
    const offerDiscountAgg = await Order.aggregate([
      { $match: matchConditions },
     
      {
        $group: {
          _id: null,
          offerDiscount: { $sum: { $ifNull: ['$offerDiscount', 0] } }
        }
      }
    ]);
    const offerDiscount = offerDiscountAgg[0]?.offerDiscount || 0;

    console.log('offerDiscount:', offerDiscount);

    // 2. Aggregate coupon discount and total sales at order level
    const orderLevelAgg = await Order.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          couponDiscount: { $sum: { $ifNull: ['$discount', 0] } },
          totalOrders: { $sum: 1 }
        }
      }
    ]);
    const aggResult = orderLevelAgg[0] || { totalSales: 0, couponDiscount: 0, totalOrders: 0 };

    const totalDiscount = offerDiscount + aggResult.couponDiscount;
    console.log('totalDiscount:', totalDiscount);
    const allOrders = await Order.find(matchConditions)
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrderCount = await Order.countDocuments(matchConditions);
    const totalPages = Math.ceil(totalOrderCount / limit);
    
  
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        allOrders,
        page,
        totalOrders: totalOrderCount,
        totalPages,
        totalSales: aggResult.totalSales,
        totalDiscount,
        offerDiscount,
        couponDiscount: aggResult.couponDiscount
      });
    }


   

    res.render('admin/salesReport', {
      totalSales: aggResult.totalSales,
      totalOrders: aggResult.totalOrders,
      totalDiscount,
      offerDiscount,
      couponDiscount: aggResult.couponDiscount,
      allOrders,
      page,
      totalPages,
      messages: req.flash()
    });

  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).send('Internal Server Error');
  }
};