const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { PORT } = require("./config");
const { qrRoute, pairRoute } = require("./routes");
const app = express();
app.set("json spaces", 2);

require("events").EventEmitter.defaultMaxListeners = 2000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/pair", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pair.html"));
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use("/qr", qrRoute);
app.use("/code", pairRoute);

app.get("/health", (req, res) => {
    res.json({
        status: 200,
        success: true,
        service: "Gifted Session",
        timestamp: new Date().toISOString(),
    });
});

app.listen(PORT, () => {
    console.log(
        `\nDeployment Successful!\n\n Atassa-Session-Server Running on http://localhost:${PORT}`,
    );
});

module.exports = app;
