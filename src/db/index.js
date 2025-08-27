const knexJS = require("knex");
require("dotenv").config();

const LOOKSGOOD_DB = knexJS({
  client: "mysql",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "looksgood",
    insecureAuth: true,
    dateStrings: true,
    charset: "utf8mb4",
  },
});

module.exports = LOOKSGOOD_DB;
