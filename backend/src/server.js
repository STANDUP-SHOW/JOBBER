require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { initSockets } = require('./sockets');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*', credentials: true },
});

initSockets(io);

server.listen(PORT, () => {
  console.log(`Jobber API listening on http://localhost:${PORT}`);
});
