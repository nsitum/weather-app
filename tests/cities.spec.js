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

describe("Cities API", () => {
  beforeEach(async () => {
    await resetDb();
  });

  describe("POST /cities/create", () => {
    it("should create a new city", async () => {
      const res = await request(app.callback())
        .post("/cities/create")
        .set("Authorization", authHeader)
        .send({ name: "Split" });

      expect(res.status).to.equal(201);
      expect(res.body.name).to.equal("Split");
      expect(res.body).to.have.property("id");
    });

    it("should fail validation when name missing", async () => {
      const res = await request(app.callback())
        .post("/cities/create")
        .set("Authorization", authHeader)
        .send({});

      expect(res.status).to.equal(422);
      expect(res.body).to.have.property("error");
    });

    it("should fail if city already exists", async () => {
      await request(app.callback())
        .post("/cities/create")
        .set("Authorization", authHeader)
        .send({ name: "Zagreb" });

      const res = await request(app.callback())
        .post("/cities/create")
        .set("Authorization", authHeader)
        .send({ name: "Zagreb" });

      expect(res.status).to.equal(409);
      expect(res.body).to.have.property("error");
    });
  });

  describe("GET /cities/list", () => {
    it("should return list of cities", async () => {
      await request(app.callback())
        .post("/cities/create")
        .set("Authorization", authHeader)
        .send({ name: "Rijeka" });

      const res = await request(app.callback())
        .get("/cities/list")
        .set("Authorization", authHeader);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body.length).to.be.greaterThan(0);
    });
  });

  describe("GET /cities/details/:id", () => {
    it("should return city if exists", async () => {
      const create = await request(app.callback())
        .post("/cities/create")
        .set("Authorization", authHeader)
        .send({ name: "Osijek" });

      const res = await request(app.callback())
        .get(`/cities/details/${create.body.id}`)
        .set("Authorization", authHeader);

      expect(res.status).to.equal(200);
      expect(res.body.name).to.equal("Osijek");
    });

    it("should return 404 if not found", async () => {
      const res = await request(app.callback())
        .get("/cities/details/9999")
        .set("Authorization", authHeader);

      expect(res.status).to.equal(404);
    });
  });

  describe("PUT /cities/update/:id", () => {
    it("should update a city", async () => {
      const create = await request(app.callback())
        .post("/cities/create")
        .set("Authorization", authHeader)
        .send({ name: "OldName" });

      const res = await request(app.callback())
        .put(`/cities/update/${create.body.id}`)
        .set("Authorization", authHeader)
        .send({ name: "NewName" });

      expect(res.status).to.equal(200);
      expect(res.body.name).to.equal("NewName");
    });
  });

  describe("DELETE /cities/delete/:id", () => {
    it("should delete a city", async () => {
      const create = await request(app.callback())
        .post("/cities/create")
        .set("Authorization", authHeader)
        .send({ name: "DeleteMe" });

      const res = await request(app.callback())
        .delete(`/cities/delete/${create.body.id}`)
        .set("Authorization", authHeader);

      expect(res.status).to.equal(200);
    });
  });
});
