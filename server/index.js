import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  verifyWebhookSignature,
  validatePayload,
  extractSignature
} from './webhook-verifier.js';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root
dotenv.config({ path: join(__dirname, '../.env') });

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

// Pub/Sub verification token from environment
const PUBSUB_VERIFICATION_TOKEN = process.env.GOOGLE_PUBSUB_VERIFICATION_TOKEN || '';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST']
  }
});

const PORT = 8080;

// Custom body parser to preserve raw body for signature verification
const rawBodySaver = (req, res, buf, encoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
};

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

// Parse body with raw body preservation for signature verification
app.use(bodyParser.json({ verify: rawBodySaver }));

// Basic health check
app.get('/', (req, res) => {
  res.send('AI Mail App Webhook Server Running');
});

/**
 * Gmail Pub/Sub Webhook Endpoint
 *
 * This endpoint receives push notifications from Gmail Pub/Sub.
 * All requests must include a valid HMAC signature to be processed.
 */
app.post('/api/webhook/gmail', (req, res) => {
  console.log('Received webhook request at:', new Date().toISOString());

  // Extract signature from headers or query
  const signature = extractSignature(req.headers, req.query);

  // If no verification token is configured, log warning but allow (dev mode)
  if (!PUBSUB_VERIFICATION_TOKEN) {
    console.warn('WARNING: GOOGLE_PUBSUB_VERIFICATION_TOKEN not set - skipping signature verification');
    console.warn('Set this environment variable in production for security!');
  } else {
    // Verify HMAC signature
    const rawBody = req.rawBody ? Buffer.from(req.rawBody, 'utf-8') : Buffer.from(JSON.stringify(req.body), 'utf-8');

    if (!signature) {
      console.error('Webhook request rejected: Missing signature header');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing X-Goog-Signature header'
      });
    }

    const signatureValid = verifyWebhookSignature(
      signature,
      rawBody,
      PUBSUB_VERIFICATION_TOKEN
    );

    if (!signatureValid) {
      console.error('Webhook request rejected: Invalid signature');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid signature'
      });
    }

    console.log('Signature verification passed');
  }

  // Validate payload structure
  const payloadValidation = validatePayload(req.body);
  if (!payloadValidation.valid) {
    console.error('Webhook request rejected: Invalid payload -', payloadValidation.error);
    return res.status(400).json({
      error: 'Bad Request',
      message: payloadValidation.error
    });
  }

  console.log('Webhook payload validated successfully');
  console.log('Payload:', JSON.stringify(req.body, null, 2));

  // Process the message
  const message = req.body.message;

  // Emit event to all connected clients
  console.log('Emitting email:new event to clients');
  io.emit('email:new', {
    timestamp: new Date().toISOString(),
    messageId: message.messageId
  });

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

  if (!PUBSUB_VERIFICATION_TOKEN) {
    console.warn('');
    console.warn('⚠️  SECURITY WARNING: GOOGLE_PUBSUB_VERIFICATION_TOKEN not configured!');
    console.warn('   Webhook signature verification is disabled.');
    console.warn('   Set this environment variable for production deployment.');
    console.warn('');
  } else {
    console.log('Signature verification: ENABLED');
  }
});
