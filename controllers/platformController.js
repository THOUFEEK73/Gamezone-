import Category from '../models/CategoryModel.js'
export const getPlatFormPage = async(req,res)=>{
   
    try{
        const category =await Category.find();
        res.render('admin/platform',{category});
}catch(error){

}
}