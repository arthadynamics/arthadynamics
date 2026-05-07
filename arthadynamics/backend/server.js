const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

// IMPORTANT: Ensure this path matches your deployed folder structure
const { simulateLoan } = require('./engine/simulator');

const app = express();

// Middleware
app.use(morgan('combined'));
app.use(helmet());

// Rate limiter: 30 requests/min/IP on /simulate (Decision #3)
const simulateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a minute and try again.', code: 'RATE_LIMITED' }
});

const allowedOrigins = [
  'https://arthadynamics.com',
  'https://www.arthadynamics.com',
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (file:// protocol, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Allow exact matches from allowlist
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    // Allow Netlify preview deploys during stabilization
    if (/^https:\/\/.*\.netlify\.app$/.test(origin)) return callback(null, true);
    // Block everything else
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: '10kb' }));

// Health check route
app.get('/', (req, res) => {
  res.send('ArthaDynamics Backend Running 🚀');
});

// Simulation API
app.post('/simulate', simulateLimiter, (req, res) => {
  req.setTimeout(15000);
  try {
    const input = req.body;

    // ── Validation block (B04+B05+B14+E03+E13+E16+E04 backend half) ──
    // Defense-in-depth: frontend (post-S3.7) rejects the same conditions.
    // This block protects against direct API hits (curl/Postman/scraper).
    // If you add a new optional field to the frontend, add it to ALLOWED_FIELDS below.

    const ALLOWED_FIELDS = ['loanAmount', 'interestRate', 'tenureMonths', 'mode', 'events', 'prepaymentEvents', 'rateEvents'];
    const ALLOWED_MODES = ['FIXED_EMI', 'FIXED_TENURE'];
    const reject = (msg, code) => res.status(400).json({ error: msg, code });

    if (!input || typeof input !== 'object') return reject('Invalid request body', 'INVALID_BODY');

    // Reject unknown top-level fields
    for (const key of Object.keys(input)) {
      if (!ALLOWED_FIELDS.includes(key)) return reject(`Unknown field: ${key}`, 'UNKNOWN_FIELD');
    }

    // Helper: numeric field must exist, be a number, finite, and within bounds
    const checkNum = (val, name, min, max, mustBeInt = false) => {
      if (val === undefined || val === null) return `${name} is required`;
      if (typeof val !== 'number' || !isFinite(val) || isNaN(val)) return `${name} must be a number`;
      if (val < min) return `${name} must be at least ${min}`;
      if (val > max) return `${name} must not exceed ${max}`;
      if (mustBeInt && !Number.isInteger(val)) return `${name} must be a whole number`;
      return null;
    };

    let err;
    if ((err = checkNum(input.loanAmount, 'loanAmount', 1, 1_000_000_000))) return reject(err, 'INVALID_INPUT');
    if ((err = checkNum(input.interestRate, 'interestRate', 0.01, 25))) return reject(err, 'INVALID_INPUT');
    if ((err = checkNum(input.tenureMonths, 'tenureMonths', 1, 600, true))) return reject(err, 'INVALID_INPUT');

    if (input.mode !== undefined && !ALLOWED_MODES.includes(input.mode)) {
      return reject(`mode must be one of: ${ALLOWED_MODES.join(', ')}`, 'INVALID_INPUT');
    }

    const prepayments = input.events || input.prepaymentEvents || [];
    if (!Array.isArray(prepayments)) return reject('prepaymentEvents must be an array', 'INVALID_INPUT');
    for (const e of prepayments) {
      if (!e || typeof e !== 'object') return reject('Invalid prepayment event', 'INVALID_INPUT');
      if ((err = checkNum(e.month, 'prepayment month', 1, input.tenureMonths, true))) return reject(err, 'INVALID_INPUT');
      if ((err = checkNum(e.amount, 'prepayment amount', 0, input.loanAmount))) return reject(err, 'INVALID_INPUT');
    }

    const rateEvents = input.rateEvents || [];
    if (!Array.isArray(rateEvents)) return reject('rateEvents must be an array', 'INVALID_INPUT');
    for (const e of rateEvents) {
      if (!e || typeof e !== 'object') return reject('Invalid rate event', 'INVALID_INPUT');
      if ((err = checkNum(e.month, 'rate event month', 1, input.tenureMonths, true))) return reject(err, 'INVALID_INPUT');
      if ((err = checkNum(e.newRate, 'newRate', 0.01, 25))) return reject(err, 'INVALID_INPUT');
    }
    // ── End validation block ──

    // ✅ SAFE SUPPORT FOR BOTH INPUT TYPES
    const rawPrepayments = input.events || input.prepaymentEvents || [];

    const config = {
      principal: Number(input.loanAmount),
      annualRate: Number(input.interestRate),
      tenureMonths: Number(input.tenureMonths),
      mode: input.mode || "FIXED_EMI",

      prepaymentEvents: rawPrepayments.map(e => ({
        month: Number(e.month),
        amount: Number(e.amount)
      })),

      rateEvents: (input.rateEvents || []).map(e => ({
        month: Number(e.month),
        newRate: Number(e.newRate)
      }))
    };

    const result = simulateLoan(config);

    res.json(result);

  } catch (error) {
    console.error('Simulation Error:', error);

    // Known engine errors → structured 400 so frontend can show a friendly message
    if (error.message && error.message.includes('Negative amortization')) {
      return res.status(400).json({
        error: error.message,
        code: 'NEGATIVE_AMORTIZATION'
      });
    }

    // Anything else → generic 500 (sanitized — don't leak internals to client)
    // Full error details are in console.error above for server logs.
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
});

// 🔥 CRITICAL FIX: Use dynamic port for deployment
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 ArthaDynamics Backend running on port ${PORT}`);
});