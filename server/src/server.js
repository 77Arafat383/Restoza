const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

const zlib = require('zlib');

dotenv.config();

const apiRoutes = require('./routes/api');
const prisma = require('./prisma');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

app.set('io', io);

// Native lightweight Gzip compression middleware
const gzipCompression = (req, res, next) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (!acceptEncoding.includes('gzip')) return next();

  const originalJson = res.json;
  res.json = function (data) {
    const jsonStr = JSON.stringify(data);
    if (jsonStr.length > 512) {
      zlib.gzip(Buffer.from(jsonStr), (err, compressed) => {
        if (err) return originalJson.call(res, data);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Vary', 'Accept-Encoding');
        res.send(compressed);
      });
      return;
    }
    return originalJson.call(res, data);
  };
  next();
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(gzipCompression);
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date(), app: 'Restoza Server' });
});

// Mount Routes
app.use('/api', apiRoutes);

// Socket.io Connection Handler
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`[Socket.io] Client ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Restoza API & Socket.io server running at http://localhost:${PORT}`);
});
