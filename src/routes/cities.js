const Router = require("@koa/router");
const prisma = require("../db/prisma");
const { NotFoundError, ValidationError } = require("../errors");

const router = new Router();

router.post("/cities/create", async (ctx) => {
  const { name } = ctx.request.body;
  if (!name) {
    throw new ValidationError("City name is required");
  }

  const city = await prisma.city.create({ data: { name } });
  ctx.status = 201;
  ctx.body = city;
});

router.get("/cities/list", async (ctx) => {
  const cities = await prisma.city.findMany();
  ctx.body = cities;
});

router.get("/cities/details/:id", async (ctx) => {
  const id = Number(ctx.params.id);

  const city = await prisma.city.findUnique({
    where: { id },
  });

  if (!city) {
    throw new NotFoundError("City not found");
  }

  ctx.body = city;
});

router.put("/cities/update/:id", async (ctx) => {
  const id = Number(ctx.params.id);
  const { name } = ctx.request.body;

  const existing = await prisma.city.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("City not found");
  }

  const city = await prisma.city.update({
    where: { id },
    data: { name },
  });

  ctx.body = city;
});

router.delete("/cities/delete/:id", async (ctx) => {
  const id = Number(ctx.params.id);

  const existing = await prisma.city.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("City not found");
  }

  const deleted = await prisma.city.delete({
    where: { id },
  });

  ctx.body = deleted;
});

router.get("/cities/stats", async (ctx) => {
  const year = new Date().getFullYear();

  const stats = await prisma.forecast.groupBy({
    by: ["cityId", "type"],
    _count: { type: true },
    where: {
      time: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      },
    },
  });

  if (stats.length === 0) {
    ctx.status = 200;
    ctx.body = [];
    return;
  }

  const cities = await prisma.city.findMany();
  const map = {};

  stats.forEach((row) => {
    if (!map[row.cityId]) {
      const city = cities.find((c) => c.id === row.cityId);
      map[row.cityId] = {
        cityId: row.cityId,
        cityName: city?.name,
        stats: {},
      };
    }
    map[row.cityId].stats[row.type] = row._count.type;
  });

  ctx.status = 200;
  ctx.body = Object.values(map);
});

module.exports = router;
