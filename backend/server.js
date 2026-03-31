import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import billRoutes from './routes/billRoutes.js';
import authRoutes from "./routes/authRoutes.js";
import userRoutes from './routes/userRoutes.js';
import milkRoutes from "./routes/milkRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());
// server.js mein cors update karo
app.use(cors({
  origin: [
    "http://localhost:5173",                        // local development
    "https://rental-management-woad-five.vercel.app"       // ← tera Vercel URL daalo
  ]
}));

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bill', billRoutes);
app.use('/api/milkentry', milkRoutes);

app.get('/', (req, res) => {
  res.send("API IS WORKING ✅");
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on http://localhost:${process.env.PORT}`);
});