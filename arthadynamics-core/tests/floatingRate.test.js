const { simulateLoan } = require("../engine/simulator");

function assertAlmostEqual(actual, expected, tolerance = 0.01) {
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`Assertion Failed: Expected ${expected}, got ${actual}`);
    }
}

// ===== TEST: Floating Rate - Fixed EMI =====
// Rate jumps from 8% to 10% at month 25
// No prepayment
// Expected Final Tenure ≈ 391 months

function runFloatingRateTest() {

    const result = simulateLoan({
        principal: 1000000,
        annualRate: 8,
        tenureMonths: 240,
        mode: "FIXED_EMI",
        rateEvents: [{ month: 25, newRate: 10 }]
    });

    assertAlmostEqual(result.finalTenure, 391);

    console.log("✅ Floating Rate Test Passed");
}

runFloatingRateTest();