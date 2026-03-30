const { calculateIsolatedPrepaymentROI } = require("./engine/roiEngine");

// 1️⃣ Base Case (8% constant, FIXED TENURE)
const baseConfig = {
    principal: 1000000,
    annualRate: 8,
    tenureMonths: 240,
    mode: "FIXED_TENURE"
};

// 2️⃣ Rate Shock Only (10% from month 25, FIXED TENURE)
const shockConfig = {
    principal: 1000000,
    annualRate: 8,
    tenureMonths: 240,
    mode: "FIXED_TENURE",
    rateEvents: [{ month: 25, newRate: 10 }]
};

// 3️⃣ Rate Shock + Prepayment (FIXED TENURE)
const shockWithPrepayConfig = {
    principal: 1000000,
    annualRate: 8,
    tenureMonths: 240,
    mode: "FIXED_TENURE",
    rateEvents: [{ month: 25, newRate: 10 }],
    prepaymentEvents: [{ month: 60, amount: 200000 }]
};

const roiReport = calculateIsolatedPrepaymentROI(
    baseConfig,
    shockConfig,
    shockWithPrepayConfig
);

console.log("====== ISOLATED PREPAYMENT ROI REPORT (FIXED TENURE) ======\n");

console.log("Interest (Base 8%):", roiReport.baseInterest.toFixed(2));
console.log("Interest (Rate Shock Only):", roiReport.shockInterest.toFixed(2));
console.log("Interest (Shock + Prepayment):", roiReport.shockWithPrepayInterest.toFixed(2));

console.log("\nTotal Prepayment:", roiReport.totalPrepayment.toFixed(2));
console.log("Interest Saved From Prepayment:",
    roiReport.interestSavedFromPrepayment.toFixed(2)
);

if (roiReport.prepaymentROI !== null) {
    console.log("Effective ROI on Prepayment:",
        (roiReport.prepaymentROI * 100).toFixed(2) + "%"
    );
}