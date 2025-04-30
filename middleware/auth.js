import User from '../models/userModel.js';

const isAuthenticated = async (req, res, next) => {
    try {
        // Debug logging
        // console.log('Session ID:', req.sessionID);
        // console.log('Session Data:', req.session);
        // console.log('sessionData',req.user)
        

        if(!req.session.userId){
            return res.redirect('/login')
        }

        const user = await User.findById(req.session.userId);
        if(!user || !user.isVerified){
            req.session.destroy((err)=>{
                if(err){
                    console.error('Session destruction error',err);
                }
                res.clearCookie('connect.sid');
                req.session = null;
                return res.redirect('/login')
            })
            return;
        }
     

        next();
      
        // if (req.session.userId || (req.isAuthenticated() && req.session.user)) {
        //     // If using passport (Google auth), ensure session is synchronized
            
        //     if (req.session.user && !req.session.userId) {
        //         req.session.userId = req.user._id;
        //         req.session.user = {
        //             name: req.user.name,
        //             email: req.user.email
        //         };
        //         // Force session save
        //         await new Promise((resolve, reject) => {
        //             req.session.save(err => {
        //                 if (err) reject(err);
        //                 resolve();
        //             });
        //         });
        //     }
        //     return next();
        // }

        // console.log('User not authenticated');
        
    } catch (error) {
        console.error('Authentication middleware error:', error);
        return res.redirect('/login?error=auth_error');
    }
};

export default isAuthenticated;
