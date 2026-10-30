import { createHmac, timingSafeEqual } from 'node:crypto';

export const MAX_CLOCK_SKEW_SECONDS = 300;
export const MIN_SECRET_LENGTH = 16;

export function isValidTimestamp(value, now = Date.now()) {
  if (typeof value !== 'string' || !/^[0-9]{1,12}$/.test(value)) return false;
  const seconds = Number(value);
  if (!Number.isSafeInteger(seconds) || seconds <= 0) return false;
  return Math.abs(Math.floor(now / 1000) - seconds) <= MAX_CLOCK_SKEW_SECONDS;
}

export function signPayload(secret, timestamp, rawBody) {
  return createHmac('sha256', secret).update(`${timestamp}.`).update(rawBody).digest('hex');
}

export function verifySignature(secret, timestamp, rawBody, signature) {
  if (typeof secret !== 'string' || secret.length < MIN_SECRET_LENGTH) return false;
  if (typeof signature !== 'string' || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  const expected = signPayload(secret, timestamp, rawBody);
  const left = Buffer.from(expected, 'hex');
  const right = Buffer.from(signature, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
}
