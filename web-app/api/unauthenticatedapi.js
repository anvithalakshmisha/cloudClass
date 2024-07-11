const express = require("express");
const db = require("../database/db_connection");
const unauthenticatedrouter = express.Router();
const uuid = require("uuid");
const bcrypt = require("bcrypt");
const saltLength = 10;
const logger = require("../logger");
const stats = require("../statsd");
const { dynamoClient, sns } = require("../sns");
const jwt = require("jsonwebtoken");
var start = new Date();

function saveDetailsInDatabase(userid, token, status) {
  const secondsSinceEpoch = Math.round(Date.now() / 1000);
  const expirationTime = secondsSinceEpoch + 300;
  var input = {
    id: userid,
    Token: token,
    TTL: expirationTime,
  };
  var params = {
    TableName: "myTableName",
    // TableName: "csye6225",
    Item: input,
  };
  dynamoClient.put(params, function (err, data) {
    if (err) {
      console.log(err);
      logger.error("users::save::error - " + JSON.stringify(err, null, 2));
    } else {
      console.log(data);
      logger.info("users::save::success");
    }
  });
}

unauthenticatedrouter.get("/", (req, res) => {
  res.status(200).send("Status code is 200 OK healthy");
});

unauthenticatedrouter.get("/health", (req, res) => {
  res.status(200).send("Status code is 200 OK healthy");
  stats.timing("healthz.timeout", start);
  stats.increment("endpoint.healthz");
  logger.info("healthz is working");
});

unauthenticatedrouter.post("/v1/account", async (req, res) => {
  try {
    stats.timing("deleteDocument.timeout", start);
    stats.increment("endpoint.deleteDocument");
    if (!(req.body.account_created || req.body.account_updated)) {
      const allUsers = await db.sequelize.query("SELECT * FROM users", {
        type: db.sequelize.QueryTypes.SELECT,
      });
      if (allUsers) {
        const username = req.body.username;
        const password = req.body.password;
        const first_name = req.body.first_name;
        const last_name = req.body.last_name;
        const regexExp =
          /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/gi;
        if (regexExp.test(username)) {
          const doesUserExitArray = allUsers.filter(
            (r) => r.username === req.body.username
          );
          if (doesUserExitArray.length == 0) {
            const id = uuid.v1();
            const token = jwt.sign({ username }, "my_secret_key");
            var hashedPassword = bcrypt.hash(
              password,
              saltLength,
              async (err, hashedp) => {
                if (err) throw err;
                hashedPassword = hashedp;
                const SNSparams = {
                  Message: JSON.stringify({
                    username,
                    token,
                    messageType: "Notification",
                    domainName: "anvithalakshmisha.me",
                    first_name: first_name,
                    verified: false,
                  }),
                  TopicArn:
                    "arn:aws:sns:us-east-1:800415706217:csye6225-sns-topic-Tv01",
                };
                console.log(SNSparams);

                sns.publish(SNSparams, function (err, data) {
                  logger.debug("enterd sns publish");
                  if (err) console.log(err, err.stack);
                  else {
                    console.log(data + "triggred");
                    logger.debug("success sns");
                  }
                });

                saveDetailsInDatabase(username, token, "Okay");

                const newUser = await db.sequelize.query(
                  "INSERT INTO users values(?,?,?,?,?,now(),null,false)",
                  {
                    type: db.sequelize.QueryTypes.INSERT,
                    replacements: [
                      id,
                      username,
                      hashedPassword,
                      first_name,
                      last_name,
                    ],
                  }
                );

                res.status(201).send("User created with id " + id);
                logger.info("User created with the post request");
              }
            );
          } else {
            res
              .status(400)
              .send("An account with the email address already exists");
            logger.info("User was being created with the same email address");
          }
        } else {
          res.status(400).send("Your username should be a valid email address");
          logger.info("User should be created with a valid email address");
        }
      }
    } else {
      res.status(400).send("Bad request");
      logger.error(
        "Bad request - all the fields should be present in the post request"
      );
    }
  } catch (e) {
    logger.error("Could not create a new user, have to try again");
  }
});

// export router
module.exports = unauthenticatedrouter;
