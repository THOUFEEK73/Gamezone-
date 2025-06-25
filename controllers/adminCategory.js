import Category from "../models/CategoryModel.js";

export const getAllCategories = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page -1) * limit;

   
    const category = await Category.find().skip(skip).limit(limit).sort({createdAt:-1});
    const totalCategories = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategories / limit);

    res.render('admin/category', { 
      category: category, 
      currentPage: page, 
      totalPages 
  });
    // res.render("admin/category", { category });
  } catch (error) {
    console.error("Error fetching Categories:", error);
    res.status(500).render("error", { message: "Internal Server Error" });
  }
};

export const postAllCategories = async (req, res) => {
  try {
    console.log('Triggerd');
    const categoryName = req.body.categoryName;
    console.log('testing')
    if (!categoryName || categoryName.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "Category name is required" });
    }

    const existingCategory = await Category.findOne({ categoryName });
    if (existingCategory) {
      return res
        .status(400)
        .json({ success: false, err: "Category already existes" });
    }

    const newCategory = new Category({ categoryName });
  
    await newCategory.save();
    console.log("Category added successfully");
    return res
      .status(200)
      .json({ success: true, message: "Category added successfully" });
  } catch (err) {
    console.error("Error adding category", err);
    return res.status(500).json({
      success: false,
      message: "Error adding category please try again",
    });
  }
};

export const updateCategoryStatus = async (req, res) => {

  try {
    const categoryId = req.params.Id;
    const newStatus = req.body.status;

    console.log('triggered')
   
    await Category.findByIdAndUpdate(categoryId, {
      status: newStatus,
      new: true,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating Category status:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateCategory = async(req,res)=>{
      
        try{
                const categoryId =req.params.id;
                const {categoryName} = req.body;
                if(!categoryName || categoryName.trim() === "") {
                  
                        return res.status(400).json({success:false,message:"Category name is required"});
                }
                const existingCategory = await Category.findOne({categoryName});
               
                if(existingCategory && existingCategory._id.toString()!==categoryId){
                      return  res.status(400).json({success:false,message:"Category already existes"});
                }
              
                const updatedCategory = await Category.findByIdAndUpdate(categoryId,{categoryName},{new:true});

                if(!updatedCategory){
                        return res.status(404).json({success:false,message:"Category not found"});
                }

                return res.status(200).json({success:true,category:updatedCategory});


        }catch(err){
                  console.error("Error updating Category status",err);
                  return res.status(500).render("error",{message:"Internal Server Error"});
        }
}


