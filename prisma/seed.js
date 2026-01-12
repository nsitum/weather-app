// prisma/seed.js
const { PrismaClient, WeatherType } = require("@prisma/client");

const prisma = new PrismaClient();

const CITY_NAMES = [
  "Split",
  "Zagreb",
  "Rijeka",
  "Osijek",
  "Zadar",
  "Pula",
  "Dubrovnik",
];

const YEAR = 2026;

function* eachDayOfYear(year) {
  const date = new Date(year, 0, 1);
  while (date.getFullYear() === year) {
    yield new Date(date);
    date.setDate(date.getDate() + 1);
  }
}

function randomWeatherType() {
  const types = [
    WeatherType.SUNNY,
    WeatherType.RAINY,
    WeatherType.SNOWY,
    WeatherType.CLOUDY,
    WeatherType.WINDY,
  ];
  const idx = Math.floor(Math.random() * types.length);
  return types[idx];
}

function randomComment(type) {
  const chance = Math.random();
  if (chance < 0.6) return null;

  const base = {
    SUNNY: ["Predivno vrijeme", "Sunčano i toplo", "Idealno za plažu"],
    RAINY: ["Kišovito", "Ponesite kišobran", "Pljuskovi tijekom dana"],
    SNOWY: ["Snježne padaline", "Moguć snijeg", "Hladno i snježno"],
    CLOUDY: ["Oblačno", "Pretežno oblačno", "Sivo nebo"],
    WINDY: ["Vjetrovito", "Jaki udari vjetra", "Bura puše"],
  };

  const list = base[type] || ["Bez posebnog vremena"];
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.forecast.deleteMany();
  await prisma.city.deleteMany();

  const cities = [];
  for (const name of CITY_NAMES) {
    const city = await prisma.city.create({
      data: { name },
    });
    cities.push(city);
  }
  console.log(`✅ Kreirano ${cities.length} gradova`);

  const forecastTimes = [6, 12, 18, 23];

  for (const city of cities) {
    console.log(`→ Generiram prognoze za grad: ${city.name}`);

    const allForecastsForCity = [];

    for (const day of eachDayOfYear(YEAR)) {
      for (const hour of forecastTimes) {
        const dateTime = new Date(day);
        dateTime.setHours(hour, 0, 0, 0);

        const type = randomWeatherType();
        const comment = randomComment(type);

        allForecastsForCity.push({
          cityId: city.id,
          type,
          time: dateTime,
          comment,
        });
      }
    }

    await prisma.forecast.createMany({
      data: allForecastsForCity,
    });

    console.log(
      `   ✅ Kreirano ${allForecastsForCity.length} prognoza za ${city.name}`
    );
  }

  console.log("🌱 Seeding gotovo!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
