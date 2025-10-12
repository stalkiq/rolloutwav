const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({});
const BUCKET = process.env.MEDIA_BUCKET;

exports.handler = async (event) => {
  const sub = event.requestContext?.authorizer?.jwt?.claims?.sub;
  if (!sub) return resp(401, { message: 'unauthorized' });
  const body = event.body ? JSON.parse(event.body) : {};
  const action = (body.action || 'put').toLowerCase();
  if (action === 'get') {
    const key = body.key;
    if (!key) return resp(400, { message: 'key required for GET presign' });
    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 900 });
    return resp(200, { url, key });
  }
  // default PUT
  // Optional de-duplication: if client provided a content hash, allow stable keying
  const safeName = (body.filename || 'file').replace(/[^a-zA-Z0-9_.\-]/g, '_');
  const key = body.key || (body.hash ? `uploads/${sub}/${body.hash}_${safeName}` : `uploads/${sub}/${crypto.randomUUID()}_${safeName}`);
  const contentType = body.contentType || 'application/octet-stream';
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  const url = await getSignedUrl(s3, cmd, { expiresIn: 900 });
  return resp(200, { url, key });
};

function resp(statusCode, body) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) };
}


