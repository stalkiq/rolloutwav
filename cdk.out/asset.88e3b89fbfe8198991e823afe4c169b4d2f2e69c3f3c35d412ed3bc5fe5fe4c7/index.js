const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const method = event.requestContext?.http?.method || 'GET';
  const sub = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!sub) return json(401, { message: 'unauthorized' });

  if (method === 'GET') {
    const cmd = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'gsi1pk = :gsi1pk',
      ExpressionAttributeValues: { ':gsi1pk': `USER#${sub}` },
    });
    const res = await ddb.send(cmd);
    return json(200, { items: res.Items || [] });
  }

  if (method === 'POST') {
    const body = JSON.parse(event.body || '{}');
    const albumId = body.albumId || crypto.randomUUID();
    const now = new Date().toISOString();
    const item = {
      pk: `ALBUM#${albumId}`,
      sk: 'ALBUM',
      gsi1pk: `USER#${sub}`,
      gsi1sk: `ALBUM#${now}`,
      albumId,
      name: body.name || 'Untitled',
      coverArtKey: body.coverArtKey || null,
      createdAt: now,
    };
    await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return json(201, item);
  }

  return json(405, { message: 'Method not allowed' });
};

function json(statusCode, body) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}


