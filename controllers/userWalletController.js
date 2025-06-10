import Wallet from '../models/walletModel.js';

export const getWalletPage = async(req, res) => {
    try{

        const user = req.session.userId;
        console.log(user)

        const wallet = await Wallet.findOne({ userId:user }).lean();

        
        
        res.render('user/wallet',{page:'wallet',wallet})
    }catch(error){
        console.error(error);
        res.status(500).render('error', { message: 'Server error loading wallet' });
    }
}