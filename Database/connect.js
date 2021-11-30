var AWS = require("aws-sdk");
AWS.config.update({
    region: "ap-southeast-1",
    accessKeyId:"---------------------",
    secretAccessKey:"---------------------"
});

const ConnectDB = new AWS.DynamoDB.DocumentClient();
module.exports ={
    ConnectDB
}
