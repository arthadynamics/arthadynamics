const { groupEventsByMonth } = require("./utils/eventProcessor");

// Sample events
const events = [
  { type: "PREPAYMENT", month: 12, amount: 100000 },
  { type: "RATE_CHANGE", month: 12, newRate: 9.5 },
  { type: "PREPAYMENT", month: 24, amount: 50000 }
];

// Run function
const result = groupEventsByMonth(events);

// Print result
console.log("Grouped Events:");
console.log(result);