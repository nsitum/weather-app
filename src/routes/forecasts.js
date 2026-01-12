// src/routes/forecasts.js
const Router = require("@koa/router");
const prisma = require("../db/prisma");
const { NotFoundError, ValidationError } = require("../errors");

const VALID_WEATHER_TYPES = ["SUNNY", "RAINY", "SNOWY", "CLOUDY", "WINDY"];

const router = new Router();

router.post("/forecasts", async (ctx) => {
  const { cityId, type, time, comment } = ctx.request.body;

  if (!cityId || !type || !time) {
    throw new ValidationError("cityId, type and time are required");
  }

  const forecast = await prisma.forecast.create({
    data: {
      cityId,
      type,
      time: new Date(time),
      comment,
    },
  });

  ctx.status = 201;
  ctx.body = forecast;
});

router.get("/forecasts", async (ctx) => {
  const forecasts = await prisma.forecast.findMany({
    include: { city: true },
  });
  ctx.body = forecasts;
});

router.get("/forecasts/:id", async (ctx) => {
  const id = Number(ctx.params.id);

  const forecast = await prisma.forecast.findUnique({
    where: { id },
    include: { city: true },
  });

  if (!forecast) {
    throw new NotFoundError("Forecast not found");
  }

  ctx.body = forecast;
});

router.put("/forecasts/:id", async (ctx) => {
  const id = Number(ctx.params.id);
  const { type, time, comment } = ctx.request.body;

  const existing = await prisma.forecast.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Forecast not found");
  }

  const forecast = await prisma.forecast.update({
    where: { id },
    data: {
      ...(type && { type }),
      ...(time && { time: new Date(time) }),
      ...(comment !== undefined && { comment }),
    },
  });

  ctx.body = forecast;
});

router.delete("/forecasts/:id", async (ctx) => {
  const id = Number(ctx.params.id);

  const existing = await prisma.forecast.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Forecast not found");
  }

  const deleted = await prisma.forecast.delete({
    where: { id },
  });

  ctx.body = deleted;
});

router.get("/forecasts/city/:cityId", async (ctx) => {
  const cityId = Number(ctx.params.cityId);

  if (Number.isNaN(cityId)) {
    throw new ValidationError("cityId must be a number");
  }

  const city = await prisma.city.findUnique({
    where: { id: cityId },
  });

  if (!city) {
    throw new NotFoundError("City not found");
  }

  const forecasts = await prisma.forecast.findMany({
    where: { cityId },
    orderBy: { time: "asc" },
    include: { city: true },
  });

  ctx.body = forecasts;
});

router.get("/forecasts/week", async (ctx) => {
  const now = new Date();
  const weekAhead = new Date(now);
  weekAhead.setDate(now.getDate() + 7);

  let cityId = undefined;

  if (ctx.query.cityId !== undefined) {
    cityId = Number(ctx.query.cityId);
    if (Number.isNaN(cityId)) {
      throw new ValidationError("cityId must be a number if provided");
    }
  }

  const where = {
    time: {
      gte: now,
      lt: weekAhead,
    },
  };

  if (cityId !== undefined) {
    where.cityId = cityId;
  }

  const forecasts = await prisma.forecast.findMany({
    where,
    orderBy: { time: "asc" },
    include: { city: true },
  });

  ctx.status = 200;
  ctx.body = forecasts;
});

router.get("/forecasts/top/:type", async (ctx) => {
  const rawType = ctx.params.type;
  const type = rawType.toUpperCase();

  if (!VALID_WEATHER_TYPES.includes(type)) {
    throw new ValidationError(
      `Invalid weather type. Allowed: ${VALID_WEATHER_TYPES.join(", ")}`
    );
  }

  const year = ctx.query.year
    ? Number(ctx.query.year)
    : new Date().getFullYear();

  if (Number.isNaN(year)) {
    throw new ValidationError("Year must be a number");
  }

  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year + 1, 0, 1);

  const forecasts = await prisma.forecast.findMany({
    where: {
      type,
      time: {
        gte: startOfYear,
        lt: endOfYear,
      },
    },
    select: {
      time: true,
      cityId: true,
      city: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const cityDayMap = new Map();

  for (const forecast of forecasts) {
    const dateKey = forecast.time.toISOString().slice(0, 10);
    if (!cityDayMap.has(forecast.cityId)) {
      cityDayMap.set(forecast.cityId, {
        city: forecast.city,
        days: new Set(),
      });
    }
    cityDayMap.get(forecast.cityId).days.add(dateKey);
  }

  const result = Array.from(cityDayMap.values())
    .map((entry) => ({
      cityId: entry.city.id,
      cityName: entry.city.name,
      daysCount: entry.days.size,
    }))
    .sort((a, b) => b.daysCount - a.daysCount);

  ctx.body = {
    year,
    type,
    results: result,
  };
});

module.exports = router;
