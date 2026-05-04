function calculateEMI(principal, annualRatePercent, tenureMonths) {
    const monthlyRate = (annualRatePercent / 100) / 12;

    if (monthlyRate === 0) {
        return principal / tenureMonths;
    }

    return (
        principal *
        monthlyRate *
        Math.pow(1 + monthlyRate, tenureMonths) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1)
    );
}

module.exports = {
    calculateEMI
};