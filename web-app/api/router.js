const express = require("express");
const db = require("../database/db_connection");
const router = express.Router();
const bcrypt = require("bcrypt");
const saltLength = 10;
const authUser = require("../basicAuth/basicAuth");
const AWS = require("aws-sdk");
const uuid = require("uuid");
require("dotenv").config();
const logger = require("../logger");
const stats = require("../statsd");
const { dynamoClient, sns } = require("../sns");
var start = new Date();

const s3 = new AWS.S3({
  region: "us-east-1",
});
logger.info("Bucket name" + process.env.BUCKET_NAME);
const BUCKET_NAME = process.env.BUCKET_NAME;

// const sns = new AWS.SNS({
//   // secretAccessKey: "f5Y6d82EhvoC6eI2qoqXiXd9TYaff1a40w3sDdMw",
//   // accessKeyId: "AKIARSMQ4HGOLDOIOH72",
//   region: "us-east-1",
// });
// let dynamoClient = new AWS.DynamoDB.DocumentClient({
//   endpoint: "http://dynamodb.us-east-1.amazonaws.com",
//   region: "us-east-1",
// });

router.use(setUser);
var login;
var password;
async function setUser(req, res, next) {
  const b64auth = (req.headers.authorization || "").split(" ")[1] || "";
  [login, password] = Buffer.from(b64auth, "base64").toString().split(":");
  const authUser = await db.sequelize.query(
    "SELECT * FROM users where username = ?",
    {
      type: db.sequelize.QueryTypes.SELECT,
      replacements: [login],
    }
  );
  if (authUser.length > 0) {
    bcrypt.compare(password, authUser[0].password, (err, res) => {
      if (err) throw err;
      req.authorization =
        login.toLowerCase() === authUser[0].username.toLowerCase() && res;
      if (req.authorization) {
        // everything is all set
        next();
      } else {
        // wrong password
        next();
      }
    });
  } else {
    // no credentials entered or wrong cred
    next();
  }
}

router.get("/v1/verifyUserEmail", (req, res) => {
  const { email, token } = req.query;
  console.log("User verification request received");
  logger.info(`User verification request received for userId: ${email}`);
  try {
    const secondsSinceEpoch = Math.round(Date.now() / 1000);
    var params = {
      TableName: "myTableName",
      // TableName: "csye6225",
      Key: {
        Token: token,
      },
    };
    dynamoClient.get(params, async function (err, data) {
      if (err) {
        console.log("Error" + err);
        logger.error(
          "users::fetchOneByKey::error - " + JSON.stringify(err, null, 2)
        );
      } else {
        console.log("Okay" + data);
        logger.info(
          "users::fetchOneByKey::success - " + JSON.stringify(data, null, 2)
        );
        if (Object.keys(data).length === 0) {
          console.log("token expired");
          return res.status(401).json("Token expired");
        }
        if (Object.keys(data).length !== 0) {
          if (data.Item.TTL < secondsSinceEpoch) {
            console.log("token expired");
            return res.status(401).json("Token expired");
          }
        }
        db.sequelize.query(
          "UPDATE users SET account_verified=? WHERE username=?",
          {
            replacements: [true, email],
            type: db.sequelize.QueryTypes.UPDATE,
          }
        );
        logger.info(`User: ${email}, successfully verified!`);
        return res.status(200).json("User verified successfully!");
      }
    });
  } catch (e) {
    res.json(e.message);
  }
});

router.get("/v1/account/:id", authUser, async (req, res) => {
  try {
    stats.timing("getUser.timeout", start);
    stats.increment("endpoint.getUser");
    const getUser = await db.sequelize.query(
      "SELECT id, username, first_name, last_name, account_created, account_updated, account_verified FROM users WHERE id = ?",
      {
        type: db.sequelize.QueryTypes.SELECT,
        replacements: [req.params.id],
      }
    );
    if (getUser && getUser[0].account_verified) {
      res.status(200).send(getUser);
      logger.info("User fetched successfully");
    } else {
      res.status(400).send("User is not verified");
      logger.error("User not verified");
    }
  } catch (e) {
    logger.error("Could not get the user with the id, try again");
  }
});

router.put("/v1/account/:id", async (req, res) => {
  try {
    stats.timing("updateUser.timeout", start);
    stats.increment("endpoint.updateUser");
    const updateUser = await db.sequelize.query(
      "SELECT * FROM users WHERE id = ?",
      {
        type: db.sequelize.QueryTypes.SELECT,
        replacements: [req.params.id],
      }
    );
    if (updateUser) {
      if (updateUser[0].account_verified) {
        if (login.toLowerCase() === updateUser[0].username.toLowerCase()) {
          const id = req.params.id;
          const first_name = req.body.first_name || updateUser[0].first_name;
          const last_name = req.body.last_name || updateUser[0].last_name;
          const password = req.body.password || updateUser[0].password;
          if (
            !(
              req.body.username ||
              req.body.account_created ||
              req.body.account_updated
            )
          ) {
            if (req.body.password) {
              var hashedPassword = bcrypt.hash(
                password,
                saltLength,
                async (err, hashedp) => {
                  if (err) throw err;
                  hashedPassword = hashedp;
                  console.log(hashedPassword, updateUser[0].password);
                  db.sequelize.query(
                    "UPDATE users SET first_name=?, last_name=?, password=?, account_updated=now() WHERE id=?",
                    {
                      replacements: [first_name, last_name, hashedPassword, id],
                      type: db.sequelize.QueryTypes.UPDATE,
                    }
                  );
                }
              );
            } else {
              db.sequelize.query(
                "UPDATE users SET first_name=?, last_name=?, account_updated=now() WHERE id=?",
                {
                  replacements: [first_name, last_name, id],
                  type: db.sequelize.QueryTypes.UPDATE,
                }
              );
            }
            res.status(200).send("Updated!");
            logger.info("User updated successfully");
          } else {
            res.status(400).send("Bad request");
            logger.error("bad request - you cannot update some fields");
          }
        } else {
          res.status(403).send("You cannot edit someone else's profile");
          logger.error("You cannot edit someone elses profile");
        }
      } else {
        res.status(400).send("You are not a verified user");
        logger.error("Could not udpate as you are not a verified user");
      }
    }
  } catch (e) {
    logger.error("Could not update, try again");
  }
});

router.get("/v1/documents", authUser, async (req, res) => {
  try {
    stats.timing("getDocuments.timeout", start);
    stats.increment("endpoint.getDocuments");
    const loggedInUser = await db.sequelize.query(
      "SELECT * FROM users WHERE username = ?",
      {
        type: db.sequelize.QueryTypes.SELECT,
        replacements: [login],
      }
    );
    if (loggedInUser) {
      if (loggedInUser[0].account_verified) {
        // only logged in user or every file ?
        const allFiles = await db.sequelize.query("SELECT * FROM files", {
          type: db.sequelize.QueryTypes.SELECT,
        });
        res.status(200).json(allFiles);
        logger.info("Successfully fetched all the files");
      } else {
        res.status(400).send("You need to be verified");
        logger.error("You need to be verified");
      }
    }
  } catch (e) {
    logger.error("Could not fetch all the files, try again");
  }
});

router.get("/v1/documents/:doc_id", authUser, async (req, res) => {
  try {
    stats.timing("getDocumentById.timeout", start);
    stats.increment("endpoint.getDocumentById");
    const loggedInUser = await db.sequelize.query(
      "SELECT * FROM users WHERE username = ?",
      {
        type: db.sequelize.QueryTypes.SELECT,
        replacements: [login],
      }
    );
    const documentToBeFetched = await db.sequelize.query(
      "SELECT * from files WHERE doc_id = ?",
      {
        type: db.sequelize.QueryTypes.SELECT,
        replacements: [req.params.doc_id],
      }
    );
    if (loggedInUser && loggedInUser[0].account_verified) {
      if (
        loggedInUser &&
        loggedInUser[0].id === documentToBeFetched[0].user_id
      ) {
        const file = await db.sequelize.query(
          "SELECT * FROM files where user_id = ? AND doc_id = ?",
          {
            type: db.sequelize.QueryTypes.SELECT,
            replacements: [loggedInUser[0].id, req.params.doc_id],
          }
        );
        res.status(200).json(file);
        logger.info("Succesfully fetched the document");
      } else {
        res.status(403).send("You can't access someone elses data");
        logger.error("You cannot fetch someone elses document");
      }
    } else {
      res.status(400).send("You need to be verified");
      logger.error("You need to be verified");
    }
  } catch (e) {
    logger.error("Could not fetch the record, try again");
  }
});

router.post(
  "/v1/documents",
  authUser,
  // upload.single("file"),
  async (req, res) => {
    try {
      stats.timing("postFile.timeout", start);
      stats.increment("endpoint.postFile");
      const loggedInUser = await db.sequelize.query(
        "SELECT * FROM users where username = ?",
        {
          type: db.sequelize.QueryTypes.SELECT,
          replacements: [login],
        }
      );
      if (loggedInUser && loggedInUser[0].account_verified) {
        if (loggedInUser && req.files.file) {
          const params = {
            Bucket: BUCKET_NAME,
            Key: `${login}/${req.files.file.name}`,
            Body: req.files.file.data,
            ContentType: "Object",
          };
          s3.upload(params, async (err, data) => {
            if (err) {
              console.log(err);
            } else {
              const checker = await db.sequelize.query(
                "SELECT * FROM files where user_id = ?",
                {
                  type: db.sequelize.QueryTypes.SELECT,
                  replacements: [loggedInUser[0].id],
                }
              );
              const docId = uuid.v4();
              if (checker.length == 0) {
                const newEntry = await db.sequelize.query(
                  "INSERT INTO files values(?,?,?,now(),?)",
                  {
                    type: db.sequelize.QueryTypes.INSERT,
                    replacements: [
                      docId,
                      loggedInUser[0].id,
                      req.files.file.name,
                      data.Location,
                    ],
                  }
                );
              } else {
                checker.forEach(async (entry) => {
                  if (entry.name !== req.files.file.name) {
                    await db.sequelize.query(
                      "INSERT INTO files values(?,?,?,now(),?)",
                      {
                        type: db.sequelize.QueryTypes.INSERT,
                        replacements: [
                          docId,
                          loggedInUser[0].id,
                          req.files.file.name,
                          data.Location,
                        ],
                      }
                    );
                  } else {
                    await db.sequelize.query(
                      "DELETE from files where name = ? AND user_id = ?",
                      {
                        type: db.sequelize.QueryTypes.DELETE,
                        replacements: [req.files.file.name, loggedInUser[0].id],
                      }
                    );
                    await db.sequelize.query(
                      "INSERT INTO files values(?,?,?,now(),?)",
                      {
                        type: db.sequelize.QueryTypes.INSERT,
                        replacements: [
                          docId,
                          loggedInUser[0].id,
                          req.files.file.name,
                          data.Location,
                        ],
                      }
                    );
                  }
                });
              }
              const response = {
                doc_id: docId,
                user_id: loggedInUser[0].id,
                s3_bucket_path: data.Location,
                date_created: new Date(),
                name: req.files.file.name,
              };
              res.status(200).json(response);
              logger.info("Successfully uploaded file");
            }
          });
        } else {
          res.status(400).send("Should upload a file");
          logger.error("The request body should have the file to be uploaded");
        }
      } else {
        res.status(400).send("You need to be verified");
        logger.error("You need to be verified");
      }
    } catch (e) {
      logger.error("Could not upload the file, try again");
    }
  }
);

router.delete("/v1/documents/:doc_id", authUser, async (req, res) => {
  try {
    stats.timing("deleteDocument.timeout", start);
    stats.increment("endpoint.deleteDocument");
    const loggedInUser = await db.sequelize.query(
      "SELECT * FROM users WHERE username = ?",
      {
        type: db.sequelize.QueryTypes.SELECT,
        replacements: [login],
      }
    );
    const documentToBeDeleted = await db.sequelize.query(
      "SELECT * from files WHERE doc_id = ?",
      {
        type: db.sequelize.QueryTypes.SELECT,
        replacements: [req.params.doc_id],
      }
    );
    if (loggedInUser && loggedInUser[0].account_verified) {
      if (
        loggedInUser &&
        documentToBeDeleted &&
        loggedInUser[0].id === documentToBeDeleted[0].user_id
      ) {
        const fileName = await db.sequelize.query(
          "SELECT name FROM files WHERE doc_id = ?",
          {
            type: db.sequelize.QueryTypes.SELECT,
            replacements: [req.params.doc_id],
          }
        );
        if (fileName) {
          const params = {
            Bucket: BUCKET_NAME,
            Key: `${login}/${fileName[0].name}`,
          };
          console.log(`${params.Bucket}, ${params.Key}`);
          s3.deleteObject(params, async (err, data) => {
            if (err) {
              console.log(err);
            } else {
              await db.sequelize.query(
                "DELETE FROM files where user_id = ? and doc_id = ?",
                {
                  type: db.sequelize.QueryTypes.DELETE,
                  replacements: [loggedInUser[0].id, req.params.doc_id],
                }
              );
              res.status(204).send("Document deleted");
              logger.info("document deleted successfully");
            }
          });
        } else {
          res.status(400).send("File does not exist");
          logger.error("the document that is being deleted does not exist");
        }
      } else {
        res.status(403).send("You can't delete someone elses data");
        logger.error("You cannot delete someone elses document");
      }
    } else {
      res.status(400).send("You need to be verified");
      logger.error("You need to be verified");
    }
  } catch (e) {
    logger.error("Could not delete the document, try again");
  }
});

// export router
module.exports = router;
