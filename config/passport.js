import passport from "passport";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/userModel.js';
import dotenv from 'dotenv';
dotenv.config();

// Serialize user for the session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/auth/google/callback",
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Log the profile data for debugging
        console.log('Google Profile:', profile);
        
        let existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
            console.log('Existing user found:', existingUser);
            existingUser.lastLogin = new Date();
            await existingUser.save();
            return done(null, existingUser);
        }
      
        console.log('Creating new user from Google profile');
        const newUser = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            isVerified: true,
            isAdmin: false,
            phone: '',
            avatar: profile.photos[0].value,
            lastLogin: new Date(),
        });
        await newUser.save();
        console.log('New user created:', newUser);
        return done(null, newUser);
    } catch (error) {
        console.error('Google Strategy Error:', error);
        return done(error, null);
    }
}));

export default passport;
