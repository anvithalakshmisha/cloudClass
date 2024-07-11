const AWS = require("aws-sdk");
const SES = new AWS.SES();

const region = "us-east-1";
// http://prod.domain.tld/v1/verifyUserEmail?email=user@example.com&token=sometoken

exports.handler = async (event) => {
  let dynamoDBClient = new AWS.DynamoDB.DocumentClient({
    endpoint: "http://dynamodb.us-east-1.amazonaws.com",
    region,
  });

  const { username, token, messageType, domainName, first_name, verified } =
    JSON.parse(event.Records[0].Sns.Message);
  console.log(event.Records[0].Sns.Message);

  async function saveMailLog(username) {
    var input = {
      Email: username,
    };

    var params2 = {
      TableName: "myTableName1",
      Item: input,
    };

    dynamoDBClient.put(params2, function (err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log(data);
      }
    });
  }

  async function getItem(username) {
    var params = {
      TableName: "myTableName1",
      Key: {
        Email: username,
      },
    };
    try {
      const data = await dynamoDBClient.get(params).promise();
      console.log(data);
      return data;
    } catch (err) {
      console.log("not ok");
      return err;
    }
  }

  const data = await getItem(username);
  if (Object.keys(data).length === 0) {
    saveMailLog(username);
    const verificationLink =
      // "http://" +
      domainName +
      "/v1/verifyUserEmail?email=" +
      username +
      "&token=" +
      token +
      "";
    console.log("in unverified part");
    const params = {
      Destination: {
        ToAddresses: [username],
      },
      Message: {
        Body: {
          Html: {
            Data: `<html><body>Hello ${first_name} ,<br> To verify your account please click the link below.<br><br><a href=${verificationLink}>Verify your account</a><br><br><br> Kind Regards,<br>Team CSYE6225!</body></html>`,
          },
        },
        Subject: {
          Data: "Verify account for csye6225 - for demo assignment 9",
        },
      },
      Source: "csye6225@" + domainName + "",
    };

    try {
      await SES.sendEmail(params).promise();
      return {
        statusCode: 200,
        body: "Email sent!",
      };
    } catch (e) {
      console.error(e);
      return {
        statusCode: 400,
        body: "Sending failed",
      };
    }
  }
};
