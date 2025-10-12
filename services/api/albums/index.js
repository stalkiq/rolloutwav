const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, GetCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

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

  if (method === 'PUT') {
    const body = JSON.parse(event.body || '{}');
    const albumId = body.albumId;
    if (!albumId) return json(400, { message: 'albumId required' });

    // Build dynamic update for optional fields
    const names = { '#coverArtKey': 'coverArtKey', '#name': 'name' };
    const values = { ':k': body.coverArtKey ?? null, ':n': body.name ?? null };
    const sets = [];
    if (body.hasOwnProperty('coverArtKey')) sets.push('#coverArtKey = :k');
    if (body.hasOwnProperty('name')) sets.push('#name = :n');
    if (sets.length === 0) return json(400, { message: 'no fields to update' });

    const res = await ddb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk: `ALBUM#${albumId}`, sk: 'ALBUM' },
      UpdateExpression: `SET ${sets.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }));
    return json(200, res.Attributes || {});
  }

  if (method === 'DELETE') {
    const albumId = event.pathParameters?.id;
    if (!albumId) return json(400, { message: 'albumId required' });

    // Verify ownership
    const albumRes = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { pk: `ALBUM#${albumId}`, sk: 'ALBUM' } }));
    const album = albumRes.Item;
    if (!album) return json(404, { message: 'album not found' });
    if (album.gsi1pk !== `USER#${sub}`) return json(403, { message: 'forbidden' });

    // Fetch all items under this album (album + projects)
    const all = await ddb.send(new QueryCommand({ TableName: TABLE_NAME, KeyConditionExpression: 'pk = :pk', ExpressionAttributeValues: { ':pk': `ALBUM#${albumId}` } }));
    const items = all.Items || [];
    if (items.length === 0) return json(204, {});

    // Batch delete in chunks of 25
    const chunks = [];
    for (let i = 0; i < items.length; i += 25) chunks.push(items.slice(i, i + 25));
    for (const chunk of chunks) {
      await ddb.send(new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: chunk.map((it) => ({ DeleteRequest: { Key: { pk: it.pk, sk: it.sk } } })),
        },
      }));
    }

    return json(204, {});
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


