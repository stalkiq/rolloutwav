const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({});
const BUCKET = process.env.MEDIA_BUCKET;

exports.handler = async (event) => {
  const body = event.body ? JSON.parse(event.body) : {};
  const key = body.key || `uploads/${crypto.randomUUID()}_${body.filename || 'file'}`;
  const contentType = body.contentType || 'application/octet-stream';
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  const url = await getSignedUrl(s3, cmd, { expiresIn: 900 });
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url, key })
  };
};


