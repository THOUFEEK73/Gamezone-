import Category from '../models/CategoryModel.js';

export const getAllCategories = async (req,res)=>{
         
        try{
                const category =await Category.find();
                res.render('admin/category',{category});
        }catch(error){

        }
}

export const postAllCategories = async(req,res)=>{
        const categoryName = req.body.categoryName
        console.log(categoryName)  
        const newCategory =new Category({categoryName:categoryName});
        await newCategory.save()
        return res.redirect('/admin/category')    
}

export const  updateCategoryStatus = async(req,res)=>{
       
        try{
                const categoryId =req.params.id;
                const newStatus = req.body.status;
                await Category.findByIdAndUpdate(categoryId,{status:newStatus,new:true});
                console.log(newStatus)
                res.json({success:true});
        }catch(error){
                console.error('Error updating Category status:',error);
                return res.status(500).json({message:'Internal Server Error'});
        }

}