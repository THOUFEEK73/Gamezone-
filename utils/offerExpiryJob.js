import cron from 'node-cron';

import Offer from '../models/offerModel.js';

import Coupon from '../models/couponModel.js';



cron.schedule('0 0 * * *', async () =>{
    

     try{
        const now = new Date();

 
  await Offer.updateMany(
    { endDate: { $lt: now }, isActive: true },
    { $set: { isActive: false} }
  );

  //  active offers when the start date is came
  await Offer.updateMany(
    { startDate: { $lte: now }, endDate: { $gte: now }, isActive: false },
    { $set: { isActive: true } }
  );


  // coupn

  await Coupon.updateMany(
    { endDate: { $lt: now } },
    { $set: { isActive: false, isExpired: true } }
  );
  await Coupon.updateMany(
    { startDate: { $lte: now }, endDate: { $gte: now } },
    { $set: { isActive: true, isExpired: false } }
  );

  await Coupon.updateMany(
    { startDate: { $gt: now } },
    { $set: { isActive: false, isExpired: false } }
  );

     }catch(error){
            console.error('Error updating :', error);
     }
})