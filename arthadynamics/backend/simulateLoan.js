function simulateLoan(config) {

  let {
    loanAmount,
    annualRate,
    tenureMonths,
    prepayments = []
  } = config;

  let monthlyRate = annualRate / 12 / 100;
  let balance = loanAmount;

  let emi =
    (balance * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);

  let amortization = [];
  let totalInterest = 0;

  for (let month = 1; month <= tenureMonths; month++) {

    // ✅ APPLY PREPAYMENT
    const event = prepayments.find(p => p.month === month);
    if (event) {
      balance -= event.amount;
      if (balance < 0) balance = 0;
    }

    let interest = balance * monthlyRate;
    let principal = emi - interest;

    if (balance < emi) {
      principal = balance;
      emi = interest + principal;
    }

    balance -= principal;
    if (balance < 0) balance = 0;

    totalInterest += interest;

    amortization.push({
      month,
      interest,
      principal,
      closingBalance: balance
    });

    if (balance === 0) break;
  }

  return {
    summary: {
      emi,
      totalInterest,
      totalPayment: loanAmount + totalInterest
    },
    amortization
  };
}

module.exports = { simulateLoan };