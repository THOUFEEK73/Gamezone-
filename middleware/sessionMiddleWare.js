import session from 'express-session';

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'defaultSecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'  // Changed from 'strict' to 'lax' to allow Google OAuth redirects
    },
    name: 'sessionId',
    rolling: true
});

export default sessionMiddleware;