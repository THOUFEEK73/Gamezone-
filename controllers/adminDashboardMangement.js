import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
export const getDashBoardPage = async (req, res) => {
  try {
    // Total Revenue: Only delivered items, using discountedPrice if available, else originalPrice
    const totalRevenueAgg = await Order.aggregate([
      { $unwind: "$items" },
      { $match: { "items.status": "Delivered" } },
      {
        $group: {
          _id: null,
          sum: {
            $sum: {
              $multiply: [
                { $ifNull: ["$items.discountedPrice", "$items.originalPrice"] },
                { $ifNull: ["$items.quantity", 0] }
              ]
            }
          }
        }
      }
    ]);
    const totalRevenue = totalRevenueAgg[0]?.sum || 0;

    // Total Orders: Orders with at least one delivered item
    const totalOrdersAgg = await Order.aggregate([
      { $unwind: "$items" },
      { $match: { "items.status": "Delivered" } },
      { $group: { _id: "$_id" } }
    ]);
    const totalOrders = totalOrdersAgg.length;

    // Total Customers
    const totalCustomers = await User.countDocuments();

    // Pending Delivery: Orders with at least one pending item
    const pendingDeliveryAgg = await Order.aggregate([
      { $unwind: "$items" },
      { $match: { "items.status": "Pending" } },
      { $group: { _id: "$_id" } }
    ]);
    const pendingDelivery = pendingDeliveryAgg.length;

    console.log({ totalRevenue, totalOrders, totalCustomers, pendingDelivery });

    res.render('admin/dashboard', {
      totalRevenue,
      totalOrders,
      totalCustomers,
      pendingDelivery,
    });
  } catch (error) {
    console.error('Error while fetching admin Dashboard', error);
    res.status(500).render('error', { message: 'server is down please try again later' });
  }
};


export const getDashBoardFilter = async (req, res) => {
  try {
    const { filter, from, to } = req.query;
    const now = new Date();
    let match = {};
    let start, end;

    // Set date range for filtering
    if (filter === 'custom' && from && to) {
      start = new Date(from);
      end = new Date(to);
      end.setHours(23, 59, 59, 999);
      match.createdAt = { $gte: start, $lt: end };
    } else if (filter === 'daily') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      match.createdAt = { $gte: start, $lt: end };
    } else if (filter === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      match.createdAt = { $gte: start, $lt: end };
    }

    // --- Revenue, Orders, Customers, Pending ---
    const totalRevenueAgg = await Order.aggregate([
      { $match: { ...match } },
      { $unwind: "$items" },
      { $match: { "items.status": "Delivered" } },
      {
        $group: {
          _id: null,
          sum: {
            $sum: {
              $multiply: [
                { $ifNull: ["$items.discountedPrice", "$items.originalPrice"] },
                { $ifNull: ["$items.quantity", 0] }
              ]
            }
          }
        }
      }
    ]);
    const revenue = totalRevenueAgg[0]?.sum || 0;

    const totalOrdersAgg = await Order.aggregate([
      { $match: { ...match } },
      { $unwind: "$items" },
      { $match: { "items.status": "Delivered" } },
      { $group: { _id: "$_id" } }
    ]);
    const totalOrders = totalOrdersAgg.length;

    const totalCustomers = await User.countDocuments();

    const pendingDeliveryAgg = await Order.aggregate([
      { $match: { ...match } },
      { $unwind: "$items" },
      { $match: { "items.status": "Pending" } },
      { $group: { _id: "$_id" } }
    ]);
    const pendingDelivery = pendingDeliveryAgg.length;

    // --- Dynamic Sales Target Calculation ---
    let monthlyTarget = 0;
    let dailyTarget = 0;
    if (filter === 'custom' && from && to) {
      const startDate = new Date(from);
      const endDate = new Date(to);
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const months =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth()) + 1;

      if (
        startDate.getFullYear() === endDate.getFullYear() &&
        startDate.getMonth() === endDate.getMonth()
      ) {
        dailyTarget = Math.round(revenue / days) || 0;
        monthlyTarget = revenue;
      } else {
        monthlyTarget = Math.round(revenue / months) || 0;
        dailyTarget = Math.round(revenue / days) || 0;
      }
    } else if (filter === 'daily') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      dailyTarget = revenue;
      monthlyTarget = Math.round(revenue * daysInMonth) || 0;
    } else if (filter === 'monthly') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      monthlyTarget = revenue;
      dailyTarget = Math.round(revenue / daysInMonth) || 0;
    } else {
      // Default: all time
      monthlyTarget = Math.round(revenue / 12) || 0;
      dailyTarget = Math.round(revenue / 365) || 0;
    }

    // --- Sales Chart ---
    let salesChart = { labels: [], data: [] };

    if (filter === 'daily') {
      // Hourly sales for today
      for (let h = 0; h < 24; h++) {
        const hourStart = new Date(start);
        hourStart.setHours(h, 0, 0, 0);
        const hourEnd = new Date(start);
        hourEnd.setHours(h + 1, 0, 0, 0);
        const orders = await Order.aggregate([
          { $match: { createdAt: { $gte: hourStart, $lt: hourEnd } } },
          { $unwind: "$items" },
          { $match: { "items.status": "Delivered" } },
          {
            $group: {
              _id: null,
              sum: {
                $sum: {
                  $multiply: [
                    { $ifNull: ["$items.discountedPrice", "$items.originalPrice"] },
                    { $ifNull: ["$items.quantity", 0] }
                  ]
                }
              }
            }
          }
        ]);
        salesChart.labels.push(`${h}:00`);
        salesChart.data.push(orders[0]?.sum || 0);
      }
    } else if (filter === 'custom' && from && to) {
      const startDate = new Date(from);
      const endDate = new Date(to);
      if (
        startDate.getFullYear() === endDate.getFullYear() &&
        startDate.getMonth() === endDate.getMonth()
      ) {
        // Daily sales for custom range within one month (hourly)
        for (let h = 0; h < 24; h++) {
          const hourStart = new Date(start);
          hourStart.setHours(h, 0, 0, 0);
          const hourEnd = new Date(start);
          hourEnd.setHours(h + 1, 0, 0, 0);
          const orders = await Order.aggregate([
            { $match: { createdAt: { $gte: hourStart, $lt: hourEnd } } },
            { $unwind: "$items" },
            { $match: { "items.status": "Delivered" } },
            {
              $group: {
                _id: null,
                sum: {
                  $sum: {
                    $multiply: [
                      { $ifNull: ["$items.discountedPrice", "$items.originalPrice"] },
                      { $ifNull: ["$items.quantity", 0] }
                    ]
                  }
                }
              }
            }
          ]);
          salesChart.labels.push(`${h}:00`);
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
            { $match: { createdAt: { $gte: monthStart, $lt: monthEnd } } },
            { $unwind: "$items" },
            { $match: { "items.status": "Delivered" } },
            {
              $group: {
                _id: null,
                sum: {
                  $sum: {
                    $multiply: [
                      { $ifNull: ["$items.discountedPrice", "$items.originalPrice"] },
                      { $ifNull: ["$items.quantity", 0] }
                    ]
                  }
                }
              }
            }
          ]);
          salesChart.labels.push(
            monthStart.toLocaleString('default', { month: 'short', year: 'numeric' })
          );
          salesChart.data.push(orders[0]?.sum || 0);
          current.setMonth(current.getMonth() + 1);
        }
      }
    } else if (filter === 'monthly') {
      // Month-wise sales for current year
      for (let m = 0; m < 12; m++) {
        const monthStart = new Date(now.getFullYear(), m, 1);
        const monthEnd = new Date(now.getFullYear(), m + 1, 1);
        const orders = await Order.aggregate([
          { $match: { createdAt: { $gte: monthStart, $lt: monthEnd } } },
          { $unwind: "$items" },
          { $match: { "items.status": "Delivered" } },
          {
            $group: {
              _id: null,
              sum: {
                $sum: {
                  $multiply: [
                    { $ifNull: ["$items.discountedPrice", "$items.originalPrice"] },
                    { $ifNull: ["$items.quantity", 0] }
                  ]
                }
              }
            }
          }
        ]);
        salesChart.labels.push(
          new Date(now.getFullYear(), m, 1).toLocaleString('default', { month: 'short' })
        );
        salesChart.data.push(orders[0]?.sum || 0);
      }
    } else {
      // Year-wise sales for last 5 years
      const currentYear = now.getFullYear();
      for (let y = currentYear - 4; y <= currentYear; y++) {
        const yearStart = new Date(y, 0, 1);
        const yearEnd = new Date(y + 1, 0, 1);
        const orders = await Order.aggregate([
          { $match: { createdAt: { $gte: yearStart, $lt: yearEnd } } },
          { $unwind: "$items" },
          { $match: { "items.status": "Delivered" } },
          {
            $group: {
              _id: null,
              sum: {
                $sum: {
                  $multiply: [
                    { $ifNull: ["$items.discountedPrice", "$items.originalPrice"] },
                    { $ifNull: ["$items.quantity", 0] }
                  ]
                }
              }
            }
          }
        ]);
        salesChart.labels.push(`${y}`);
        salesChart.data.push(orders[0]?.sum || 0);
      }
    }

    // --- Top Products ---
    const topProducts = await Order.aggregate([
      { $match: { paymentStatus: 'paid', ...match } },
      { $unwind: '$items' },
      { $match: { 'items.status': { $nin: ['Cancelled', 'Returned'] } } },
      {
        $group: {
          _id: '$items.productId',
          totalSold: { $sum: '$items.quantity' }
        }
      },
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

    // --- Top Categories ---
    const topCategories = await Order.aggregate([
      { $match: { paymentStatus: 'paid', ...match } },
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
          _id: '$game.category',
          totalSold: { $sum: '$items.quantity' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
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

    // --- Top Brands ---
    const topBrands = await Order.aggregate([
      { $match: { paymentStatus: 'paid', ...match } },
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
          _id: '$game.company',
          totalSold: { $sum: '$items.quantity' }
        }
      },
      {
        $lookup: {
          from: 'gamecompanies',
          localField: '_id',
          foreignField: '_id',
          as: 'brand'
        }
      },
      { $unwind: '$brand' },
      {
        $project: {
          name: '$brand.name',
          totalSold: 1
        }
      },
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