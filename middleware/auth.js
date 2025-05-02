import User from '../models/userModel.js';

const isAuthenticated = async (req, res, next) => {
    try {
        
   
        

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
      

        
    } catch (error) {
        console.error('Authentication middleware error:', error);
        return res.redirect('/login?error=auth_error');
    }
};

export default isAuthenticated;
