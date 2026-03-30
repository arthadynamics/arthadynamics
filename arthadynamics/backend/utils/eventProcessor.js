function groupEventsByMonth(events) {
  const eventMap = {};

  // If no events, return empty
  if (!events || !Array.isArray(events)) {
    return eventMap;
  }

  // Loop through events
  events.forEach(event => {
    const month = event.month;

    // If month not present, create it
    if (!eventMap[month]) {
      eventMap[month] = [];
    }

    // Add event to that month
    eventMap[month].push(event);
  });

  return eventMap;
}

module.exports = {
  groupEventsByMonth
};