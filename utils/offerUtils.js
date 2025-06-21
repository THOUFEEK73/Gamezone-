import Offer from '../models/offerModel.js';

export const calculateDiscountedPrice = (originalPrice, discountPercentage) => {
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


export const applyOffers = (game,activeOffers)=>{
    const gameObj = game.toObject();

    const productOffer = activeOffers.find(offer=>
        offer.offerType === 'product' &&
        offer.items.includes(game._id.toString()) &&
        offer.isActive
    )

    const categortyOffer = activeOffers.find(offer=>
        offer.offerType === 'category' &&
        offer.items.includes(game.category._id.toString()) &&
        offer.isActive
    )

    const bestOffer = [productOffer, categortyOffer].filter(Boolean).sort((a, b) => b.discountPercentage - a.discountPercentage)[0];

    if (bestOffer) {
        gameObj.originalPrice = gameObj.price;
        gameObj.discountPercentage = bestOffer.discountPercentage;
        gameObj.price = calculateDiscountedPrice(game.price, bestOffer.discountPercentage);
        gameObj.offerName = bestOffer.offerName;
    }
    return gameObj;
}