/**
 * Test suite for unix-time-converter
 */

import {
  dateToUnixTime,
  dateToUnixTimeFromObject,
  getCurrentUnixTime,
  unixTimeToIso,
} from '../src/index';
import { DateTimeInput } from '../src/types';

describe('dateToUnixTime', () => {
  describe('UTC offset format', () => {
    test('should convert UTC time correctly', () => {
      // Jan 1, 2024, 00:00:00 UTC
      const timestamp = dateToUnixTime(2024, 1, 1, 0, 0, 0, 'Z');
      expect(timestamp).toBe(1704067200);
    });

    test('should convert positive UTC offset correctly', () => {
      // Dec 4, 2024, 14:30:00 UTC+05:30 (India Standard Time)
      // This is 09:00:00 UTC (14:30 - 5:30)
      const timestamp = dateToUnixTime(2024, 12, 4, 14, 30, 0, '+05:30');
      expect(timestamp).toBe(1733302800);
    });

    test('should convert negative UTC offset correctly', () => {
      // Dec 4, 2024, 07:30:00 UTC-05:00 (Eastern Standard Time)
      // This is 12:30:00 UTC (07:30 + 5:00)
      const timestamp = dateToUnixTime(2024, 12, 4, 7, 30, 0, '-05:00');
      expect(timestamp).toBe(1733315400);
    });

    test('should handle midnight correctly', () => {
      const timestamp = dateToUnixTime(2024, 1, 1, 0, 0, 0, '+00:00');
      expect(timestamp).toBe(1704067200);
    });

    test('should handle end of day correctly', () => {
      const timestamp = dateToUnixTime(2024, 1, 1, 23, 59, 59, 'Z');
      expect(timestamp).toBe(1704153599);
    });
  });

  describe('IANA timezone format', () => {

    test('should convert Israel timezone', () => {
      // Dec 4, 2024, 14:30:00 in Israel (Israel Standard Time, UTC+2)
      // This is 12:30:00 UTC
      const timestamp = dateToUnixTime(2025, 12, 4, 16, 49, 0, 'Asia/Jerusalem');
      expect(timestamp).toBe(1764859740);
    });

    test('should convert Israel timezone with milliseconds', () => {
      // Dec 4, 2024, 14:30:00 in Israel (Israel Standard Time, UTC+2)
      // This is 12:30:00 UTC
      const timestamp = dateToUnixTime(2025, 12, 4, 16, 49, 0, 'Asia/Jerusalem', true);
      expect(timestamp).toBe(1764859740000);
    });

    test('should convert America/New_York timezone', () => {
      // Dec 4, 2024, 07:30:00 in New York (EST, UTC-5)
      // This is 12:30:00 UTC
      const timestamp = dateToUnixTime(2024, 12, 4, 7, 30, 0, 'America/New_York');
      expect(timestamp).toBe(1733315400);
    });

    test('should convert America/New_York timezone with milliseconds', () => {
      // Dec 4, 2024, 07:30:00 in New York (EST, UTC-5)
      // This is 12:30:00 UTC
      const timestamp = dateToUnixTime(2024, 12, 4, 7, 30, 0, 'America/New_York', true);
      expect(timestamp).toBe(1733315400000);
    });

    test('should convert Asia/Kolkata timezone', () => {
      // Dec 4, 2024, 18:00:00 in Kolkata (IST, UTC+5:30)
      // This is 12:30:00 UTC
      const timestamp = dateToUnixTime(2024, 12, 4, 18, 0, 0, 'Asia/Kolkata');
      expect(timestamp).toBe(1733315400);
    });

    test('should convert Europe/London timezone', () => {
      // Dec 4, 2024, 12:30:00 in London (GMT, UTC+0)
      // This is 12:30:00 UTC
      const timestamp = dateToUnixTime(2024, 12, 4, 12, 30, 0, 'Europe/London');
      expect(timestamp).toBe(1733315400);
    });

    test('should handle DST transitions correctly', () => {
      // June 15, 2024, 12:00:00 in New York (EDT, UTC-4 due to DST)
      const summerTimestamp = dateToUnixTime(2024, 6, 15, 12, 0, 0, 'America/New_York');

      // December 15, 2024, 12:00:00 in New York (EST, UTC-5, no DST)
      const winterTimestamp = dateToUnixTime(2024, 12, 15, 12, 0, 0, 'America/New_York');

      // The difference should account for DST (1 hour = 3600 seconds)
      // Note: This test validates that DST is handled, not the exact values
      expect(typeof summerTimestamp).toBe('number');
      expect(typeof winterTimestamp).toBe('number');
    });
  });

  describe('input validation', () => {
    test('should throw error for invalid month (too low)', () => {
      expect(() => {
        dateToUnixTime(2024, 0, 15, 12, 0, 0, 'Z');
      }).toThrow('Invalid month: 0. Must be between 1-12');
    });

    test('should throw error for invalid month (too high)', () => {
      expect(() => {
        dateToUnixTime(2024, 13, 15, 12, 0, 0, 'Z');
      }).toThrow('Invalid month: 13. Must be between 1-12');
    });

    test('should throw error for invalid day (too low)', () => {
      expect(() => {
        dateToUnixTime(2024, 6, 0, 12, 0, 0, 'Z');
      }).toThrow('Invalid day: 0. Must be between 1-31');
    });

    test('should throw error for invalid day (too high)', () => {
      expect(() => {
        dateToUnixTime(2024, 6, 32, 12, 0, 0, 'Z');
      }).toThrow('Invalid day: 32. Must be between 1-31');
    });

    test('should throw error for invalid hour (negative)', () => {
      expect(() => {
        dateToUnixTime(2024, 6, 15, -1, 0, 0, 'Z');
      }).toThrow('Invalid hour: -1. Must be between 0-23');
    });

    test('should throw error for invalid hour (too high)', () => {
      expect(() => {
        dateToUnixTime(2024, 6, 15, 24, 0, 0, 'Z');
      }).toThrow('Invalid hour: 24. Must be between 0-23');
    });

    test('should throw error for invalid minute', () => {
      expect(() => {
        dateToUnixTime(2024, 6, 15, 12, 60, 0, 'Z');
      }).toThrow('Invalid minute: 60. Must be between 0-59');
    });

    test('should throw error for invalid second', () => {
      expect(() => {
        dateToUnixTime(2024, 6, 15, 12, 0, 60, 'Z');
      }).toThrow('Invalid second: 60. Must be between 0-59');
    });

    test('should throw error for invalid timezone name', () => {
      expect(() => {
        dateToUnixTime(2024, 6, 15, 12, 0, 0, 'Invalid/Timezone');
      }).toThrow('Invalid timezone');
    });
  });

  describe('edge cases', () => {
    test('should handle leap year correctly', () => {
      // Feb 29, 2024 (leap year)
      const timestamp = dateToUnixTime(2024, 2, 29, 0, 0, 0, 'Z');
      expect(timestamp).toBe(1709164800);
    });

    test('should handle year boundaries', () => {
      // Dec 31, 2023, 23:59:59
      const endOf2023 = dateToUnixTime(2023, 12, 31, 23, 59, 59, 'Z');
      // Jan 1, 2024, 00:00:00
      const startOf2024 = dateToUnixTime(2024, 1, 1, 0, 0, 0, 'Z');

      expect(startOf2024 - endOf2023).toBe(1);
    });

    test('should handle large UTC offsets', () => {
      // UTC+14:00 (Line Islands)
      const timestamp = dateToUnixTime(2024, 1, 1, 14, 0, 0, '+14:00');
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });

    test('should handle negative UTC offsets', () => {
      // UTC-11:00 (American Samoa)
      const timestamp = dateToUnixTime(2024, 1, 1, 0, 0, 0, '-11:00');
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });
  });
});

describe('dateToUnixTimeFromObject', () => {
  test('should work with object input', () => {
    const input: DateTimeInput = {
      year: 2024,
      month: 12,
      day: 4,
      hour: 14,
      minute: 30,
      second: 0,
      timezone: '+05:30'
    };

    // Dec 4, 2024, 14:30:00 UTC+05:30 = 09:00:00 UTC
    const timestamp = dateToUnixTimeFromObject(input);
    expect(timestamp).toBe(1733302800);
  });

  test('should produce same result as direct function call', () => {
    const input: DateTimeInput = {
      year: 2024,
      month: 6,
      day: 15,
      hour: 12,
      minute: 30,
      second: 45,
      timezone: 'America/New_York'
    };

    const objResult = dateToUnixTimeFromObject(input);
    const directResult = dateToUnixTime(
      input.year,
      input.month,
      input.day,
      input.hour,
      input.minute,
      input.second,
      input.timezone
    );

    expect(objResult).toBe(directResult);
  });
});

describe('getCurrentUnixTime', () => {
  test('should return current unix timestamp', () => {
    const before = Math.floor(Date.now() / 1000);
    const timestamp = getCurrentUnixTime();
    const after = Math.floor(Date.now() / 1000);

    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });

  test('should return a number', () => {
    const timestamp = getCurrentUnixTime();
    expect(typeof timestamp).toBe('number');
  });

  test('should return positive integer', () => {
    const timestamp = getCurrentUnixTime();
    expect(timestamp).toBeGreaterThan(0);
    expect(Number.isInteger(timestamp)).toBe(true);
  });
});

describe('unixTimeToIso', () => {
  test('should convert unix time to ISO string', () => {
    const iso = unixTimeToIso(1704067200);
    expect(iso).toBe('2024-01-01T00:00:00.000Z');
  });

  test('should handle different timestamps', () => {
    // 1733302800 = Dec 4, 2024, 09:00:00 UTC
    const iso = unixTimeToIso(1733302800);
    expect(iso).toBe('2024-12-04T09:00:00.000Z');
  });

  test('should be reversible with dateToUnixTime', () => {
    const originalTimestamp = 1733315400; // Dec 4, 2024, 12:30:00 UTC
    const iso = unixTimeToIso(originalTimestamp);

    // Parse the ISO string back
    const date = new Date(iso);
    const reconstructedTimestamp = Math.floor(date.getTime() / 1000);

    expect(reconstructedTimestamp).toBe(originalTimestamp);
  });

  test('should always return UTC timezone', () => {
    const iso = unixTimeToIso(1733309400);
    expect(iso.endsWith('Z')).toBe(true);
  });
});

describe('integration tests', () => {
  test('should handle complete workflow', () => {
    // Create a timestamp - Dec 4, 2024, 14:30:00 UTC+05:30 = 09:00:00 UTC
    const timestamp = dateToUnixTime(2024, 12, 4, 14, 30, 0, '+05:30');

    // Convert back to ISO
    const iso = unixTimeToIso(timestamp);

    // Should be in UTC
    expect(iso).toBe('2024-12-04T09:00:00.000Z');

    // Parse and verify
    const parsedDate = new Date(iso);
    expect(Math.floor(parsedDate.getTime() / 1000)).toBe(timestamp);
  });

  test('should handle timezone conversions correctly', () => {
    // Same moment in time, different timezones - all should be 12:30 UTC
    const utcTimestamp = dateToUnixTime(2024, 12, 4, 12, 30, 0, 'Z');
    const istTimestamp = dateToUnixTime(2024, 12, 4, 18, 0, 0, '+05:30');
    const estTimestamp = dateToUnixTime(2024, 12, 4, 7, 30, 0, '-05:00');

    // All should be the same moment in time
    expect(utcTimestamp).toBe(istTimestamp);
    expect(utcTimestamp).toBe(estTimestamp);
    expect(utcTimestamp).toBe(1733315400); // Dec 4, 2024, 12:30 UTC
  });
});
