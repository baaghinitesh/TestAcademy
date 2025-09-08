const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Test attempt management
  const activeAttempts = new Map(); // attemptId -> { studentId, testId, startTime, timer }

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Join test room when starting an attempt
    socket.on('join-test', async (data) => {
      const { attemptId, testId, studentId, duration } = data;
      
      socket.join(`test-${testId}`);
      socket.join(`attempt-${attemptId}`);
      
      console.log(`Student ${studentId} joined test ${testId}, attempt ${attemptId}`);
      
      // Track active attempt
      activeAttempts.set(attemptId, {
        studentId,
        testId,
        startTime: Date.now(),
        duration: duration * 60 * 1000, // Convert minutes to milliseconds
        socketId: socket.id
      });

      // Send initial timer sync
      socket.emit('timer-sync', {
        serverTime: Date.now(),
        remainingTime: duration * 60 * 1000
      });

      // Set up auto-submit timer
      const autoSubmitTimer = setTimeout(() => {
        socket.emit('auto-submit', { 
          attemptId,
          reason: 'Time expired'
        });
        
        // Clean up
        activeAttempts.delete(attemptId);
      }, duration * 60 * 1000);

      // Store timer reference
      if (activeAttempts.has(attemptId)) {
        activeAttempts.get(attemptId).timer = autoSubmitTimer;
      }
    });

    // Handle answer auto-save
    socket.on('auto-save', async (data) => {
      const { attemptId, questionId, selectedOptions, timeSpent } = data;
      
      try {
        // Emit to the specific attempt room to confirm save
        io.to(`attempt-${attemptId}`).emit('save-confirmed', {
          questionId,
          timestamp: Date.now()
        });
        
        console.log(`Auto-saved answer for attempt ${attemptId}, question ${questionId}`);
      } catch (error) {
        console.error('Auto-save error:', error);
        socket.emit('save-error', { error: error.message });
      }
    });

    // Handle timer sync requests
    socket.on('request-timer-sync', (data) => {
      const { attemptId } = data;
      const attempt = activeAttempts.get(attemptId);
      
      if (attempt) {
        const elapsed = Date.now() - attempt.startTime;
        const remaining = Math.max(0, attempt.duration - elapsed);
        
        socket.emit('timer-sync', {
          serverTime: Date.now(),
          remainingTime: remaining
        });
      }
    });

    // Handle test submission
    socket.on('submit-test', (data) => {
      const { attemptId } = data;
      const attempt = activeAttempts.get(attemptId);
      
      if (attempt && attempt.timer) {
        clearTimeout(attempt.timer);
        activeAttempts.delete(attemptId);
        
        console.log(`Test submitted for attempt ${attemptId}`);
        
        socket.emit('submission-confirmed', {
          attemptId,
          timestamp: Date.now()
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
      
      // Clean up any active attempts for this socket
      for (const [attemptId, attempt] of activeAttempts.entries()) {
        if (attempt.socketId === socket.id) {
          if (attempt.timer) {
            clearTimeout(attempt.timer);
          }
          activeAttempts.delete(attemptId);
          console.log(`Cleaned up attempt ${attemptId} for disconnected socket`);
        }
      }
    });

    // Admin features
    socket.on('admin-join', (data) => {
      socket.join('admin-room');
      console.log('Admin joined monitoring room');
    });

    // Broadcast test updates to admins
    socket.on('test-updated', (data) => {
      io.to('admin-room').emit('test-update', data);
    });
  });

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log('> Socket.io server is running');
    });
});