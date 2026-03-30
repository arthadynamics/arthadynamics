const { simulateLoan } = require("../engine/simulator");

function assertAlmostEqual(actual, expected, tolerance = 0.01) {
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`Assertion Failed: Expected ${expected}, got ${actual}`);
    }
}

// ===== TEST: Rate Change + Prepayment (Fixed EMI) =====
// 8% → 10% at month 25
// Prepayment 200,000 at month 60
// Expected Final Tenure ≈ 220
// Expected Total Interest ≈ 1040151.47

function runPrepaymentTest() {

    const result = simulateLoan({
        principal: 1000000,
        annualRate: 8,
        tenureMonths: 240,
        mode: "FIXED_EMI",
        rateEvents: [{ month: 25, newRate: 10 }],
        prepaymentEvents: [{ month: 60, amount: 200000 }]
    });

    assertAlmostEqual(result.finalTenure, 220);
    assertAlmostEqual(result.totalInterest, 1040151.47);

    console.log("✅ Prepayment Test Passed");
}

runPrepaymentTest();