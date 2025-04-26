import passport from "passport";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/userModel.js';
import dotenv from 'dotenv';
dotenv.config();

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

// Serialize the entire user object
passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    try {
        if (!user) {
            return done(new Error('No user to serialize'));
        }
        // Use id instead of _id
        done(null, user.id);
    } catch (error) {
        console.error('Serialization error:', error);
        done(error, null);
    }
});

// Deserialize with proper error handling
passport.deserializeUser(async (id, done) => {
    console.log('Deserializing user ID:', id);
    try {
        // Ensure proper ID format
        if (!id || typeof id !== 'string') {
            console.error('Invalid ID format:', id);
            return done(new Error('Invalid user ID format'));
        }

        const user = await User.findById(id);
        
        if (!user) {
            console.log('User not found during deserialization');
            return done(null, false); // Changed from Error to false for proper handling
        }

        console.log('User deserialized successfully:', user.email);
        return done(null, user); // Added return statement
    } catch (error) {
        console.error('Deserialization error:', error);
        return done(error, null); // Added return statement
    }
});

export default passport;
