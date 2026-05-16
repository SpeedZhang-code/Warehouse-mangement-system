require('dotenv').config();
const knex = require('knex');

const db = knex({
  client: 'pg', // 告訴 Knex 你用的是 PostgreSQL
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  // 建議加上這行，可以看到 Knex 幫你生成的 SQL，方便除錯
  debug: true 
});

module.exports = db;