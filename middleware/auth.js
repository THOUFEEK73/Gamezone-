import User from '../models/userModel.js';

const isAthenticated = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      console.log(user);

      if (!user || user.isVerified === false) {
        req.session.destroy((err) => {
          if (err) {
            console.log('Session destroy error:', err);
          }
          // Redirect outside of callback to avoid double response
          return res.redirect('/login?blocked=true');
        });
        return; // Ensure no further code runs
      }

      // All good, user is verified
      return next();
    } catch (err) {
      console.error('Error in isAthenticated middleware:', err);
      return res.redirect('/login');
    }
  } else {
    return res.redirect('/login');
  }
};

export default isAthenticated;
