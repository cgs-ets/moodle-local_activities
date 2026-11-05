import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { getConfig } from ".";

dayjs.extend(utc);
dayjs.extend(timezone);

const FALLBACK_TIMEZONE = "Australia/Sydney";

/**
 * The school's timezone (Moodle's server timezone), injected by index.php.
 */
export const schoolTimezone = (): string => getConfig().timezone || FALLBACK_TIMEZONE;

/**
 * A unix timestamp from the server, as a dayjs in school time rather than the
 * browser's timezone. Use this for anything displayed, so a parent overseas sees
 * the same dates and times as the school.
 */
export const schoolTime = (ts: number | string) => dayjs.unix(Number(ts)).tz(schoolTimezone());

/**
 * The current moment in school time. Use for "today", the current term and the
 * current year, so they match the server's 'YYYY-MM-DD' day keys.
 */
export const schoolNow = () => dayjs().tz(schoolTimezone());

/**
 * A 'YYYY-MM-DD' date key from the server, which is a calendar date and has no
 * timezone. Parsed as a local date so it formats as the same day everywhere.
 */
export const dateKey = (key: string) => dayjs(key);
