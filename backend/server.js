import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import billRoutes from './routes/billRoutes.js';
import authRoutes from "./routes/authRoutes.js";
import userRoutes from './routes/userRoutes.js';
import milkRoutes from "./routes/milkRoutes.js";
import { startReminderCron } from "./cron/reminderCron.js";

dotenv.config();

const app = express();

// ✅ CORS PEHLE AANA CHAHIYE — bilkul upar
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://rental-management-woad-five.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

connectDB();
startReminderCron();

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