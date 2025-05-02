import User from "../models/userModel.js";
import { comparePassword } from "../utils/hash.js";



export const getAdminLoginPage = (req,res)=>{
    console.log("admin login page");
    if(req.session.adminId){
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login',{err:null});
}


export const postAdminLogin = async (req,res)=>{
    try{
        const {email,password} = req.body;
    
        if(!email || !password){
           return res.render('admin/login',{err:'Please fill all the fields'}); 
        }
    const adminUser = await User.findOne({email});
    if(!adminUser){
        return res.render('admin/login',{err:'Invalid Credential '});
    }

    if(!adminUser || !(await comparePassword(password,adminUser.password))){
        return res.render('admin/login',{err:'Invalid email or password'});
    }

    if(!adminUser.isAdmin){
        return res.render('admin/login',{err:'You are not athorized to access this page'})
    }

    req.session.adminId = adminUser._id;
    req.session.admin ={
        name:adminUser.name,
        email:adminUser.email,
    };

     res.redirect('/admin/dashboard');

    }catch(err){
        console.error("admin Login error",err);
        return res.status(500).render('admin/login',{err:'Internal Server Error Please try again later'});
    //    return res.status(500).json({message:'Internal Server Error'});
    }
    
  
}


export const adminLogout = (req, res) => {
    req.session.adminId = null;
        
    return res.redirect('/admin/login');


    // req.session.destroy((err) => {
    //   if (err) {
    //     console.error('Error destroying admin session:', err);
    //     return res.status(500).json({ message: "Error destroying session" });
    //   }
    //   res.clearCookie('connect.sid');
    //   res.redirect('/admin/login');
    // });
  };