const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

async function getById(tableName, id) {
  const result = await docClient.send(new GetCommand({ TableName: tableName, Key: { id } }));
  return result.Item || null;
}

async function putItem(tableName, item) {
  await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
  return item;
}

async function deleteItem(tableName, id) {
  await docClient.send(new DeleteCommand({ TableName: tableName, Key: { id } }));
}

async function queryByIndex(tableName, indexName, keyName, keyValue) {
  const result = await docClient.send(new QueryCommand({
    TableName: tableName,
    IndexName: indexName,
    KeyConditionExpression: '#k = :v',
    ExpressionAttributeNames: { '#k': keyName },
    ExpressionAttributeValues: { ':v': keyValue }
  }));
  return result.Items || [];
}

async function scan(tableName) {
  const result = await docClient.send(new ScanCommand({ TableName: tableName }));
  return result.Items || [];
}

module.exports = { getById, putItem, deleteItem, queryByIndex, scan };
