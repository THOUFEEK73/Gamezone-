import Offer from '../models/offerModel.js'
import Category from '../models/CategoryModel.js'
import Game from '../models/gameModel.js'

export const getOfferPage = async(req,res)=>{
    try {
        console.log('Fetching offer page');

        const games = await Game.find({status:'active'}).select('title _id');
        const category = await Category.find({status:'active'}).select('categoryName _id');
        const offers = await Offer.find().sort({createdAt: -1});
        
        console.log('testing offers ',offers)
        
        
        res.render('admin/offers',{games,category,offers});
    } catch(error) {
        console.error('Error in getOfferPage:', error);
        res.status(500).send('Internal Server Error');
    }
}

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

        if(!startDate) {
            errors.startDate = 'Start date is required';
        } else if (isNaN(start.getTime())) {
            errors.startDate = 'Invalid start date';
        }//else if (start < currentDate) {
        //     errors.startDate = 'Start date cannot be in the past';
        // }

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