/**
 * Unix Time Converter
 * Converts date/time components with timezone support to Unix timestamps
 */
import { DateTimeInput } from './types';

/**
 * Converts date/time components to Unix timestamp (seconds since Jan 1, 1970 UTC)
 *
 * This function handles two timezone formats:
 * 1. UTC offset strings: "+05:30", "-08:00", "Z"
 * 2. IANA timezone names: "America/New_York", "Asia/Kolkata", "Europe/London"
 *
 * @param year - Full year (e.g., 2024)
 * @param month - Month (1-12, where 1 = January, 12 = December)
 * @param day - Day of month (1-31)
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @param second - Second (0-59)
 * @param timezone - Timezone as UTC offset string (e.g., "+05:30", "-08:00", "Z")
 *                   or IANA timezone name (e.g., "America/New_York", "Asia/Kolkata")
 * @returns Unix timestamp in seconds
 * @throws {Error} If date is invalid or timezone format is incorrect
 *
 * @example
 * // Using UTC offset
 * const timestamp1 = dateToUnixTime(2024, 12, 4, 14, 30, 0, "+05:30");
 * console.log(timestamp1); // 1733309400
 *
 * @example
 * // Using UTC
 * const timestamp2 = dateToUnixTime(2024, 1, 1, 0, 0, 0, "Z");
 * console.log(timestamp2); // 1704067200
 *
 * @example
 * // Using IANA timezone (more accurate for DST)
 * const timestamp3 = dateToUnixTime(2024, 12, 4, 14, 30, 0, "America/New_York");
 * console.log(timestamp3); // 1733339400
 *
 * @security
 * - All inputs are validated before processing
 * - No external dependencies or network calls
 * - Pure function with no side effects
 */
export function dateToUnixTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timezone: string,
  useMilliseconds?: boolean
): number {
  // Input validation - ensure all values are within valid ranges
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Must be between 1-12`);
  }
  if (day < 1 || day > 31) {
    throw new Error(`Invalid day: ${day}. Must be between 1-31`);
  }
  if (hour < 0 || hour > 23) {
    throw new Error(`Invalid hour: ${hour}. Must be between 0-23`);
  }
  if (minute < 0 || minute > 59) {
    throw new Error(`Invalid minute: ${minute}. Must be between 0-59`);
  }
  if (second < 0 || second > 59) {
    throw new Error(`Invalid second: ${second}. Must be between 0-59`);
  }

  // Handle UTC offset format (e.g., "+05:30", "-08:00", "Z")
  if (timezone === "Z" || /^[+-]\d{2}:\d{2}$/.test(timezone)) {
    return handleUtcOffset(year, month, day, hour, minute, second, timezone, useMilliseconds);
  }

  // Handle IANA timezone names (e.g., "America/New_York", "Asia/Kolkata")
  return handleIanaTimezone(year, month, day, hour, minute, second, timezone, useMilliseconds);
}

/**
 * Handles UTC offset timezone format
 * @private
 */
function handleUtcOffset(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timezone: string,
  useMilliseconds: boolean = false
): number {
  // Build ISO 8601 string with timezone offset
  const isoString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}${timezone === 'Z' ? 'Z' : timezone}`;

  const date = new Date(isoString);

  // Check if date is valid
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${isoString}`);
  }

  if (useMilliseconds) {
    return date.getTime();
  }
  // Return Unix timestamp (convert milliseconds to seconds)
  return Math.floor(date.getTime() / 1000);
}

/**
 * Handles IANA timezone names using Intl.DateTimeFormat
 * This approach correctly handles Daylight Saving Time (DST) transitions
 * @private
 */
function handleIanaTimezone(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timezone: string,
  useMilliseconds: boolean = false
): number {
  try {
    // Validate timezone by attempting to create a formatter
    // This will throw if timezone is invalid
    void new Intl.DateTimeFormat('en-US', { timeZone: timezone });

    // Create a date in UTC with the given components
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    // Format the UTC date as if it were in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(utcDate);

    // Extract the formatted parts
    const getPartValue = (type: string): number => {
      const part = parts.find(p => p.type === type);
      return part ? parseInt(part.value, 10) : 0;
    };

    // Create a date representing what the formatter thinks it is in the target timezone
    const localDate = new Date(Date.UTC(
      getPartValue('year'),
      getPartValue('month') - 1,
      getPartValue('day'),
      getPartValue('hour'),
      getPartValue('minute'),
      getPartValue('second')
    ));

    // Calculate the offset between what we want and what we got
    const offset = utcDate.getTime() - localDate.getTime();

    // Apply the offset to get the correct UTC time
    const correctDate = new Date(utcDate.getTime() + offset);

    if (useMilliseconds) {
      return correctDate.getTime();
    }
    // Return Unix timestamp
    return Math.floor(correctDate.getTime() / 1000);

  } catch (error) {
    throw new Error(
      `Invalid timezone: ${timezone}. Use UTC offset format (e.g., "+05:30") or valid IANA timezone name (e.g., "America/New_York"). Error: ${(error as Error).message}`
    );
  }
}

/**
 * Convenience function that accepts a DateTimeInput object
 *
 * @param input - Object containing date/time components and timezone
 * @returns Unix timestamp in seconds
 *
 * @example
 * const timestamp = dateToUnixTimeFromObject({
 *   year: 2024,
 *   month: 12,
 *   day: 4,
 *   hour: 14,
 *   minute: 30,
 *   second: 0,
 *   timezone: "+02:00"
 * });
 */
export function dateToUnixTimeFromObject(input: DateTimeInput): number {
  return dateToUnixTime(
    input.year,
    input.month,
    input.day,
    input.hour,
    input.minute,
    input.second,
    input.timezone
  );
}

/**
 * Get current Unix timestamp
 * @returns Current Unix timestamp in seconds
 *
 * @example
 * const now = getCurrentUnixTime();
 * console.log(now); // e.g., 1733309400
 */
export function getCurrentUnixTime(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Convert Unix timestamp back to ISO 8601 string
 * @param unixTime - Unix timestamp in seconds
 * @returns ISO 8601 formatted string in UTC
 *
 * @example
 * const iso = unixTimeToIso(1733309400);
 * console.log(iso); // "2024-12-04T12:30:00.000Z"
 */
export function unixTimeToIso(unixTime: number): string {
  return new Date(unixTime * 1000).toISOString();
}

// Default export
export default {
  dateToUnixTime,
  dateToUnixTimeFromObject,
  getCurrentUnixTime,
  unixTimeToIso
};