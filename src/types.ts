
/**
 * Date/time input parameters
 */
export interface DateTimeInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  timezone: string;
  useMilliseconds?: boolean;
}
