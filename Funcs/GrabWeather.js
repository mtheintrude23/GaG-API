const https = require("https");

// Weather types to alert
const specialWeather = [
  "Rain", "Thunderstorm", "Frost", "Night", "Blood Moon",
  "Meteor Shower", "Disco", "Jandel Storm", "Sheckle Rain",
  "Chocolate Rain", "Lazer Storm", "Tornado"
];

// Timestamp formatter
function processTimestamps(obj) {
  if (typeof obj !== 'object' || obj === null) return;

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && typeof val === 'object' && 'timestamp' in val && typeof val.timestamp === 'string') {
      const originalTimestamp = val.timestamp;
      const numericTimestamp = new Date(originalTimestamp).getTime();
      obj[key] = {
        ...val,
        timestamp: numericTimestamp,
        LastSeen: originalTimestamp
      };
    } else if (val && typeof val === 'object') {
      processTimestamps(val);
    }
  }
}

// Fetch weather from Grow a Garden
function fetchWeather(callback) {
  const options = {
    method: "GET",
    hostname: "growagarden.gg",
    path: "/api/v1/weather/gag",
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      priority: "u=1, i",
      referer: "https://growagarden.gg/weather"
    }
  };

  const req = https.request(options, (res) => {
    const chunks = [];
    res.on("data", chunk => chunks.push(chunk));
    res.on("end", () => {
      try {
        const body = Buffer.concat(chunks).toString();
        const weatherData = JSON.parse(body);
        processTimestamps(weatherData);
        callback(null, weatherData);
      } catch (e) {
        callback(e);
      }
    });
  });

  req.on("error", (err) => callback(err));
  req.end();
}

// Start auto-alert system
function startWeatherAlerts(api, threadID) {
  const alreadyAnnounced = new Set();

  setInterval(() => {
    fetchWeather((err, data) => {
      if (err) return console.error("Weather fetch failed:", err);

      const activeWeather = Object.values(data.current || {}).map(w => w.name);

      const matched = activeWeather.filter(type =>
        specialWeather.includes(type) && !alreadyAnnounced.has(type)
      );

      if (matched.length > 0) {
        const msg = `🌦️ **Special Weather Alert in Grow a Garden**:\n\n` +
                    matched.map(type => `• ${type}`).join("\n");
        api.sendMessage(msg, threadID);
        matched.forEach(type => alreadyAnnounced.add(type));
      }

      // Clear announced cache after 30 mins to re-alert
      setTimeout(() => {
        matched.forEach(type => alreadyAnnounced.delete(type));
      }, 30 * 60 * 1000); // 30 mins
    });
  }, 2 * 60 * 1000); // Check every 2 mins
}

module.exports = { startWeatherAlerts };
