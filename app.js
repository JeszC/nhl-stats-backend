import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import awards from "./routes/awards.js";
import draft from "./routes/draft.js";
import healthcheck from "./routes/healthcheck.js";
import home from "./routes/home.js";
import injuries from "./routes/injuries.js";
import players from "./routes/players.js";
import playoffs from "./routes/playoffs.js";
import results from "./routes/results.js";
import schedule from "./routes/schedule.js";
import standings from "./routes/standings.js";
import teams from "./routes/teams.js";
import trades from "./routes/trades.js";

dotenv.config();
const PORT = process.env.PORT || 3001;
const app = express();

app.use(express.static("public", {extensions: ["html"]}));
app.use("/favicon.ico", express.static("/favicon.ico"));
app.use(compression());
app.use(cors({origin: "*", methods: ["GET"], charset: "utf8"}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use((_request, response, next) => {
    response.set("Cache-Control", "no-cache");
    next();
});

app.use("/healthcheck", healthcheck);
app.use("/awards", awards);
app.use("/draft", draft);
app.use("/home", home);
app.use("/injuries", injuries);
app.use("/players", players);
app.use("/playoffs", playoffs);
app.use("/results", results);
app.use("/schedule", schedule);
app.use("/standings", standings);
app.use("/teams", teams);
app.use("/trades", trades);
app.use((_request, response) => {
    response.sendStatus(400);
});

app.listen(PORT, () => console.info(`Server listening on port ${PORT}`));
