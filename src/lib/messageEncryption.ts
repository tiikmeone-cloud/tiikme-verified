import sodium from "libsodium-wrappers";
import { openDB, type IDBPDatabase } from "idb";
import { supabase } from "@/integrations/supabase/client";

const DB_NAME = "tiikme-keys";
const STORE = "keypairs";

let _ready: Promise<void> | null = null;
function ready() {
  if (!_ready) _ready = sodium.ready;
  return _ready;
}

let _db: Promise<IDBPDatabase> | null = null;
function db() {
  if (!_db) {
    _db = openDB(DB_NAME, 1, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
      },
    });
  }
  return _db;
}

export interface Keypair {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromB64(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Get the user's local keypair, generating + storing it on first use. */
export async function getOrCreateKeypair(userId: string): Promise<Keypair> {
  await ready();
  const d = await db();
  const stored = (await d.get(STORE, userId)) as Keypair | undefined;
  if (stored?.publicKey && stored?.secretKey) return stored;
  const kp = sodium.crypto_box_keypair();
  const obj: Keypair = { publicKey: kp.publicKey, secretKey: kp.privateKey };
  await d.put(STORE, obj, userId);
  return obj;
}

/** Read the locally stored keypair without creating a new one. */
export async function getLocalKeypair(userId: string): Promise<Keypair | null> {
  const d = await db();
  const stored = (await d.get(STORE, userId)) as Keypair | undefined;
  return stored?.publicKey && stored?.secretKey ? stored : null;
}

/** Overwrite the local keypair (used by import). */
export async function setLocalKeypair(userId: string, kp: Keypair): Promise<void> {
  const d = await db();
  await d.put(STORE, kp, userId);
}

/** Publish the user's public key to their profile so others can encrypt to them. */
export async function publishPublicKey(userId: string, publicKey: Uint8Array) {
  const b64 = toB64(publicKey);
  await supabase
    .from("profiles")
    .update({ public_key: b64, key_created_at: new Date().toISOString() } as any)
    .eq("id", userId);
}

export async function ensurePublishedKey(userId: string, currentPublicKey: string | null | undefined) {
  const kp = await getOrCreateKeypair(userId);
  const localB64 = toB64(kp.publicKey);
  if (currentPublicKey !== localB64) {
    await publishPublicKey(userId, kp.publicKey);
  }
  return kp;
}

export async function encryptMessage(
  plaintext: string,
  recipientPubKeyB64: string,
  senderSecretKey: Uint8Array,
): Promise<{ cipher: string; nonce: string }> {
  await ready();
  const recipientPub = fromB64(recipientPubKeyB64);
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
  const msg = sodium.from_string(plaintext);
  const cipher = sodium.crypto_box_easy(msg, nonce, recipientPub, senderSecretKey);
  return { cipher: toB64(cipher), nonce: toB64(nonce) };
}

export async function decryptMessage(
  cipherB64: string,
  nonceB64: string,
  senderPubKeyB64: string,
  recipientSecretKey: Uint8Array,
): Promise<string> {
  await ready();
  const cipher = fromB64(cipherB64);
  const nonce = fromB64(nonceB64);
  const senderPub = fromB64(senderPubKeyB64);
  const plain = sodium.crypto_box_open_easy(cipher, nonce, senderPub, recipientSecretKey);
  return sodium.to_string(plain);
}

/** Export the local keypair as a JSON blob for download. */
export async function exportKeypair(userId: string): Promise<string | null> {
  const kp = await getLocalKeypair(userId);
  if (!kp) return null;
  return JSON.stringify(
    {
      version: 1,
      userId,
      publicKey: toB64(kp.publicKey),
      secretKey: toB64(kp.secretKey),
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  );
}

/** Import a keypair JSON blob and store it locally. Returns true on success. */
export async function importKeypair(userId: string, json: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.publicKey || !parsed.secretKey) return false;
    const publicKey = fromB64(parsed.publicKey);
    const secretKey = fromB64(parsed.secretKey);
    await setLocalKeypair(userId, { publicKey, secretKey });
    // Re-publish public key so it matches local
    await publishPublicKey(userId, publicKey);
    return true;
  } catch {
    return false;
  }
}

/** Compare a profile's published public key to what's locally stored. */
export async function isLocalKeyPublished(userId: string, publishedB64: string | null | undefined): Promise<boolean> {
  if (!publishedB64) return false;
  const kp = await getLocalKeypair(userId);
  if (!kp) return false;
  return toB64(kp.publicKey) === publishedB64;
}
