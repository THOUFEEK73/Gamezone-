import Wallet from '../models/walletModel.js';

export const getWalletPage = async (req, res) => {
    try {
      const userId = req.session.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = 5;
      const skip = (page - 1) * limit;
  
      const wallet = await Wallet.findOne({ userId }).lean();
  
      if (!wallet) {
        return res.status(404).render('error', { message: 'Wallet not found' });
      }
  
      const totalTransactions = wallet.transactions?.length || 0;
      const totalPages = Math.ceil(totalTransactions / limit);
  
      const paginatedTransactions = wallet.transactions
        .slice()
        .reverse()
        .slice(skip, skip + limit);
  
      const isAjax = req.xhr || req.headers.accept.indexOf('json') > -1;
  
      if (isAjax) {
        // Only render part of the HTML if it's an AJAX request (for fetch)
        return res.render('user/partials/walletTable', {
          layout: false,
          wallet: { ...wallet, transactions: paginatedTransactions },
          currentPage: page,
          totalPages,
        });
      }
  
      res.render('user/wallet', {
        page: 'wallet',
        wallet: { ...wallet, transactions: paginatedTransactions },
        currentPage: page,
        totalPages,
      });
    } catch (error) {
      console.error(error);
      res.status(500).render('error', { message: 'Server error loading wallet' });
    }
  };
  