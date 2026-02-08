import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root
dotenv.config({ path: join(__dirname, '../.env') });

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST']
  }
});

const PORT = 8080;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(bodyParser.json());

// Basic health check
app.get('/', (req, res) => {
  res.send('AI Mail App Webhook Server Running');
});

// Gmail Pub/Sub Webhook Endpoint
app.post('/api/webhook/gmail', (req, res) => {
  console.log('Received webhook payload:', JSON.stringify(req.body, null, 2));

  // Verify the message contains data
  if (req.body && req.body.message) {
    const message = req.body.message;
    // const data = Buffer.from(message.data, 'base64').toString();
    // console.log('Decoded data:', data);

    // Emit event to all connected clients
    console.log('Emitting email:new event to clients');
    io.emit('email:new', {
      timestamp: new Date().toISOString(),
      messageId: message.messageId
    });
  }

  // Always return 200 OK to acknowledge receipt
  res.status(200).send('OK');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Webhook Server running on http://localhost:${PORT}`);
  console.log(`Socket.IO available at http://localhost:${PORT}`);
});
