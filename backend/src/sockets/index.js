const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/prisma');

function initSockets(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = verifyToken(token);
      socket.user = { id: payload.sub, role: payload.role };
      next();
    } catch (err) {
      next(new Error('Authentification socket invalide'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('message:send', async ({ conversationId, content }, ack) => {
      try {
        const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
        if (!conversation) return ack?.({ error: 'Conversation introuvable' });
        if (![conversation.clientId, conversation.providerId].includes(socket.user.id)) {
          return ack?.({ error: 'Non autorisé' });
        }

        const message = await prisma.message.create({
          data: { conversationId, senderId: socket.user.id, content },
          include: { sender: { select: { id: true, firstName: true, avatarUrl: true } } },
        });

        io.to(`conversation:${conversationId}`).emit('message:new', message);
        ack?.({ message });
      } catch (err) {
        ack?.({ error: 'Erreur lors de l\'envoi du message' });
      }
    });

    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('typing', { userId: socket.user.id, isTyping });
    });
  });
}

module.exports = { initSockets };
