import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import employeesRoutes from './routes/employees.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import profileRoutes from './routes/profile.routes.js';
import leaveRoutes from './routes/leave.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
// Increase body size limit to handle base64 image uploads (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dayflow';

const connectDB = async () => {
  try {
    
    const connectionOptions = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };
    
   
    if (!MONGODB_URI.startsWith('mongodb+srv://')) {
      connectionOptions.family = 4;
    }
    
    const conn = await mongoose.connect(MONGODB_URI, connectionOptions);
    
    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    console.log(`Connection type: ${MONGODB_URI.startsWith('mongodb+srv://') ? 'Atlas (Cloud)' : 'Local'}`);
  } catch (error) {
    console.error(' MongoDB connection error:', error.message);
    console.error('\nTroubleshooting tips:');
    
    if (MONGODB_URI.startsWith('mongodb+srv://')) {
      console.error('   MongoDB Atlas connection failed:');
      console.error('   1. Check your connection string in backend/.env');
      console.error('   2. Verify your username and password are correct');
      console.error('   3. Ensure your IP address is whitelisted in Atlas (0.0.0.0/0 for all IPs)');
      console.error('   4. Check if your Atlas cluster is running');
      console.error('   5. Verify network access settings in Atlas dashboard');
    } else {
      console.error('   Local MongoDB connection failed:');
      console.error('   1. Make sure MongoDB is running: mongod');
      console.error('   2. Check if MongoDB is accessible at:', MONGODB_URI);
      console.error('   3. Verify your MONGODB_URI in backend/.env file');
    }
    console.error('');
    
   
    process.exit(1);
  }
};


mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});


connectDB();


app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/leave', leaveRoutes);


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DayFlow HRMS API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

