const { calculateEMI } = require("./calculator");
const { solveTenure } = require("./tenureSolver");
const { validateConfig } = require("./validator");

function buildEventMap(events) {
    const map = {};

    for (const event of events || []) {
        if (!map[event.month]) {
            map[event.month] = [];
        }
        map[event.month].push(event);
    }

    return map;
}

function simulateLoan(config) {

    validateConfig(config);

    let {
        principal,
        annualRate,
        tenureMonths,
        mode,
        rateEvents = [],
        prepaymentEvents = []
    } = config;

    const rateEventMap = buildEventMap(rateEvents);
    const prepaymentEventMap = buildEventMap(prepaymentEvents);

    let currentRate = annualRate;
    let remainingTenure = tenureMonths;

    let emi = calculateEMI(principal, annualRate, tenureMonths);

    let outstanding = principal;
    let month = 1;
    let totalInterest = 0;
    let totalPayment = 0;

    const amortization = [];

    while (outstanding > 0 && remainingTenure > 0) {

        // ✅ 1. APPLY RATE EVENTS
        const rateEventsThisMonth = rateEventMap[month] || [];

        rateEventsThisMonth.forEach(event => {
            currentRate = event.newRate;

            if (mode === "FIXED_TENURE") {
                emi = calculateEMI(outstanding, currentRate, remainingTenure);
            } else {
                remainingTenure = solveTenure(outstanding, currentRate, emi);
            }
        });

        // ✅ 2. CALCULATE INTEREST (BEFORE PREPAYMENT)
        const monthlyRate = (currentRate / 100) / 12;
        const interest = outstanding * monthlyRate;

        if (emi <= interest && outstanding > 0) {
            throw new Error("Negative amortization detected.");
        }

        let principalComponent = emi - interest;
        let actualEMI = emi;

        // 🔒 FINAL MONTH HANDLING
        if (principalComponent >= outstanding) {
            principalComponent = outstanding;
            actualEMI = interest + principalComponent;
            outstanding = 0;
        } else {
            outstanding -= principalComponent;
        }

        // ✅ 3. APPLY PREPAYMENT AFTER EMI
        const prepaymentEventsThisMonth = prepaymentEventMap[month] || [];

        let totalPrepayment = 0;

        prepaymentEventsThisMonth.forEach(event => {
            totalPrepayment += event.amount;
        });

        if (totalPrepayment > 0) {
            outstanding -= totalPrepayment;

            if (outstanding < 0) {
                outstanding = 0;
            }

            if (mode === "FIXED_TENURE") {
                emi = calculateEMI(outstanding, currentRate, remainingTenure);
            } else {
                remainingTenure = solveTenure(outstanding, currentRate, emi);
            }
        }

        totalInterest += interest;
        totalPayment += actualEMI + totalPrepayment;

        amortization.push({
            month,
            rate: currentRate,
            emi: actualEMI,
            interest,
            principal: principalComponent,
            prepayment: totalPrepayment,
            balance: outstanding
        });

        month++;
        remainingTenure--;
    }

    return {
        mode,
        originalTenure: tenureMonths,
        finalTenure: amortization.length,
        totalInterest,
        totalPayment,
        amortization
    };
}

module.exports = {
    simulateLoan
};