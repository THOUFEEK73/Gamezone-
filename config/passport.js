import passport from "passport";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/userModel.js';
import dotenv from 'dotenv';
dotenv.config();

// save minimal information in the session
passport.serializeUser((user, done) => {
    if (!user.id) {
        console.error('Serialization error: No user ID present');
        return done(new Error('No user ID found'));
    }
    console.log('Serializing user:', user.id);
    done(null, user.id);
});

// if the user is already logged in, fetch the user from the database
passport.deserializeUser(async (id, done) => {
    try {
        console.log('Deserializing user:', id);
        if (!id) {
            throw new Error('No user ID provided for deserialization');
        }
        const user = await User.findById(id);
        if (!user) {
            throw new Error('User not found during deserialization');
        }
        done(null, user);
    } catch (error) {
        console.error('Deserialize error:', error);
        done(error, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
    proxy: true
}, async (accessToken, refreshToken, profile, done) => {
    try {
        if (!profile || !profile.id) {
            throw new Error('Invalid profile data received from Google');
        }

        console.log('Google authentication attempt for profile:', profile.id);
        
        let existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
            console.log('Existing user found:', existingUser.id);
            existingUser.lastLogin = new Date();
            await existingUser.save();
            return done(null, existingUser);
        }
      
        if (!profile.emails || !profile.emails[0] || !profile.emails[0].value) {
            throw new Error('No email provided from Google');
        }

        console.log('Creating new user from Google profile');
        const newUser = new User({
            googleId: profile.id,
            name: profile.displayName || 'Google User',
            email: profile.emails[0].value,
            isVerified: true,
            isAdmin: false,
            phone: '',
            avatar: profile.photos?.[0]?.value || '',
            lastLogin: new Date(),
        });

        await newUser.save();
        console.log('New user created:', newUser.id);
        return done(null, newUser);
    } catch (error) {
        console.error('Google Strategy Error:', error);
        return done(error, null);
    }
}));

export default passport;
