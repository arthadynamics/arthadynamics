const { simulateLoan } = require("./simulator");

function sumPrepayments(strategyConfig) {
    if (!strategyConfig.prepaymentEvents) return 0;

    return strategyConfig.prepaymentEvents.reduce(
        (sum, event) => sum + event.amount,
        0
    );
}

function compareStrategies(strategyA, strategyB) {

    const resultA = simulateLoan(strategyA.config);
    const resultB = simulateLoan(strategyB.config);

    const interestDifference = resultB.totalInterest - resultA.totalInterest;
    const tenureDifferenceMonths = resultB.finalTenure - resultA.finalTenure;
    const tenureDifferenceYears = tenureDifferenceMonths / 12;

    const interestPerMonthA = resultA.totalInterest / resultA.finalTenure;
    const interestPerMonthB = resultB.totalInterest / resultB.finalTenure;

    const totalPrepaymentB = sumPrepayments(strategyB.config);

    let interestSaved = resultA.totalInterest - resultB.totalInterest;
    let prepaymentROI = null;

    if (totalPrepaymentB > 0) {
        prepaymentROI = interestSaved / totalPrepaymentB;
    }

    const delta = {
        interestDifference,
        tenureDifferenceMonths,
        tenureDifferenceYears,
        interestPerMonthA,
        interestPerMonthB,
        interestPerMonthDelta: interestPerMonthB - interestPerMonthA,
        interestPerYearDelta: (interestPerMonthB - interestPerMonthA) * 12,
        paymentDifference: resultB.totalPayment - resultA.totalPayment,
        totalPrepaymentB,
        interestSaved,
        prepaymentROI
    };

    return {
        strategyA: {
            name: strategyA.name,
            result: resultA
        },
        strategyB: {
            name: strategyB.name,
            result: resultB
        },
        delta
    };
}

module.exports = {
    compareStrategies
};