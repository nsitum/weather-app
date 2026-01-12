const AppError = require("../errors/AppError");

const ERR = require("../constants/prismaErrors");

module.exports = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (err instanceof AppError) {
      ctx.status = err.statusCode;
      ctx.body = { error: err.message };
      return;
    }

    if (err.code === ERR.UNIQUE_CONSTRAINT) {
      ctx.status = 409;
      ctx.body = { error: "Record already exists" };
      return;
    }

    if (err.code === ERR.RECORD_NOT_FOUND) {
      ctx.status = 404;
      ctx.body = { error: "Record not found" };
      return;
    }

    console.error(err);
    ctx.status = 500;
    ctx.body = { error: "Internal server error" };
  }
};
