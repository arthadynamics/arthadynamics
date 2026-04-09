const express = require('express');
const cors = require('cors');

// IMPORTANT: Ensure this path matches your deployed folder structure
const { simulateLoan } = require('../../arthadynamics-core/engine/simulator');

const app = express();

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.send('ArthaDynamics Backend Running 🚀');
});

// Simulation API
app.post('/simulate', (req, res) => {
  try {
    const input = req.body;
if (!input.loanAmount || !input.interestRate || !input.tenureMonths) {
  return res.status(400).json({ error: "Missing required inputs" });
}

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
    res.status(500).json({ error: error.message });
  }
});

// 🔥 CRITICAL FIX: Use dynamic port for deployment
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 ArthaDynamics Backend running on port ${PORT}`);
});