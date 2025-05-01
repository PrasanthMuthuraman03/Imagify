import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/mongodb.js';
import userRouter from './routes/userRoutes.js';
import imageRouter from './routes/imageRoutes.js';

// Load .env variables
dotenv.config();

const PORT = process.env.PORT || 4000;
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Connect to DB
connectDB();

// API Routes
app.use('/api/user', userRouter);
app.use('/api/image', imageRouter);

// Default Route
app.get('/', (req, res) => res.send("✅ API Working"));

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
