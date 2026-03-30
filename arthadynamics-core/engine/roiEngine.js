const { simulateLoan } = require("./simulator");

function sumPrepayments(config) {
    if (!config.prepaymentEvents) return 0;
    return config.prepaymentEvents.reduce(
        (sum, event) => sum + event.amount,
        0
    );
}

function calculateIsolatedPrepaymentROI(baseConfig, shockConfig, shockWithPrepayConfig) {

    const baseResult = simulateLoan(baseConfig);
    const shockResult = simulateLoan(shockConfig);
    const shockPrepayResult = simulateLoan(shockWithPrepayConfig);

    const totalPrepayment = sumPrepayments(shockWithPrepayConfig);

    const interestSavedFromPrepayment =
        shockResult.totalInterest - shockPrepayResult.totalInterest;

    let prepaymentROI = null;

    if (totalPrepayment > 0) {
        prepaymentROI = interestSavedFromPrepayment / totalPrepayment;
    }

    return {
        baseInterest: baseResult.totalInterest,
        shockInterest: shockResult.totalInterest,
        shockWithPrepayInterest: shockPrepayResult.totalInterest,
        totalPrepayment,
        interestSavedFromPrepayment,
        prepaymentROI
    };
}

module.exports = {
    calculateIsolatedPrepaymentROI
};