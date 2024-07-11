const AWS = require("aws-sdk");

const sns = new AWS.SNS({
  // secretAccessKey: "f5Y6d82EhvoC6eI2qoqXiXd9TYaff1a40w3sDdMw",
  // accessKeyId: "AKIARSMQ4HGOLDOIOH72",
  region: "us-east-1",
});
const dynamoClient = new AWS.DynamoDB.DocumentClient({
  endpoint: "http://dynamodb.us-east-1.amazonaws.com",
  region: "us-east-1",
});

module.exports = { sns, dynamoClient };
// module.exports = dynamoClient;
