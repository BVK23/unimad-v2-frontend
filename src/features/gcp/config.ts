import { Storage, type Bucket } from "@google-cloud/storage";

type CredentialsShape = {
  client_email?: string;
  private_key?: string;
  project_id?: string;
  [key: string]: unknown;
};

const parseCredentials = (raw: string): CredentialsShape => {
  try {
    return JSON.parse(raw) as CredentialsShape;
  } catch {
    let decoded = raw;
    if (decoded.startsWith('"') && decoded.endsWith('"')) {
      decoded = decoded.slice(1, -1);
    }
    decoded = decoded.replace(/\\"/g, '"').replace(/\\n/g, "\n");
    return JSON.parse(decoded) as CredentialsShape;
  }
};

let cachedBucket: Bucket | null = null;

export const getBucket = (): Bucket => {
  if (cachedBucket) return cachedBucket;

  const credentialsRaw = process.env.GOOGLE_CLOUD_CREDENTIALS;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;

  if (!credentialsRaw) {
    throw new Error("GOOGLE_CLOUD_CREDENTIALS is not defined. Add it to your .env.local file.");
  }
  if (!bucketName) {
    throw new Error("GOOGLE_CLOUD_STORAGE_BUCKET is not defined. Add it to your .env.local file.");
  }

  const credentials = parseCredentials(credentialsRaw);

  const storage = new Storage({
    projectId: projectId || credentials.project_id,
    credentials,
  });

  cachedBucket = storage.bucket(bucketName);
  return cachedBucket;
};
