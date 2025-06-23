import Offer from '../models/offerModel.js'
import Category from '../models/CategoryModel.js'
import Game from '../models/gameModel.js'
import { offerNotification } from '../utils/NotifySubscriber.js';

export const getOfferPage = async(req,res)=>{
    try {
        const games = await Game.find({status:'active'}).select('title _id');
        const category = await Category.find({status:'active'}).select('categoryName _id');
        const offers = await Offer.find().sort({createdAt: -1});
        res.render('admin/offers',{games,category,offers});
    } catch(error) {
        console.error('Error in getOfferPage:', error);
        res.status(500).send('Internal Server Error');
    }
}

export const getOfferApi = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const status = req.query.status || '';
  const search = req.query.search || '';

  const filter = {};
   
  if(search){
    filter.$or = [
      {offerName:{$regex: search, $options: 'i'}},
      {offerType:{$regex: search, $options: 'i'}},
    ]
  }
   if(status === 'active'){
    filter.isActive = true;

   }else if(status === 'inactive'){
    filter.isActive = false;
   }
  const total = await Offer.countDocuments(filter);
  const offers = await Offer.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  res.json({
    offers,
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit)
  });
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

        offerNotification(newOffer);


       
        
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