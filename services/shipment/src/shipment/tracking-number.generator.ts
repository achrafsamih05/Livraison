import { randomInt } from 'node:crypto';

/**
 * Generates human-readable, collision-resistant tracking numbers (AWBs).
 *
 * Format: <PREFIX><10 digits><CHECK><COUNTRY>, e.g. LV4830561927X SA -> "LV4830561927XSA".
 * - 10 random digits give ~10^10 space per prefix/country; uniqueness is also
 *   guaranteed by a DB unique constraint with retry on collision.
 * - A mod-11 check digit (value 0-9 or 'X') catches transcription errors.
 */
export interface TrackingNumberOptions {
  prefix?: string;
  country?: string;
}

const DEFAULT_PREFIX = 'LV';
const DEFAULT_COUNTRY = 'SA';
const SERIAL_DIGITS = 10;

function randomSerial(): string {
  let serial = '';
  for (let i = 0; i < SERIAL_DIGITS; i += 1) {
    serial += randomInt(0, 10).toString();
  }
  return serial;
}

/**
 * Mod-11 check character over the serial digits. Returns '0'..'9' or 'X'
 * (when the remainder is 10), matching common AWB conventions.
 */
export function computeCheckChar(serial: string): string {
  let sum = 0;
  let weight = 2;
  for (let i = serial.length - 1; i >= 0; i -= 1) {
    sum += Number(serial[i]) * weight;
    weight = weight === 7 ? 2 : weight + 1;
  }
  const remainder = (11 - (sum % 11)) % 11;
  return remainder === 10 ? 'X' : remainder.toString();
}

export function generateTrackingNumber(options: TrackingNumberOptions = {}): string {
  const prefix = (options.prefix ?? DEFAULT_PREFIX).toUpperCase();
  const country = (options.country ?? DEFAULT_COUNTRY).toUpperCase();
  const serial = randomSerial();
  const check = computeCheckChar(serial);
  return `${prefix}${serial}${check}${country}`;
}

/**
 * Validates the structure and check character of a tracking number.
 * Useful for guarding public tracking lookups against malformed input.
 */
export function isValidTrackingNumber(value: string, options: TrackingNumberOptions = {}): boolean {
  const prefix = (options.prefix ?? DEFAULT_PREFIX).toUpperCase();
  const country = (options.country ?? DEFAULT_COUNTRY).toUpperCase();
  const pattern = new RegExp(`^${prefix}(\\d{${SERIAL_DIGITS}})([0-9X])${country}$`);
  const match = pattern.exec(value);
  if (match === null) {
    return false;
  }
  const [, serial, check] = match;
  return computeCheckChar(serial) === check;
}
