const { UnauthorizedError } = require("../errors");

module.exports = async (ctx, next) => {
  const header = ctx.headers.authorization;

  if (!header || !header.startsWith("Basic ")) {
    throw new UnauthorizedError("Missing Authorization header");
  }

  const base64 = header.replace("Basic ", "");
  const decoded = Buffer.from(base64, "base64").toString("utf8");

  const [user, pass] = decoded.split(":");

  if (user !== process.env.ADMIN_USER || pass !== process.env.ADMIN_PASSWORD) {
    throw new UnauthorizedError("Invalid credentials");
  }

  await next();
};
