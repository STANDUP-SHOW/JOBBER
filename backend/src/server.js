require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { initSockets } = require('./sockets');

const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      try {
        const hostname = new URL(origin).hostname;
        if (hostname.endsWith('.vercel.app')) return callback(null, true);
        if (hostname === 'localhost' || hostname === '127.0.0.1') return callback(null, true);
      } catch { /* ignore */ }
      callback(new Error(`Origin non autorisée par CORS: ${origin}`));
    },
    credentials: true,
  },
});
initSockets(io);

server.listen(PORT, () => {
  console.log(`Jobber API listening on http://localhost:${PORT}`);
});
