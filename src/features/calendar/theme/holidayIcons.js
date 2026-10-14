import indiaIcon from '@/assets/calendar_icons/holidays/india.png';
import pongalIcon from '@/assets/calendar_icons/holidays/pongal.png';
import holiIcon from '@/assets/calendar_icons/holidays/holi.png';
import eidIcon from '@/assets/calendar_icons/holidays/eid.png';
import goodFridayIcon from '@/assets/calendar_icons/holidays/good-friday.png';
import buddhaIcon from '@/assets/calendar_icons/holidays/buddha.png';
import rakshaBandhanIcon from '@/assets/calendar_icons/holidays/raksha-bandhan.png';
import ganeshIcon from '@/assets/calendar_icons/holidays/ganesh.png';
import gandhiIcon from '@/assets/calendar_icons/holidays/gandhi.png';
import dussehraIcon from '@/assets/calendar_icons/holidays/dussehra.png';
import diwaliIcon from '@/assets/calendar_icons/holidays/diwali.png';
import christmasIcon from '@/assets/calendar_icons/holidays/christmas.png';

/**
 * Custom icons for named holidays. Matched against the event title (case-insensitive),
 * first match wins. Holidays that match nothing here fall back to the default HOLIDAY icon.
 *
 * To add one: save the image in src/assets/calendar_icons/holidays/, import it above and
 * add an entry below.
 */
export const HOLIDAY_ICONS = [
  { name: 'Republic Day',        match: /\brepublic\s*day\b/i,                         icon: indiaIcon },
  { name: 'Independence Day',    match: /\bindependence\s*day\b/i,                     icon: indiaIcon },
  { name: 'Makar Sankranti',     match: /\b(makar\s*)?sankranti\b|\bpongal\b/i,        icon: pongalIcon },
  { name: 'Holi',                match: /\bholi\b/i,                                   icon: holiIcon },
  { name: 'Eid',                 match: /\beid\b|\bid[-\s]?ul[-\s]?fitr\b/i,           icon: eidIcon },
  { name: 'Good Friday',         match: /\bgood\s*friday\b/i,                          icon: goodFridayIcon },
  { name: 'Buddha Purnima',      match: /\bbuddha\b/i,                                 icon: buddhaIcon },
  { name: 'Raksha Bandhan',      match: /\braksha\s*bandhan\b|\brakhi\b/i,             icon: rakshaBandhanIcon },
  { name: 'Ganesh Chaturthi',    match: /\bganesh\b|\bganesha\b/i,                     icon: ganeshIcon },
  { name: 'Gandhi Jayanti',      match: /\bgandhi\b/i,                                 icon: gandhiIcon },
  { name: 'Dussehra',            match: /\bdussehra\b|\bdasara\b|\bvijayadashami\b/i,  icon: dussehraIcon },
  { name: 'Diwali',              match: /\bdiwali\b|\bdeepavali\b/i,                   icon: diwaliIcon },
  { name: 'Christmas',           match: /\bchristmas\b|\bxmas\b/i,                     icon: christmasIcon },
];

/** Returns the matching { icon } entry for an event title, or null. */
export function getHolidayIcon(title) {
  const text = String(title || '');
  if (!text) return null;
  return HOLIDAY_ICONS.find((entry) => entry.match.test(text)) || null;
}
