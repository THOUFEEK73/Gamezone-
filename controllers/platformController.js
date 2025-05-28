import Category from '../models/CategoryModel.js'
import Game from '../models/gameModel.js';
export const getPlatFormPage = async(req,res)=>{
   
    try{
        const category =await Category.find();
        res.render('admin/platform',{category});
}catch(error){

}
}























//orderid status // status cancel / 


// export const  updateStock = async(req,res)=>{
//        const {orderId,status} = req.body;
 

//        const order = Order.findById(orderId);
//        game = Game.findById(itemId);
  
//     if(status === 'Cancelled'){
         
//         order.status = status;
//         game.stock += order.stock;
        
//     }
  
//     await order.save();
     


// }




