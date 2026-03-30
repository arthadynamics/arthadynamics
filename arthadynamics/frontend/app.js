async function simulate() {
  const loanAmount = Number(document.getElementById("loanAmount").value);
  const annualRate = Number(document.getElementById("annualRate").value);
  const tenureMonths = Number(document.getElementById("tenureMonths").value);

  try {
    const response = await fetch("http://localhost:3000/simulate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        loanAmount,
        annualRate,
        tenureMonths
      })
    });

    const data = await response.json();

    if (!data.success) {
      alert(data.errors.join(", "));
      return;
    }

    // Show results
    document.getElementById("results").style.display = "block";
    document.getElementById("insightsBox").style.display = "block";

    document.getElementById("emi").innerText = data.summary.emi.toFixed(2);
    document.getElementById("interest").innerText = data.summary.totalInterest.toFixed(2);
    document.getElementById("payment").innerText = data.summary.totalPayment.toFixed(2);
    document.getElementById("tenure").innerText = data.summary.tenure;

    const percent = data.insights.totalInterestPercent.toFixed(2);
    document.getElementById("interestPercent").innerText = percent;

    // Insight message
    const warning = document.getElementById("warning");

    if (percent > 100) {
      warning.innerText = "⚠️ You are paying more interest than principal!";
      warning.style.color = "red";
    } else {
      warning.innerText = "Good loan structure.";
      warning.style.color = "green";
    }

  } catch (error) {
    alert("Error connecting to server");
    console.error(error);
  }
}