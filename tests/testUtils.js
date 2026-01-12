require("dotenv").config();
const { expect } = require("chai");

function getAuthHeader() {
  const user = process.env.ADMIN_USER || "admin";
  const pass = process.env.ADMIN_PASSWORD || "supersecret";

  const token = Buffer.from(`${user}:${pass}`).toString("base64");
  return `Basic ${token}`;
}

module.exports = {
  expect,
  getAuthHeader,
};
