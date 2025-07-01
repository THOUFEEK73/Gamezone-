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
    callbackURL: process.env.GOOGLE_CALLBACK,
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

        const email = profile.emails && profile.emails[0] && profile.emails[0].value;

        if(!email){
            throw new Error('No email provided from Google profile');
        }
             
        let emailUser = await User.findOne({email});
        if (emailUser) {
            // If user exists and has a password, do NOT link Google account
            if (emailUser.password && emailUser.password !== '') {
                // Prevent login, show message
                return done(null, false, { message: "An account with this email already exists. Please log in with your password." });
            } else {
                // User exists, but is Google-only (no password), link Google ID
                emailUser.googleId = profile.id;
                emailUser.lastLogin = new Date();
                await emailUser.save();
                return done(null, emailUser);
            }
        }
        console.log('Creating new user from Google profile');
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
