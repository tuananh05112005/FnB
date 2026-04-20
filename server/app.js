const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

require("./config/firebase");

const registerRoutes = require("./routes");

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(bodyParser.json());

registerRoutes(app);

module.exports = app;
