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
mode = mode || "FIXED_EMI";

    const rateEventMap = buildEventMap(rateEvents);
    const prepaymentEventMap = buildEventMap(prepaymentEvents);

    let currentRate = annualRate;
    let remainingTenure = tenureMonths;
    let monthsElapsed = 0;

    // 🔁 NEW EMI CONTROL
    let currentEMI = calculateEMI(principal, annualRate, tenureMonths);
    let nextEMI = null;

    let outstanding = principal;
    let month = 1;
    let totalInterest = 0;
    let totalPayment = 0;

    const amortization = [];

    while (outstanding > 0 && remainingTenure > 0) {

        // ✅ APPLY NEXT EMI (ONLY FOR FIXED TENURE)
        if (mode === "FIXED_TENURE" && nextEMI !== null) {
            currentEMI = nextEMI;
            nextEMI = null;
        }

        let eventOccurred = false;

        // ✅ 1. APPLY RATE EVENTS (NO EMI CHANGE MID-MONTH)
        const rateEventsThisMonth = rateEventMap[month] || [];

        rateEventsThisMonth.forEach(event => {
            currentRate = event.newRate;
            eventOccurred = true;

            if (mode === "FIXED_EMI") {
                remainingTenure = solveTenure(outstanding, currentRate, currentEMI);
            }
        });

        // ✅ 2. CALCULATE INTEREST
        const monthlyRate = (currentRate / 100) / 12;
        const interest = outstanding * monthlyRate;

        if (currentEMI <= interest && outstanding > 0) {
            throw new Error("Negative amortization detected.");
        }

        let principalComponent = currentEMI - interest;
        let actualEMI = currentEMI;

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
            eventOccurred = true;

            if (outstanding < 0) {
                outstanding = 0;
            }

            if (mode === "FIXED_EMI") {
                remainingTenure = solveTenure(outstanding, currentRate, currentEMI);
            }
        }

        // ✅ 4. RECALCULATE EMI FOR NEXT MONTH (FIXED TENURE ONLY)
        if (mode === "FIXED_TENURE" && outstanding > 0) {
    nextEMI = calculateEMI(outstanding, currentRate, tenureMonths - (monthsElapsed + 1));
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
        monthsElapsed++;
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