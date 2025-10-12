const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const method = event.requestContext?.http?.method || 'GET';
  const body = event.body ? JSON.parse(event.body) : {};
  const sub = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!sub) return json(401, { message: 'unauthorized' });
  const albumId = body.albumId || event.queryStringParameters?.albumId;
  if (!albumId) return json(400, { message: 'albumId required' });

  if (method === 'GET') {
    const cmd = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
      ExpressionAttributeValues: { ':pk': `ALBUM#${albumId}`, ':sk': 'PROJECT#' },
    });
    const res = await ddb.send(cmd);
    return json(200, { items: res.Items || [] });
  }

  if (method === 'POST') {
    const projectId = body.projectId || crypto.randomUUID();
    const now = new Date().toISOString();
    const item = {
      pk: `ALBUM#${albumId}`,
      sk: `PROJECT#${projectId}`,
      projectId,
      albumId,
      name: body.name || 'Untitled project',
      status: body.status || 'On Track',
      priority: body.priority || 'No priority',
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


