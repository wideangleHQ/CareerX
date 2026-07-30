export const StorageBuckets = {
  CANDIDATE: process.env.SUPABASE_STORAGE_BUCKET_CANDIDATE ?? 'candidate-documents',
  OFFERS: process.env.SUPABASE_STORAGE_BUCKET_OFFERS ?? 'offer-documents',
  INTERVIEWS: process.env.SUPABASE_STORAGE_BUCKET_INTERVIEWS ?? 'interview-assets',
  ORGANIZATION: process.env.SUPABASE_STORAGE_BUCKET_ORGANIZATION ?? 'organization-assets',
  EXPORTS: process.env.SUPABASE_STORAGE_BUCKET_EXPORTS ?? 'exports',
} as const;

export type StorageBucket = (typeof StorageBuckets)[keyof typeof StorageBuckets];

const DEFAULT_SIGNED_URL_EXPIRY = 900;
const DEFAULT_MAX_UPLOAD_SIZE_MB = 10;

export const StorageConfig = {
  signedUrlExpiry: parseInt(process.env.SIGNED_URL_EXPIRY ?? '', 10) || DEFAULT_SIGNED_URL_EXPIRY,
  maxUploadSizeBytes:
    (parseInt(process.env.MAX_UPLOAD_SIZE_MB ?? '', 10) || DEFAULT_MAX_UPLOAD_SIZE_MB) * 1024 * 1024,
} as const;
