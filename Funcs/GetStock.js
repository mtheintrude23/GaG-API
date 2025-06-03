const https = require("https");

const options = {
    method: "GET",
    hostname: "growagarden.gg",
    port: null,
    path: "/api/ws/stocks.getAll?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%7D",
    headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        priority: "u=1, i",
        referer: "https://growagarden.gg/stocks",
        "trpc-accept": "application/json",
        "x-trpc-source": "gag"
    }
};

function fetchStocks(callback) {
    const req = https.request(options, (res) => {
        const chunks = [];

        res.on("data", (chunk) => {
            chunks.push(chunk);
        });

        res.on("end", () => {
            const body = Buffer.concat(chunks);
            const parsedData = JSON.parse(body.toString());
            callback(parsedData);
        });
    });

    req.on("error", (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.end();
}

function formatStocks(data) {
    const stocks = data[0].result.data.json;

    const formattedOutput = {
        gearStock: formatStockItems(stocks.gearStock),
        eggStock: formatStockItems(stocks.eggStock),
        seedsStock: formatStockItems(stocks.seedsStock),
        cosmeticsStock: formatStockItems(stocks.cosmeticsStock),
        honeyStock: formatStockItems(stocks.honeyStock),
        nightStock: formatStockItems(stocks.nightStock),

        lastSeen: {
            Seeds: formatLastSeenItems(stocks.lastSeen.Seeds),
            Gears: formatLastSeenItems(stocks.lastSeen.Gears),
            Weather: formatLastSeenItems(stocks.lastSeen.Weather),
            Eggs: formatLastSeenItems(stocks.lastSeen.Eggs)
        }
    };

    return formattedOutput;
}

function formatStockItems(items) {
    return items.map(item => ({
        name: item.name,
        value: item.value,
        image: item.image,
        emoji: item.emoji
    }));
}

function formatLastSeenItems(items) {
    return items.map(item => ({
        name: item.name,
        image: item.image,
        emoji: item.emoji,
        seen: new Date(item.seen).toLocaleString()
    }));
}

function register(app) {
    app.get('/api/stock/GetStock', (req, res) => {
        fetchStocks((data) => {
            const formattedStocks = formatStocks(data);
            res.json(formattedStocks);
        });
    });
}

module.exports = { register };
