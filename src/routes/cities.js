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

module.exports = router;
