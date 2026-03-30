function solveTenure(principal, annualRatePercent, emi) {
    const monthlyRate = (annualRatePercent / 100) / 12;

    if (monthlyRate === 0) {
        return principal / emi;
    }

    if (emi <= principal * monthlyRate) {
        throw new Error("Negative amortization detected.");
    }

    const numerator = Math.log(emi / (emi - principal * monthlyRate));
    const denominator = Math.log(1 + monthlyRate);

    return Math.ceil(numerator / denominator);
}

module.exports = {
    solveTenure
};