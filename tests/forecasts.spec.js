const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/db/prisma");
const { expect, getAuthHeader } = require("./testUtils");

const authHeader = getAuthHeader();

async function resetDb() {
  await prisma.forecast.deleteMany();
  await prisma.city.deleteMany();
}

before(async () => {
  await resetDb();
});

after(async () => {
  await prisma.$disconnect();
});

describe("Forecasts API", () => {
  beforeEach(async () => {
    await resetDb();
    await prisma.city.create({ data: { name: "Split" } });
  });

  describe("POST /forecasts", () => {
    it("should create a new forecast", async () => {
      const city = await prisma.city.findFirst();

      const res = await request(app.callback())
        .post("/forecasts")
        .set("Authorization", authHeader)
        .send({
          cityId: city.id,
          type: "SUNNY",
          time: new Date().toISOString(),
          comment: "Nice weather",
        });

      expect(res.status).to.equal(201);
      expect(res.body.cityId).to.equal(city.id);
      expect(res.body.type).to.equal("SUNNY");
    });

    it("should fail validation if missing fields", async () => {
      const res = await request(app.callback())
        .post("/forecasts")
        .set("Authorization", authHeader)
        .send({});

      expect(res.status).to.equal(422);
      expect(res.body).to.have.property("error");
    });
  });

  describe("GET /forecasts", () => {
    it("should return list of forecasts", async () => {
      const city = await prisma.city.findFirst();

      await prisma.forecast.create({
        data: { cityId: city.id, type: "SUNNY", time: new Date() },
      });

      const res = await request(app.callback())
        .get("/forecasts")
        .set("Authorization", authHeader);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body.length).to.be.greaterThan(0);
    });
  });

  describe("GET /forecasts/:id", () => {
    it("should return forecast by id", async () => {
      const city = await prisma.city.findFirst();
      const create = await prisma.forecast.create({
        data: { cityId: city.id, type: "RAINY", time: new Date() },
      });

      const res = await request(app.callback())
        .get(`/forecasts/${create.id}`)
        .set("Authorization", authHeader);

      expect(res.status).to.equal(200);
      expect(res.body.type).to.equal("RAINY");
    });

    it("should return 404 if not found", async () => {
      const res = await request(app.callback())
        .get("/forecasts/9999")
        .set("Authorization", authHeader);

      expect(res.status).to.equal(404);
    });
  });

  describe("PUT /forecasts/:id", () => {
    it("should update a forecast", async () => {
      const city = await prisma.city.findFirst();
      const create = await prisma.forecast.create({
        data: { cityId: city.id, type: "SUNNY", time: new Date() },
      });

      const res = await request(app.callback())
        .put(`/forecasts/${create.id}`)
        .set("Authorization", authHeader)
        .send({ type: "CLOUDY" });

      expect(res.status).to.equal(200);
      expect(res.body.type).to.equal("CLOUDY");
    });
  });

  describe("DELETE /forecasts/:id", () => {
    it("should delete a forecast", async () => {
      const city = await prisma.city.findFirst();
      const create = await prisma.forecast.create({
        data: { cityId: city.id, type: "RAINY", time: new Date() },
      });

      const res = await request(app.callback())
        .delete(`/forecasts/${create.id}`)
        .set("Authorization", authHeader);

      expect(res.status).to.equal(200);
    });
  });

  describe("GET /forecasts/city/:cityId", () => {
    it("should list forecasts for a specific city", async () => {
      const city = await prisma.city.findFirst();
      await prisma.forecast.create({
        data: { cityId: city.id, type: "SUNNY", time: new Date() },
      });

      const res = await request(app.callback())
        .get(`/forecasts/city/${city.id}`)
        .set("Authorization", authHeader);

      expect(res.status).to.equal(200);
      expect(res.body.length).to.be.greaterThan(0);
      expect(res.body[0].cityId).to.equal(city.id);
    });

    it("should return 404 if city does not exist", async () => {
      const res = await request(app.callback())
        .get("/forecasts/city/9999")
        .set("Authorization", authHeader);

      expect(res.status).to.equal(404);
    });
  });
});
