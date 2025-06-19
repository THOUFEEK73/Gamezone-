import Offer from '../models/offerModel.js'
import Category from '../models/CategoryModel.js'
import Game from '../models/gameModel.js'

export const getOfferPage = async (req, res) => {
  try {
    const itemsPerPage = 5;
    const currentPage = parseInt(req.query.page) || 1;
    const searchQuery = req.query.search || '';
    console.log('Search Query:', searchQuery);

    // Create filter based on search query
    const searchFilter = searchQuery
      ? {
          $or: [
            { offerName: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      : {};

    // Count filtered results
    const totalItems = await Offer.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Get paginated + filtered offers
    const offers = await Offer.find(searchFilter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage);

    const games = await Game.find({ status: 'active' }).select('title _id');
    const category = await Category.find({ status: 'active' }).select('categoryName _id');

    res.render('admin/offers', {
      games,
      category,
      offers,
      currentPage,
      totalPages,
      searchQuery
    });
  } catch (error) {
    console.error('Error in getOfferPage:', error);
    res.status(500).send('Internal Server Error');
  }
};


export const getOffersApi = async (req, res) => {
  try {
    const itemsPerPage = parseInt(req.query.limit) || 5;
    const currentPage = parseInt(req.query.page) || 1;
    const searchQuery = req.query.search || '';

    const searchFilter = searchQuery
      ? {
          $or: [
            { offerName: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      : {};

    const totalItems = await Offer.countDocuments(searchFilter);

    const offers = await Offer.find(searchFilter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .lean();

    res.json({
      offers,
      totalItems,
      totalPages: Math.ceil(totalItems / itemsPerPage),
      currentPage
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};


export const createOffer = async(req, res) => {
    try {
        console.log('create offer function triggered');
        
        const {
            offerName,
            offerType,
            discountPercentage,
            startDate,
            endDate,
            items,
        } = req.body;

        console.log('Request body:', req.body);


        const errors = {};
      
        if(!offerName || offerName.trim().length < 3 === ''){
            errors.offerName = 'Offer name must be at least 3 characters long';
        }else if(offerName.trim().length > 15){
            errors.offerName = 'Offer name must be less than 10 characters long';
        }


        if(!offerType){
            errors.offerType = 'please select an offer type';
        }else if(!['product','category'].includes(offerType)){
            errors.offerType = 'Invalid offer type';
        }

        const discount = parseInt(discountPercentage);

        if(!discountPercentage ){
            errors.discountPercentage = 'Discount percentage is required';
        }else if(isNaN(discount) || discount < 0 || discount > 100){
            errors.discountPercentage = 'Discount percentage must be a number between 1 and 99';
        }

        const currentDate = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);

        function toDateOnly(date) {
          return new Date(date.getFullYear(), date.getMonth(), date.getDate());
        }
        
        const today = toDateOnly(new Date());
        const startDay = toDateOnly(start);
        
        if (!startDate) {
          errors.startDate = 'Start date is required';
        } else if (isNaN(start.getTime())) {
          errors.startDate = 'Invalid start date';
        } else if (startDay < today) {
          errors.startDate = 'Start date cannot be in the past';
        }

        if (!endDate) {
            errors.endDate = 'End date is required';
        } else if (isNaN(end.getTime())) {
            errors.endDate = 'Invalid end date';
        } else if (end <= start) {
            errors.endDate = 'End date must be after start date';
        }


        if (!items || !Array.isArray(items) || items.length === 0) {
            errors.items = offerType === 'product' ? 
                'Please select at least one product' : 
                'Please select at least one category';
        }


        const existingOffer = await Offer.findOne({
            offerName:offerName.trim(),
            isActive:true
        })

        if( existingOffer) {
            errors.offerName = 'Offer name already exists';
        }

        if (Object.keys(errors).length > 0) {
            console.log('Validation errors',errors)
            return res.status(400).json({
                success: false,
                errors
            });
        }

        const newOffer = new Offer({
            offerName: offerName.trim(),
            offerType,
            discountPercentage: parseInt(discountPercentage),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            items: items,
            isActive: true
        });
      
        await newOffer.save();
        console.log('offer created successfully');


       
        
        res.status(201).json({
            success: true,
            message: 'Offer created successfully'
        });
     
    } catch(error) {
        console.error('Error creating offer:', error);
        res.status(500).json({
            success: false,
            errors:{  general: error.message || 'Failed to create offer'}
        });
    }
}



export const postUpdateOffer = async (req, res) => {
    try {
      const {
        offerId,
        offerName,
        offerType,
        discountPercentage,
        startDate,
        endDate,
        productSelect,
        categorySelect
      } = req.body;
  
      const errors = {};
  
      // Offer Name Validation
      if (!offerName || offerName.trim().length < 3) {
        errors.offerName = 'Offer name must be at least 3 characters long';
      } else if (offerName.trim().length > 15) {
        errors.offerName = 'Offer name must be less than 15 characters long';
      }
  
      // Offer Type Validation
      if (!offerType) {
        errors.offerType = 'Please select an offer type';
      } else if (!['product', 'category'].includes(offerType)) {
        errors.offerType = 'Invalid offer type';
      }
  
      // Discount Validation
      const discount = parseInt(discountPercentage);
      if (!discountPercentage) {
        errors.discountPercentage = 'Discount percentage is required';
      } else if (isNaN(discount) || discount < 1 || discount > 99) {
        errors.discountPercentage = 'Discount percentage must be a number between 1 and 99';
      }
  
      // Date Validation
      
      const start = new Date(startDate);
      const end = new Date(endDate);
  
      function toDateOnly(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      }
      
      const today = toDateOnly(new Date());
      const startDay = toDateOnly(start);
      
      if (!startDate) {
        errors.startDate = 'Start date is required';
      } else if (isNaN(start.getTime())) {
        errors.startDate = 'Invalid start date';
      } else if (startDay < today) {
        errors.startDate = 'Start date cannot be in the past';
      }
  
      if (!endDate) {
        errors.endDate = 'End date is required';
      } else if (isNaN(end.getTime())) {
        errors.endDate = 'Invalid end date';
      } else if (end <= start) {
        errors.endDate = 'End date must be after start date';
      }
  
      // Items Validation
      let items = [];
      if (offerType === 'product') {
        if (!productSelect) {
          errors.items = 'Please select a product';
        } else {
          items = [productSelect];
        }
      } else if (offerType === 'category') {
        if (!categorySelect) {
          errors.items = 'Please select a category';
        } else {
          items = [categorySelect];
        }
      }
  
      // Offer Name Uniqueness Validation (exclude current offer)
      const existingOffer = await Offer.findOne({
        offerName: offerName.trim(),
        isActive: true,
        _id: { $ne: offerId }
      });
      if (existingOffer) {
        errors.offerName = 'Offer name already exists';
      }
  
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          errors
        });
      }
  
      // Update Offer
      const update = {
        offerName: offerName.trim(),
        offerType,
        discountPercentage: discount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        items
      };
  
      await Offer.findByIdAndUpdate(offerId, update);
  
      res.json({ success: true, message: 'Offer updated successfully' });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update offer',
        error: error.message
      });
    }
  };


export const toggleOfferStatus = async(req,res)=>{
    try{
       
        const offerId = req.params.offerId;
        const {isActive} = req.body;
        const offer = await Offer.findById(offerId);

        if(!offer){
            return res.status(404).json({success:false,message:'Offer not found'});
        }

     offer.isActive = isActive;
     await offer.save();

     const now = new Date();
    //  const currentlyActive = offer.isActive && 
    //                        new Date(offer.startDate) <= now && 
    //                        new Date(offer.endDate) >= now;

     res.json({
        success: true,
        message: `Offer ${offer.isActive ? 'activated' : 'deactivated'} successfully`,
        isActive:offer.isActive,
        
     })
       
    }catch(error){
      res.status(500).json({success:false,message:'Failed to update offer status'});
    }
}