import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

function getClient(): S3Client | null {
  const { S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION } =
    process.env;
  if (!S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) return null;
  return new S3Client({
    region: S3_REGION ?? "auto",
    ...(S3_ENDPOINT ? { endpoint: S3_ENDPOINT } : {}),
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
  });
}

export async function uploadBuffer(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string | null> {
  const client = getClient();
  const bucket = process.env.S3_BUCKET;
  if (!client || !bucket) {
    console.warn("[storage] S3 not configured — skipping upload of", key);
    return null;
  }
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType })
  );
  return key;
}
