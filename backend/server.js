const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('./middleware/rateLimiter');
const Logger = require('./utils/logger');
const disasterRoutes = require('./routes/disasterRoutes');
const reportRoutes = require('./routes/reportRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://disaster-response-coordination-nine.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Make Socket.IO available globally via app
app.set('io', io);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://disaster-response-coordination-nine.vercel.app'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit(100, 60000)); // 100 requests per minute

// API Routes
app.use('/api/disasters', disasterRoutes);
app.use('/api/reports', reportRoutes);

// Socket.IO connections
io.on('connection', (socket) => {
  Logger.info('New client connected', { socket_id: socket.id });

  socket.on('disconnect', () => {
    Logger.info('Client disconnected', { socket_id: socket.id });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
