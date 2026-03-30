const express = require('express');
const cors = require('cors');

// IMPORTANT: Ensure this path matches your deployed folder structure
const { simulateLoan } = require('../../arthadynamics-core/engine/simulator');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.send('ArthaDynamics Backend Running 🚀');
});

// Simulation API
app.post('/simulate', (req, res) => {
  try {
    const input = req.body;

    const config = {
      principal: Number(input.loanAmount),
      annualRate: Number(input.interestRate),
      tenureMonths: Number(input.tenureMonths),
      mode: "FIXED_EMI",

      prepaymentEvents: (input.events || []).map(e => ({
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