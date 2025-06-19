
import Coupon from '../models/couponModel.js';

export const getCouponPage = async (req, res) => {
  try {
    const itemsPerPage = 5;
    const currentPage = parseInt(req.query.page) || 1;
    const searchQuery = req.query.search || '';

    // Optional: Add search filter (can remove if you don’t want search here)
    const searchFilter = searchQuery
      ? {
          $or: [
            { code: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      : {};

    const totalItems = await Coupon.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const coupons = await Coupon.find(searchFilter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .lean();

    res.render('admin/coupons', {
      coupons,
      currentPage,
      totalPages,
      searchQuery
    });
  } catch (error) {
    console.error('Error fetching coupon page:', error);
    res.status(500).render('error', { message: 'Server is down, please try again later' });
  }
};

export const getCouponApi = async (req, res) => {
  const searchQuery = req.query.search || '';
  const searchFilter = searchQuery
    ? {
        $or: [
          { code: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } }
        ]
      }
    : {};
  const coupons = await Coupon.find(searchFilter).sort({ createdAt: -1 }).lean();
  res.json({ coupons });
};



export const postCoupon = async(req,res)=>{
    try{
        const {code,discountType,discountValue,minOrderAmount,maxOrderAmount,description,startDate,endDate} = req.body;
       

        
        let errors = {};

        if(!code) errors.code = 'Coupon code is required';
        if(!discountType) errors.discountType = 'Discount type is required';
        if(!discountValue) errors.discountValue = 'Discount value is required';
        if (!minOrderAmount) errors.minOrderAmount = 'Minimum order amount is required.';
        if (!maxOrderAmount) errors.maxOrderAmount = 'Maximum order amount is required.';
        if (!description) errors.description = 'Description is required.';
        if (!startDate) errors.startDate = 'Start date is required.';
        if (!endDate) errors.endDate = 'End date is required.';
          
        console.log('Received data:', code)
      
        const parsedDiscountValue = Number(discountValue);
        const parsedMinOrderAmount = Number(minOrderAmount);
        const parsedMaxOrderAmount = Number(maxOrderAmount);
        const parsedStartDate = startDate ? new Date(startDate) : null;
        const parsedEndDate = endDate ? new Date(endDate) : null;


        


        // Types and value checks 

        if(discountType && !['percentage','fixed'].includes(discountType)){
            errors.discountType = 'Invalid discount type must be "percentage" or "fixed"';
        }

        if(discountType === 'percentage' && (discountValue <=0 || discountValue > 100)){
            errors.discountValue = 'Percentage discount must be between 1 and 100';
            console.log('error triggered here')
        }

        if(discountType === 'fixed' && (discountValue <=0 )){
            errors.discountValue = 'Fixed discount must be greater than 0';
        }

         

        if(parsedMinOrderAmount < 0){
            errors.minOrderAmount = 'Minimum order amount must be positive.';
        }

        if(parsedMaxOrderAmount < 0){
            errors.maxOrderAmount = 'Maximum order amount must be positive';
        }

        if((minOrderAmount || maxOrderAmount === 0) &&
           (maxOrderAmount || minOrderAmount === 0) && 
           parsedMinOrderAmount > parsedMaxOrderAmount){ 
            errors.minOrderAmount = 'Minimum order amount cannot be greater than maximum order amount.';
           }

           if(startDate && endDate){
            if (isNaN(parsedStartDate.getTime())) {
                errors.startDate = 'Invalid start date.';
            }
            if (isNaN(parsedEndDate.getTime())) {
                errors.endDate = 'Invalid end date.';
            }
            if (!errors.startDate && !errors.endDate && parsedStartDate > parsedEndDate) {
                errors.startDate = 'Start date cannot be after end date.';
            }
           }

           if (code) {
            const exists = await Coupon.findOne({ code });
            if (exists) {
                errors.code = 'Coupon code already exists';
            }
        }

        // If any errors, return them
        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        await Coupon.create({
            code,
            discountType,
            discountValue: parsedDiscountValue,
            minOrderAmount: parsedMinOrderAmount,
            maxOrderAmount: parsedMaxOrderAmount,
            description,
            startDate: parsedStartDate,
            endDate: parsedEndDate
        });
        console.log('success fully')
        return res.json({ success: true, message: 'Coupon successfully created!' });
    }catch(error){

        console.error('error while adding coupon',error);
        return res.status(500).json({ success: false, message: 'Failed to add coupon. Please try again later.' });

    }
}


export const CouponStatus = async(req, res) => {
    try {
      const { isActive } = req.body;
      const couponId = req.params.id;
  
      if (!couponId) {
        return res.status(400).json({ success: false, message: "Coupon ID is required" });
      }
  
     
      const coupon = await Coupon.findById(couponId);
      if (!coupon) {
        return res.status(404).json({ success: false, message: "Coupon not found" });
      }
  
      const now = new Date();
      let isExpired = coupon.isExpired;
  

      if (!isActive) {
        isExpired = now > coupon.endDate;
      } else {

        isExpired = now > coupon.endDate;
      }
  
 
      const updated = await Coupon.findByIdAndUpdate(
        couponId,
        { isActive, isExpired },
        { new: true }
      ).lean();
  
      res.json({ success: true, coupon: updated });
  
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  }



  export const updateCoupon = async (req, res) => {
    try {
        console.log('update coupon called')
      const couponId = req.params.id;
  
      if (!couponId) {
        return res.status(400).json({ success: false, message: 'Coupon ID is required' });
      }
  
      const {
        code,
        discountType,
        discountValue,
        minOrderAmount,
        maxOrderAmount,
        description,
        startDate,
        endDate
      } = req.body;
  
      const errors = {};
  
      // Basic required checks
      if (!code?.trim()) errors.code = 'Coupon code is required';
      if (!discountType) errors.discountType = 'Discount type is required';
      if (!discountValue) errors.discountValue = 'Discount value is required';
      if (!minOrderAmount) errors.minOrderAmount = 'Minimum order amount is required.';
      if (!maxOrderAmount ) errors.maxOrderAmount = 'Maximum order amount is required.';
      if (!description?.trim()) errors.description = 'Description is required.';
      if (!startDate) errors.startDate = 'Start date is required.';
      if (!endDate) errors.endDate = 'End date is required.';
  
      // Convert and validate numbers
      const parsedDiscountValue = Number(discountValue);
      const parsedMinOrderAmount = Number(minOrderAmount);
      const parsedMaxOrderAmount = Number(maxOrderAmount);
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);
  
      // Discount type and value checks
      if (discountType && !['percentage', 'fixed'].includes(discountType)) {
        errors.discountType = 'Invalid discount type. Must be "percentage" or "fixed".';
      }
      if (discountType === 'percentage' && (parsedDiscountValue <= 0 || parsedDiscountValue > 100)) {
        errors.discountValue = 'Percentage discount must be between 1 and 100.';
      }
      if (discountType === 'fixed' && parsedDiscountValue <= 0) {
        errors.discountValue = 'Fixed discount must be greater than 0.';
      }
  
      // Min/Max amount checks
      if (parsedMinOrderAmount < 0) {
        errors.minOrderAmount = 'Minimum order amount must be positive.';
      }
      if (parsedMaxOrderAmount < 0) {
        errors.maxOrderAmount = 'Maximum order amount must be positive.';
      }
      if (parsedMinOrderAmount > parsedMaxOrderAmount) {
        errors.minOrderAmount = 'Minimum order amount cannot be greater than maximum.';
      }
  
      // Date validation
      if (isNaN(parsedStartDate.getTime())) {
        errors.startDate = 'Invalid start date.';
      }
      if (isNaN(parsedEndDate.getTime())) {
        errors.endDate = 'Invalid end date.';
      }
      if (!errors.startDate && !errors.endDate && parsedStartDate > parsedEndDate) {
        errors.startDate = 'Start date cannot be after end date.';
      }
  
      // Check duplicate coupon code (excluding current one)
      const existingCoupon = await Coupon.findOne({ code, _id: { $ne: couponId } });
      if (existingCoupon) {
        errors.code = 'Coupon code already exists.';
      }
  
      // Return validation errors
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ success: false, errors });
      }
  
      // Check if expired
      const now = new Date();
      const isExpired = parsedEndDate && now > parsedEndDate;
  
      // Update in DB
      const updated = await Coupon.findByIdAndUpdate(
        couponId,
        {
          code,
          discountType,
          discountValue: parsedDiscountValue,
          minOrderAmount: parsedMinOrderAmount,
          maxOrderAmount: parsedMaxOrderAmount,
          description,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          isExpired
        },
        { new: true }
      ).lean();
  
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Coupon not found' });
      }
  
      res.json({ success: true, message: 'Coupon updated successfully', coupon: updated });
    } catch (error) {
      console.error('Error updating coupon:', error);
      res.status(500).json({ success: false, message: 'Failed to update coupon. Please try again later.' });
    }
  };
  