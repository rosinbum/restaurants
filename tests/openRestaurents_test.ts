import { expect } from 'chai';
import { describe } from 'mocha';
import findOpenRestaurants, {
  isOpenOnDay,
  openFor,
  parseHoursAndMins,
  processRestaurant,
} from '../src/openRestaurants';

const MONDAY_1_15_PM = new Date('Dec 20, 2021 1:15 pm');
const WEDNESDAY_4_26_AM = new Date('Dec 22, 2021 4:26 am');
const OPEN_FOR_TEST = [
  { name: 'Kushi Tsuru', closeIn: 27900000 },
  { name: 'Osakaya Restaurant', closeIn: 27900000 },
  { name: 'Iroha Restaurant', closeIn: 29700000 },
  { name: 'The Stinking Rose', closeIn: 31500000 },
  { name: "McCormick & Kuleto's", closeIn: 31500000 },
  { name: 'Mifune Restaurant', closeIn: 31500000 },
  { name: 'New Delhi Indian Restaurant', closeIn: 31500000 },
  { name: 'Rose Pistola', closeIn: 31500000 },
  { name: 'The Cheesecake Factory', closeIn: 35100000 },
  { name: "Alioto's Restaurant", closeIn: 35100000 },
];
describe('findOpenRestaurants', () => {
  describe('parseHoursAndMins', () => {
    it('should be parse am', () => {
      expect(parseHoursAndMins('12', 'am')).equal(0);
      expect(parseHoursAndMins('9', 'am')).equal(9 * 60);
      expect(parseHoursAndMins('11:30', 'am')).equal(11 * 60 + 30);
      expect(parseHoursAndMins('12:30', 'am')).equal(30);
    });
    it('should be parse pm', () => {
      expect(parseHoursAndMins('12:30', 'pm')).equal(12 * 60 + 30);
      expect(parseHoursAndMins('9', 'pm')).equal(12 * 60 + 9 * 60);
      expect(parseHoursAndMins('11:30', 'pm')).equal(12 * 60 + 11 * 60 + 30);
    });
  });
  describe('isDay', () => {
    it('should match single day', () => {
      expect(isOpenOnDay(MONDAY_1_15_PM, 'Mon', '')).true;
      expect(isOpenOnDay(MONDAY_1_15_PM, 'Sun', '')).false;
      expect(isOpenOnDay(WEDNESDAY_4_26_AM, 'Wed', '')).true;
    });
    it('should match range', () => {
      expect(isOpenOnDay(MONDAY_1_15_PM, 'Sun', 'Mon')).true;
      expect(isOpenOnDay(MONDAY_1_15_PM, 'Mon', 'Sun')).true;
      expect(isOpenOnDay(MONDAY_1_15_PM, 'Mon', 'Mon')).true;
      expect(isOpenOnDay(WEDNESDAY_4_26_AM, 'Thu', 'Fri')).false;
      expect(isOpenOnDay(WEDNESDAY_4_26_AM, 'Thu', 'Tue')).false;
    });
  });
  describe('isOpen', () => {
    it('should parse single date', () => {
      expect(openFor(MONDAY_1_15_PM, 'Mon-Sun 11:30 am - 9 pm')).equal(27900000);
      expect(openFor(MONDAY_1_15_PM, 'Mon 11:30 am - 8 pm')).equal(24300000);
      expect(openFor(MONDAY_1_15_PM, 'Mon-Tue 11:30 am - 7 pm')).equal(20700000);

      expect(openFor(MONDAY_1_15_PM, 'Mon-Tue 11:30 am - 1:15 pm')).equal(-1);
      expect(openFor(WEDNESDAY_4_26_AM, 'Tue-Sun 11:30 am - 9 pm')).equal(-1);
      expect(openFor(MONDAY_1_15_PM, 'Tue-Sun 11:30 am - 9 pm')).equal(-1);
      expect(openFor(MONDAY_1_15_PM, 'Sun 11:30 am - 9 pm')).equal(-1);
    });
    describe('should parse multi dates', () => {
      it('for different times', () => {
        expect(
          openFor(
            MONDAY_1_15_PM,
            'Sun 8:45 am - 7 pm / Fri - Sat 11:30 am - 9 pm / Mon-Tue 11:30 am - 4 pm',
          ),
        ).equal(9900000);
        expect(openFor(WEDNESDAY_4_26_AM, 'Wed 3:30 am - 1 pm / Fri-Sat 2:30 am - 1 pm')).equal(
          30840000,
        );
        expect(openFor(WEDNESDAY_4_26_AM, 'Wed 7:30 am - 12:30 pm / Fri-Sat 2:30 am - 1 pm')).equal(
          -1,
        );
      });
      it('for different dates', () => {
        expect(openFor(MONDAY_1_15_PM, 'Mon, Thu-Fri 11:30 am - 5 pm')).equal(13500000);
        expect(openFor(WEDNESDAY_4_26_AM, 'Mon, Wed-Sun 3:30 am - 11:30 pm')).equal(68640000);

        expect(openFor(WEDNESDAY_4_26_AM, 'Tue, Thu, Sat-Sun 11:30 am - 9 pm')).equal(-1);
        expect(openFor(MONDAY_1_15_PM, 'Tue-Sun 11:30 am - 9 pm')).equal(-1);
        expect(openFor(MONDAY_1_15_PM, 'Sun 11:30 am - 9 pm')).equal(-1);
      });
    });
  });
  describe('processRestaurant()', () => {
    it('should process a restaurant', () => {
      expect(processRestaurant(MONDAY_1_15_PM, '"Isobune Sushi","Mon-Sun 11:30 am - 9:30 pm"')).eql(
        { name: 'Isobune Sushi', closeIn: 29700000 },
      );
      expect(processRestaurant(MONDAY_1_15_PM, '"Isobune Sushi","Wed-Sun 11:30 am - 9:30 pm"')).be
        .null;
    });
  });
  describe('findOpenRestaurants', () => {
    it('should process a file', async () => {
      const resp = await findOpenRestaurants('tests/test.csv', MONDAY_1_15_PM);
      expect(resp).eql(OPEN_FOR_TEST);
    });
    it('should return empty for csv that can not be opened', async () => {
      const resp = await findOpenRestaurants('invalid.csv', MONDAY_1_15_PM);
      expect(resp).eql([]);
    });
  });
});
