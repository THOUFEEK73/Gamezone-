import User from '../models/userModel.js';

export const getAllUsersPage = async(req , res)=>{
    try{
        if(!req.session.admin){
            return res.redirect('/admin/login');
        }
        const users = await User.find();
        return res.render('admin/users',{users});

    }catch(err){
        console.error("Error in getting all users page",err);
        return res.render('admin/users');
    }
}

export const blockUser = async (req, res) => {
    try {
      if (!req.session.admin) {
        return res.redirect('/admin/login');
      }
  
      const { userId, isVerified } = req.body;

      if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID is required' });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      // Convert isVerified to boolean and toggle
    //   const verified = isVerified === true || isVerified === 'true';
      user.isVerified = isVerified;
      await user.save();
  
      return res.json({ success: true, message: 'User status updated' });
  
    } catch (err) {
      console.error('Error is unable to block or unblock the user', err);
      return res.status(500).json({ success: false, message: 'Something went wrong' });
    }
  };
  