const knexJS = require("knex");
require("dotenv").config();

const COMMON_DB = knexJS({
  client: "mysql",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "auth",
    insecureAuth: true,
    dateStrings: true,
    charset: "utf8mb4",
  },
});

module.exports = COMMON_DB;
