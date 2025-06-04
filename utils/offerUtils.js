import Offer from '../models/offerModel.js';

export const calculateDiscountedPrice = (originalPrice,discountPercentage) => {

    const discount = (originalPrice * discountPercentage) / 100;

    return Math.round(originalPrice - discount);
}

export const getActiveOffers = async() =>{
    const now = new Date();

    return await Offer.find({
        isActive:true,
        startDate:{$lte:now},
        endDate:{$gte:now}
    })
}