import session from 'express-session';
import MongoStore from 'connect-mongo';

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'defaultSecret',
    resave: false,
    saveUninitialized: false,
    store:MongoStore.create({
        mongoUrl:process.env.MONGO_URI,
        collectionName:'sessions',
        ttl:24*60*60
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    },
    name: 'sessionId'
});

export default sessionMiddleware;

