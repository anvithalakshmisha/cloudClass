const statsdClient = require("statsd-client");

const stats = new statsdClient({ host: "localhost", port: 8125 });

module.exports = stats;
