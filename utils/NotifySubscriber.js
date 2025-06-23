import Subscriber from '../models/subscriberModel.js';
import sendEmail from './mailer.js';

export const offerNotification = async(offer)=>{
     try{
         console.log('offerNotification function triggered with offer:',offer);
        const subscribers = await Subscriber.find({});
        const subject = `🔥 Limited Time Offer: ${offer.offerName} Just Dropped!`;


        const text = `Hey Gamer,

        We’ve just launched a hot new offer: ${offer.offerName}
        
        ${offer.description}
        
        This is your chance to grab top titles at unbeatable prices.
        
        ⏳ Hurry – this offer is only valid for a limited time!
        
        Check it out at: https://yourdomain.com/allgames
        
        Game on!
        Team GameZone`;
        

        const html = `
        <div style="font-family: 'Segoe UI', sans-serif; color: #2d2d2d; max-width: 600px; margin: auto; background: #f9fafb; padding: 30px; border-radius: 10px;">
          <h2 style="color: #4f46e5; font-size: 22px;">🔥 Limited-Time Offer: <span style="color: #4338ca;">${offer.offerName}</span></h2>
          
          <p style="font-size: 15px; margin-top: 16px;">Hi Gamer,</p>
      
          <p style="font-size: 15px;">
            A brand new offer is live on <strong>GameZone</strong> – and it's one you won't want to miss!
          </p>
      
          <div style="background: #eef2ff; padding: 15px 20px; margin: 20px 0; border-left: 4px solid #6366f1; border-radius: 5px;">
            <strong style="color: #3730a3;">${offer.offerName}</strong><br/>
            <span style="font-size: 14px;">${offer.description}</span>
          </div>
      
          <p style="font-size: 15px;">
            Whether you're into action, RPGs, or shooters – this deal is your chance to expand your collection and save.
          </p>
      
          <a href="https://yourdomain.com/allgames" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            🎮 View Deals on GameZone
          </a>
      
          <p style="font-size: 13px; color: #777; margin-top: 30px;">
            You received this email because you subscribed to GameZone notifications.
            <br>If you no longer want to receive these, you can <a href="https://yourdomain.com/unsubscribe" style="color: #4f46e5; text-decoration: underline;">unsubscribe here</a>.
          </p>
      
          <p style="margin-top: 20px; font-weight: bold;">– Team GameZone</p>
        </div>
      `;
      


                      for(const sub of subscribers){
                        await sendEmail(sub.email,subject,text,html);
                      }

     }catch(error){
        console.error('Failed to notify subscribers:', error);
     }
}


export const couponNotification = async (coupon) => {
    try {
      console.log('couponNotification function triggered with coupon:', coupon);
      const subscribers = await Subscriber.find({});
      const subject = `🎁 Just Dropped: ${coupon.code} – Save Big at GameZone!`;

      const text = `Hey Gamer,

      We've just released a new coupon: ${coupon.code}
      
      ${coupon.description}
      
      Apply this code at checkout and save instantly: ${coupon.code}
      
      Use it now at: https://yourdomain.com/allgames
      
      Stay epic,
      Team GameZone
      `;
      
  
      const html = `
      <div style="font-family: 'Segoe UI', sans-serif; color: #2d2d2d; max-width: 600px; margin: auto; background: #f9fafb; padding: 30px; border-radius: 10px;">
        <h2 style="color: #10b981; font-size: 22px;">🎁 New GameZone Coupon: <span style="color: #0f766e;">${coupon.code}</span></h2>
        
        <p style="font-size: 15px; margin: 16px 0;">Hi Gamer,</p>
    
        <p style="font-size: 15px;">
          We’ve got something exciting for you – a brand new coupon to power up your collection!
        </p>
    
        <div style="background: #ecfdf5; padding: 15px 20px; margin: 20px 0; border-left: 4px solid #10b981; border-radius: 5px;">
          <strong style="color: #0f766e;">${coupon.code}</strong><br/>
          <span style="font-size: 14px;">${coupon.description}</span>
        </div>
    
        <p style="font-size: 15px;">Use this coupon at checkout to save on your next purchase.</p>
    
        <a href="https://yourdomain.com/allgames" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
          🔓 Redeem Your Coupon
        </a>
    
        <p style="font-size: 13px; color: #666; margin-top: 30px;">
          You received this email because you subscribed to GameZone updates.<br>
          Not interested? <a href="https://yourdomain.com/unsubscribe" style="color: #10b981; text-decoration: underline;">Unsubscribe</a>.
        </p>
    
        <p style="margin-top: 20px; font-weight: bold;">– Team GameZone</p>
      </div>
    `;
    
  
      for (const sub of subscribers) {
        await sendEmail(sub.email, subject, text, html);
      }
      console.log('Coupon notification emails sent to all subscribers.');
    } catch (error) {
      console.error('Failed to notify subscribers about coupon:', error);
    }
  };