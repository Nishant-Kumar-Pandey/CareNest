const { Server } = require('socket.io');

let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      console.log('🔗 Client connected to socket:', socket.id);

      // Users can join a room bearing their User ID to receive personal notifications
      socket.on('join_personal_room', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their personal notification room`);
      });

      // Users can join a specific booking room to chat
      socket.on('join_booking_room', (bookingId) => {
        socket.join(bookingId);
        console.log(`Socket ${socket.id} joined booking room ${bookingId}`);
      });

const Message = require('./models/Message');

      // Handle chat messages
      socket.on('send_message', async (data) => {
        // data: { bookingId, senderId, text }
        try {
          const message = await Message.create({
            booking: data.bookingId,
            sender: data.senderId,
            text: data.text,
            timestamp: new Date()
          });
          
          await message.populate('sender', 'name role');
          await message.populate({
            path: 'booking',
            populate: [
              { path: 'patient', select: 'user' },
              { path: 'caregiver', select: 'user' }
            ]
          });

          // 1. Broadcast to everyone else in the booking room (for open chat drawers)
          io.to(data.bookingId).emit('receive_message', message);

          // 2. Broadcast to each participant's personal room (for global notifications / unread counts)
          const patientUserId = message.booking.patient?.user?.toString();
          const caregiverUserId = message.booking.caregiver?.user?.toString();

          if (patientUserId) io.to(patientUserId).emit('new_chat_message', message);
          if (caregiverUserId) io.to(caregiverUserId).emit('new_chat_message', message);
        } catch (err) {
          console.error('Socket error sending message:', err.message);
        }
      });

      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
