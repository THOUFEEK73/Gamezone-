import { transposeIterableHandle } from "puppeteer"

export const getWalletPage = async(req, res) => {
    try{
        
        res.render('user/wallet',{page:'wallet'})
    }catch(error){

    }
}