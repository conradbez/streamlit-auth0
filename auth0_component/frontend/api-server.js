const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
// const authConfig = require("./src/auth_config.json");

const app = express();

const port = process.env.API_PORT || 3002;
const appPort = process.env.SERVER_PORT || 3001;
const appOrigin =  `http://localhost:${appPort}`;

app.use(morgan("dev"));
app.use(helmet());
app.use(cors({ origin: appOrigin }));
