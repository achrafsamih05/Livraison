import {
  computeCheckChar,
  generateTrackingNumber,
  isValidTrackingNumber,
} from './tracking-number.generator';

describe('tracking-number.generator', () => {
  it('generates a tracking number with the default prefix and country', () => {
    const tn = generateTrackingNumber();
    expect(tn).toMatch(/^LV\d{10}[0-9X]SA$/);
  });

  it('honors custom prefix and country', () => {
    const tn = generateTrackingNumber({ prefix: 'ex', country: 'ae' });
    expect(tn).toMatch(/^EX\d{10}[0-9X]AE$/);
  });

  it('produces a check character that validates', () => {
    for (let i = 0; i < 50; i += 1) {
      const tn = generateTrackingNumber();
      expect(isValidTrackingNumber(tn)).toBe(true);
    }
  });

  it('detects a single-digit transcription error via the check char', () => {
    const tn = generateTrackingNumber();
    // Flip one serial digit; the check character should no longer match.
    const serial = tn.slice(2, 12);
    const flippedDigit = ((Number(serial[0]) + 1) % 10).toString();
    const tampered = `${tn.slice(0, 2)}${flippedDigit}${tn.slice(3)}`;
    expect(isValidTrackingNumber(tampered)).toBe(false);
  });

  it('rejects structurally invalid tracking numbers', () => {
    expect(isValidTrackingNumber('not-a-tracking-number')).toBe(false);
    expect(isValidTrackingNumber('LV123SA')).toBe(false);
    expect(isValidTrackingNumber('')).toBe(false);
  });

  it('computeCheckChar is deterministic', () => {
    expect(computeCheckChar('1234567890')).toBe(computeCheckChar('1234567890'));
  });

  it('generates distinct numbers across calls', () => {
    const set = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      set.add(generateTrackingNumber());
    }
    expect(set.size).toBe(200);
  });
});
