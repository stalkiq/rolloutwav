const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, PutCommand, GetCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  const method = event.requestContext?.http?.method || 'GET';
  const body = event.body ? JSON.parse(event.body) : {};
  const sub = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!sub) return json(401, { message: 'unauthorized' });
  const albumId = body.albumId || event.queryStringParameters?.albumId;
  if (!albumId) return json(400, { message: 'albumId required' });

  const idParam = event.pathParameters?.id;

  if (method === 'GET') {
    if (idParam) {
      const res = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { pk: `ALBUM#${albumId}`, sk: `PROJECT#${idParam}` } }));
      return json(200, res.Item || {});
    } else {
      const cmd = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
        ExpressionAttributeValues: { ':pk': `ALBUM#${albumId}`, ':sk': 'PROJECT#' },
      });
      const res = await ddb.send(cmd);
      return json(200, { items: res.Items || [] });
    }
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
      verses: [], hooks: [], beats: [], samples: [], finalSong: null,
      createdAt: now,
    };
    await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return json(201, item);
  }

  if (method === 'PUT' && idParam) {
    const update = body || {};
    const expr = 'SET #name = if_not_exists(#name, :empty), #status = :status, #priority = :priority, #verses = :verses, #hooks = :hooks, #beats = :beats, #samples = :samples, #finalSong = :finalSong, #description = :description, #updates = :updates, #artists = :artists, #producers = :producers, #writers = :writers, #lead = :lead, #startDate = :startDate, #targetDate = :targetDate';
    const res = await ddb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk: `ALBUM#${albumId}`, sk: `PROJECT#${idParam}` },
      UpdateExpression: expr,
      ExpressionAttributeNames: { '#name': 'name', '#status': 'status', '#priority': 'priority', '#verses': 'verses', '#hooks': 'hooks', '#beats': 'beats', '#samples': 'samples', '#finalSong': 'finalSong', '#description': 'description', '#updates': 'updates', '#artists': 'artists', '#producers': 'producers', '#writers': 'writers', '#lead': 'lead', '#startDate': 'startDate', '#targetDate': 'targetDate' },
      ExpressionAttributeValues: {
        ':empty': update.name || 'Untitled project',
        ':status': update.status || 'On Track',
        ':priority': update.priority || 'No priority',
        ':verses': update.verses || [],
        ':hooks': update.hooks || [],
        ':beats': update.beats || [],
        ':samples': update.samples || [],
        ':finalSong': update.finalSong || null,
        ':description': update.description || '',
        ':updates': update.updates || [],
        ':artists': update.artists || [],
        ':producers': update.producers || [],
        ':writers': update.writers || [],
        ':lead': update.lead || 'You',
        ':startDate': update.startDate || null,
        ':targetDate': update.targetDate || null,
      },
      ReturnValues: 'ALL_NEW',
    }));
    return json(200, res.Attributes || {});
  }

  if (method === 'DELETE' && idParam) {
    await ddb.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { pk: `ALBUM#${albumId}`, sk: `PROJECT#${idParam}` },
    }));
    return json(204, {});
  }

  return json(405, { message: 'Method not allowed' });
};

function json(statusCode, body) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}


