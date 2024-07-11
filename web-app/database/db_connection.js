var mysql = require("mysql2");
const { Sequelize, DataTypes } = require("sequelize");
const logger = require("../logger");
require("dotenv").config();
const db = {};

// var con = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "password",
//   database: "userdb",
// });

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: process.env.DB_CONNECTION,
  port: process.env.PORT,
  dialect: "mysql",
  // socketPath: "/var/run/mysqld/mysqld.sock",
  pool: {
    max: 15,
    min: 5,
    idle: 20000,
    evict: 15000,
    acquire: 30000,
  },
});
logger.info(
  "ENV VARIABLES " +
    process.env.DB_NAME +
    process.env.DB_USERNAME +
    process.env.DB_PASSWORD +
    process.env.DB_CONNECTION +
    process.env.PORT
);

// const sequelize = new Sequelize("userdb", "root", "password", {
//   host: "localhost",
//   port: 3306,
//   dialect: "mysql",
//   // dialectOptions: {
//     socketPath: "/var/run/mysqld/mysqld.sock"
// // },
// });
sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((error) => {
    console.error("Unable to connect to the database: ", error);
  });

const Users = sequelize.define(
  "users",
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING,
    },
    last_name: {
      type: DataTypes.STRING,
    },
    account_created: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
    },
    account_updated: {
      type: DataTypes.DATEONLY,
    },
    account_verified: {
      type: DataTypes.BOOLEAN,
    },
  },
  {
    createdAt: false,
    updatedAt: false,
  }
);

const Files = sequelize.define(
  "files",
  {
    doc_id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date_created: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
    },
    s3_bucket_path: {
      type: DataTypes.STRING,
    },
  },
  {
    createdAt: false,
    updatedAt: false,
  }
);

Users.sync({ alter: true })
  .then(() => {
    console.log("users table created successfully!");
  })
  .catch((error) => {
    console.error("Unable to create table : ", error);
  });

Files.sync({ alter: true })
  .then(() => {
    console.log("files table created successfully!");
  })
  .catch((error) => {
    console.error("Unable to create table : ", error);
  });

// con.connect((err) => {
//   if (err) throw err;
//   console.log("Connected!");
// TODO see what to do
// create database
// con.query("CREATE DATABASE userdb", (err, result) => {
//   if (err) throw err;
//   console.log("Database created");
// });

// create table
// var sql = "CREATE TABLE users (id VARCHAR(255), username VARCHAR(255), password VARCHAR(255), first_name VARCHAR(255), last_name VARCHAR(255), account_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, account_updated TIMESTAMP)";
// con.query(sql, function (err, result) {
//   if (err) throw err;
//   console.log("Table created");
// });

// delete table
// var sql = "DROP TABLE users";
// con.query(sql, function (err, result) {
//   if (err) throw err;
//   console.log("Table deleted");
// });
// });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

// module.exports = con;
