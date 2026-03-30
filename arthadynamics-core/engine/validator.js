function validateNumber(value, name) {
    if (typeof value !== "number" || isNaN(value)) {
        throw new Error(`${name} must be a valid number.`);
    }
}

function validatePositive(value, name) {
    validateNumber(value, name);
    if (value <= 0) {
        throw new Error(`${name} must be greater than 0.`);
    }
}

function validateMode(mode) {
    if (mode !== "FIXED_EMI" && mode !== "FIXED_TENURE") {
        throw new Error(`Mode must be FIXED_EMI or FIXED_TENURE.`);
    }
}

function validateEvents(events, eventType) {
    if (!Array.isArray(events)) return;

    const monthSet = new Set();

    for (const event of events) {

        validatePositive(event.month, `${eventType} month`);

        if (monthSet.has(event.month)) {
            throw new Error(`Duplicate ${eventType} event for month ${event.month}`);
        }

        monthSet.add(event.month);

        if (eventType === "rate") {
            validatePositive(event.newRate, "Rate value");
        }

        if (eventType === "prepayment") {
            validatePositive(event.amount, "Prepayment amount");
        }
    }
}

function validateConfig(config) {

    validatePositive(config.principal, "Principal");
    validatePositive(config.annualRate, "Annual rate");
    validatePositive(config.tenureMonths, "Tenure months");

    validateMode(config.mode);

    validateEvents(config.rateEvents, "rate");
    validateEvents(config.prepaymentEvents, "prepayment");
}

module.exports = {
    validateConfig
};