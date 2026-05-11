import { supabase } from "@/integrations/supabase/client";

const MESSAGE_ATTACHMENTS_BUCKET = "message-attachments";
const RESUMES_BUCKET = "resumes";

export function isRemoteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function safeAttachmentPath(userId: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  return `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
}

export async function resolvePrivateStorageUrl(
  bucket: string,
  pathOrUrl: string,
  expiresIn = 60 * 5
): Promise<string> {
  if (isRemoteUrl(pathOrUrl)) return pathOrUrl;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(pathOrUrl, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Could not open file");
  }

  return data.signedUrl;
}

export async function resolveMessageAttachmentUrl(pathOrUrl: string, expiresIn = 60 * 5): Promise<string> {
  return resolvePrivateStorageUrl(MESSAGE_ATTACHMENTS_BUCKET, pathOrUrl, expiresIn);
}

export async function resolveResumeUrl(pathOrUrl: string, expiresIn = 60 * 5): Promise<string> {
  return resolvePrivateStorageUrl(RESUMES_BUCKET, pathOrUrl, expiresIn);
}
