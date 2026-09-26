import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import urlRoutes from './routes/urlRoutes.js';

dotenv.config();

const app = express();

app.set('trust proxy', 1);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://root:rootpassword@localhost:27017/michicode?authSource=admin';


app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => {
    console.error('❌ Error conectando a MongoDB:', err);
  });

app.use('/api', urlRoutes);

app.use('/', urlRoutes);

app.get('/', (_, res) => {
  res.json({ message: 'MichiCode API funcionando 🚀' });
});

app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});