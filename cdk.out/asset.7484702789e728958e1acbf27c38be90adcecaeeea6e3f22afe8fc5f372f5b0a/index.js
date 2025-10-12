const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, PutCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

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

  // Handle file subresource routes first so they are not shadowed by generic GET/POST handlers
  if (idParam && event.rawPath && event.rawPath.endsWith('/files')) {
    if (method === 'GET') {
      // List files for a project with optional type filter and pagination
      const type = (event.queryStringParameters && event.queryStringParameters.type) || undefined;
      const limit = event.queryStringParameters && event.queryStringParameters.limit ? parseInt(event.queryStringParameters.limit, 10) : 50;
      const cursor = (event.queryStringParameters && event.queryStringParameters.cursor) || undefined;
      const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': `PROJECT#${idParam}`,
          ':skPrefix': 'FILE#',
        },
        Limit: Math.min(Math.max(1, limit), 200),
      };
      if (type) {
        params.FilterExpression = '#type = :type';
        params.ExpressionAttributeNames = { '#type': 'type' };
        params.ExpressionAttributeValues[':type'] = type;
      }
      if (cursor) {
        try {
          params.ExclusiveStartKey = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
        } catch (_) {}
      }
      const result = await ddb.send(new QueryCommand(params));
      const nextCursor = result.LastEvaluatedKey ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : undefined;
      return json(200, { items: result.Items || [], nextCursor });
    }
    if (method === 'POST') {
      // Create a File item (item-per-entity model)
      const fileId = body.fileId || crypto.randomUUID();
      const type = body.type; // 'verse' | 'hook' | 'beat' | 'sample' | 'final'
      const key = body.key;   // S3 object key
      const name = body.name;
      if (!type || !key || !name) return json(400, { message: 'type, key, and name are required' });
      const now = new Date().toISOString();
      const item = {
        pk: `PROJECT#${idParam}`,
        sk: `FILE#${now}#${fileId}`,
        projectId: idParam,
        albumId,
        fileId,
        type,
        key,
        name,
        createdAt: now,
      };
      await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
      return json(201, item);
    }
  }

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

  // (file subresource handled above)

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

  return json(405, { message: 'Method not allowed' });
};

function json(statusCode, body) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}


