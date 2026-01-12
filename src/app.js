const Koa = require("koa");
const Router = require("@koa/router");
const bodyParser = require("koa-bodyparser");
require("dotenv").config();

const swagger = require("swagger-ui-koa");
const yaml = require("yamljs");

const citiesRoutes = require("./routes/cities");
const forecastsRoutes = require("./routes/forecasts");

const errorHandler = require("./middleware/errorHandler");
const basicAuth = require("./middleware/basicAuth");

const app = new Koa();
const router = new Router();

router.get("/health", (ctx) => {
  ctx.body = { status: "ok" };
});

const swaggerDoc = yaml.load(__dirname + "/../docs/swagger.yaml");

app.use(errorHandler);

app.use(bodyParser());

app.use(async (ctx, next) => {
  const isPublic =
    ctx.path.startsWith("/swagger") ||
    ctx.path.startsWith("/health") ||
    ctx.path.includes("swagger-ui");

  if (isPublic) {
    return next();
  }

  return basicAuth(ctx, next);
});

// app.use(basicAuth);

app.use(router.routes());
app.use(router.allowedMethods());

app.use(citiesRoutes.routes());
app.use(citiesRoutes.allowedMethods());

app.use(forecastsRoutes.routes());
app.use(forecastsRoutes.allowedMethods());

app.use(swagger.serve);
app.use(swagger.setup(swaggerDoc));

module.exports = app;
