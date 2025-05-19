import express from "express";
import authRoutes from "./routes/authRoutes.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import mongoose from "mongoose";
import sessionMiddleware from "./middleware/sessionMiddleWare.js";
import adminRoutes from "./routes/adminRoutes.js";
import passport from './config/passport.js'; 
import flash from 'connect-flash';


dotenv.config();
const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static('public'));

// View engine setup
app.set("view engine", "ejs");
app.set("views", "views");

// Session and authentication middleware
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// Add user to res.locals
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// Cache control for sensitive routes
app.use(["/login","/signup","/verify-otp"], (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// Authentication error handler
app.use((err, req, res, next) => {
  if (err.name === 'AuthenticationError') {
    console.error('Authentication Error:', err);
    return res.redirect('/login?error=' + encodeURIComponent(err.message));
  }
  next(err);
});

// General error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});





// Routes
app.use('/admin', adminRoutes);
app.use("/", authRoutes);









// Connect to MongoDB
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// Handle process termination
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed through app termination");
    process.exit(0);
  } catch (err) {
    console.error("Error closing MongoDB Connection:", err);
    process.exit(1);
  }
});
