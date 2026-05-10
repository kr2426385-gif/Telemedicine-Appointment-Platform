require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const apiRoutes = require('./routes');

const app = express();
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://telemedicine-flame-rho.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
}));
app.options('*', cors());
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, '..', 'public')));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});
app.use('/api/v1', apiRoutes);

app.use(errorHandler);

module.exports = app;
