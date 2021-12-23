import * as fs from 'fs';
import * as readline from 'readline';
import events from 'node:events';

// Possible issue. To support a non standard week (Sun-Sat) this enum will need to be changed to be dynamic
// This is outside the scope of the current implementation
const DAYS_OF_WEEK: {
  [name: string]: number;
} = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};
const AM_PM: {
  [name: string]: number;
} = { am: 0, pm: 1 };

export type openRestaurant = {
  name: string;
  closeIn: number;
};

// findOpenRestaurants finds the restaurants that are open for a given day returning them so the ones closing soonest
// are first.
export default async function findOpenRestaurants(
  csvFilename: string,
  searchDatetime: Date,
): Promise<openRestaurant[]> {
  const restaurants: openRestaurant[] = [];
  try {
    const inputStream = fs.createReadStream(csvFilename);

    const rl = readline.createInterface({
      input: inputStream,
      crlfDelay: Infinity,
    });

    rl.on('line', (line) => {
      const openRestaurant = processRestaurant(searchDatetime, line);
      if (openRestaurant) {
        restaurants.push(openRestaurant);
      }
    });

    await events.once(rl, 'close');
  } catch (err) {
    console.error(`Error with file ${csvFilename}: ${err}`);
  }
  restaurants.sort((a, b) => {
    return a.closeIn - b.closeIn;
  });
  return restaurants;
}

// processRestaurant processes a single restaurant line returning an openRestaurant object if the restaurant is open
// and null if it is not
export function processRestaurant(date: Date, restaurant: string): openRestaurant | null {
  //Handle splitting the csv line into the name and open times
  const [restaurantName, openTimes] = restaurant.slice(1, -1).split('","');
  const remainingOpenTime = openFor(date, openTimes.trim());
  // Only return open restaurants
  if (remainingOpenTime > 0) {
    return { name: restaurantName, closeIn: remainingOpenTime };
  } else {
    return null;
  }
}

// openFor parses Restaurant open times returning the milliSeconds until close or -1 if the restaurant if closed
export function openFor(date: Date, openTimes: string): number {
  // Split the open times when they are different for different days and then handle independently
  return openTimes.split('/').reduce((prev: number, time: string) => {
    if (prev >= 0) {
      // Restaurant already found to be open no need to parse the remaining times
      return prev;
    }
    return openForHelper(date, time.trim());
  }, -1);
}

// openForRec is a helper function that processes the open times comparing a date to a given hour range and days. It
// returns the remaining open time in Milliseconds or -1 if closed
function openForHelper(date: Date, openTimes: string): number {
  const [closeAP, closeT, dash, openAP, openT, ...days] = openTimes.split(' ').reverse();

  // Handle days that may be formed as 'Mon', 'Mon,', 'Mon-Sat'
  if (
    !days.reduce((prev: boolean, day: string): boolean => {
      const [startD, endD] = day.replace(',', '').split(`-`);
      return prev || isOpenOnDay(date, startD, endD);
    }, false)
  ) {
    return -1;
  }

  // Get the open and close time
  const openTime = parseHoursAndMins(openT, openAP) * 60000; //convert to milliseconds
  let closeTime = parseHoursAndMins(closeT, closeAP) * 60000; //convert to milliseconds

  // Convert the date to milliseconds since midnight
  let checkTime =
    date.getHours() * 1000 * 60 * 60 +
    date.getMinutes() * 1000 * 60 +
    date.getSeconds() * 1000 +
    date.getMilliseconds();
  if (openTime < checkTime && checkTime < closeTime) {
    return closeTime - checkTime;
  } else {
    return -1;
  }
}

// isOpenOnDay checks to see if the restaurant is open on a given day.
export function isOpenOnDay(day: Date, startDay: string, endDay: string): boolean {
  if (!endDay || endDay.length < 1) {
    return day.getDay() === DAYS_OF_WEEK[startDay];
  }

  const startNum = DAYS_OF_WEEK[startDay];
  let endNum = DAYS_OF_WEEK[endDay];
  const dayNum = day.getDay();

  // check wrapping around the weekend
  if (endNum <= startNum) {
    endNum += 7;
  }

  return startNum <= dayNum && dayNum <= endNum;
}

// parseHoursAndMins turns a times string and AM/PM into milliseconds since midnight
export function parseHoursAndMins(time: string, am_pm: string): number {
  const [hours, mins] = time.split(`:`);
  let parsedTime = AM_PM[am_pm] * 60 * 12;
  if (hours && hours !== '12') {
    parsedTime += parseInt(hours) * 60;
  }
  if (mins) {
    parsedTime += parseInt(mins);
  }
  return parsedTime;
}
