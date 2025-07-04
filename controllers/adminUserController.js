import User from '../models/userModel.js';
import _ from 'lodash'
export const getAllUsersPage = async(req , res)=>{
    try{
        if(!req.session.admin){
            return res.redirect('/admin/login');
        }
       
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip  = (page - 1) * limit;
        const totalUsers  = await User.countDocuments();
   
        const totalPages = Math.ceil(totalUsers / limit);
        const users = await User.find().skip(skip).limit(limit)
        return res.render('admin/users',{users:users,currentPage:page,totalPages});

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

  const debouncedSearch = _.debounce(async(searchQuery,res)=>{
    try{
      const users = await User.find({
         $or:[
          {name:{$regex:searchQuery,$options:'i'}},
          {email:{$regex:searchQuery,$options:'i'}},
         ]
      }).limit(10);
      return res.json({success:true,users});
    }catch(error){
     console.error('Error searching users',error);
     return res.status(500).json({success:false,error:' Server Error'})
      
    }
  },300);
  
  
  // export const searchUsers = async(req,res)=>{
  //   try{
  //     if(!req.session.admin){
  //       return res.status(401).json({success:false,message:'Unauthorized'});
  //     }
  //     const {query} = req.query;
  //     if (!query || query.length < 2) {
  //       return res.json({ success: true, users: [] });
  //     }
      
  //     debouncedSearch(query, res);
  //   } catch (err) {
  //     console.error('Error in searching users:', err);
  //     return res.status(500).json({ success: false, message: 'Something went wrong' });
  //   }
  // }
  
  export const searchUsers = async (req, res) => {
    try {
      if (!req.session.admin) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
        const query = req.query.query || '';
        console.log('Searching users with query:', req.query.query);
        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        });
        res.json({ success: true, users });
    } catch (error) {
        res.json({ success: false, users: [] });
    }
};