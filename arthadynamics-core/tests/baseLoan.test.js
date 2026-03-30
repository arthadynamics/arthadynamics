const { simulateLoan } = require("../engine/simulator");

// Simple assertion helper
function assertAlmostEqual(actual, expected, tolerance = 0.01) {
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`Assertion Failed: Expected ${expected}, got ${actual}`);
    }
}

// ===== TEST: Standard Fixed Loan =====
// 1,000,000 at 8% for 240 months
// No rate changes, no prepayment
// Expected:
// EMI ≈ 8364.40
// Total Interest ≈ 1007456.17
// Final Tenure = 240

function runBaseLoanTest() {

    const result = simulateLoan({
        principal: 1000000,
        annualRate: 8,
        tenureMonths: 240,
        mode: "FIXED_EMI"
    });

    assertAlmostEqual(result.finalTenure, 240);
    assertAlmostEqual(result.totalInterest, 1007456.17);

    console.log("✅ Base Loan Test Passed");
}

runBaseLoanTest();