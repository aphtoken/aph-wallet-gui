/** eslint-disable no-unused-expressions */
import { BigNumber } from 'bignumber.js';

import { formats } from '@/constants';
import { formatting } from '@/services';

const toBigNumber = value => new BigNumber(String(value));

describe('services/formatting', () => {
  describe('abbreviateNumber', () => {
    it('should properly format', () => {
      expect(formatting.abbreviateNumber(12)).to.eql('12.0');
      expect(formatting.abbreviateNumber('12')).to.eql('12.0');
      expect(formatting.abbreviateNumber(1000)).to.eql('1.0k');
      expect(formatting.abbreviateNumber('1000')).to.eql('1.0k');
      expect(formatting.abbreviateNumber(1248215)).to.eql('1.2m');
      expect(formatting.abbreviateNumber('1248215')).to.eql('1.2m');
      expect(formatting.abbreviateNumber(1524752757)).to.eql('1.5b');
      expect(formatting.abbreviateNumber('1524752757')).to.eql('1.5b');
      expect(formatting.abbreviateNumber(1524752757.000001)).to.eql('1.5b');
      expect(formatting.abbreviateNumber('1524752757.000001')).to.eql('1.5b');
      expect(formatting.abbreviateNumber(toBigNumber(1524752757.000001))).to.eql('1.5b');
      expect(formatting.abbreviateNumber(undefined)).to.be.eql('N/A');
      expect(formatting.abbreviateNumber(null, formats.WHOLE_NUMBER, 'default')).to.eql('default');
      expect(formatting.abbreviateNumber(undefined, formats.WHOLE_NUMBER, 'default')).to.be.eql('default');
    });
  });

  describe('formatDate', () => {
    it('should properly format', () => {
      expect(formatting.formatDate(1524752757)).to.eql('26-04-2018');
      expect(formatting.formatDate('1524752757')).to.eql('26-04-2018');
      expect(formatting.formatDate(null)).to.eql('--');
      expect(formatting.formatDate(undefined)).to.be.eql('--');
      expect(formatting.formatDate(null, 'default')).to.eql('default');
      expect(formatting.formatDate(undefined, 'default')).to.be.eql('default');
    });
  });

  describe('formatDateShort', () => {
    it('should properly format', () => {
      expect(formatting.formatDateShort(1524752757)).to.eql('26-04');
      expect(formatting.formatDateShort('1524752757')).to.eql('26-04');
      expect(formatting.formatDateShort(null)).to.eql('--');
      expect(formatting.formatDateShort(undefined)).to.be.eql('--');
      expect(formatting.formatDateShort(null, 'default')).to.eql('default');
      expect(formatting.formatDateShort(undefined, 'default')).to.be.eql('default');
    });
  });

  describe('formatMoney', () => {
    it('should properly format', () => {
      expect(formatting.formatMoney(100000000.000001)).to.eql('$100,000,000.00');
      expect(formatting.formatMoney('100000000.000001')).to.eql('$100,000,000.00');
      expect(formatting.formatMoney(100000000.1)).to.eql('$100,000,000.10');
      expect(formatting.formatMoney('100000000.1')).to.eql('$100,000,000.10');
      expect(formatting.formatMoney(100000000.01)).to.eql('$100,000,000.01');
      expect(formatting.formatMoney('100000000.01')).to.eql('$100,000,000.01');
      expect(formatting.formatMoney(100000000)).to.eql('$100,000,000.00');
      expect(formatting.formatMoney('100000000')).to.eql('$100,000,000.00');
      expect(formatting.formatMoney(100000000, '^^')).to.eql('^^100,000,000.00');
      expect(formatting.formatMoney('100000000', '^^')).to.eql('^^100,000,000.00');
      expect(formatting.formatMoney(toBigNumber(100000000000000.0000000000001))).to.eql('$100,000,000,000,000.00');
      expect(formatting.formatMoney(null)).to.eql('N/A');
      expect(formatting.formatMoney(undefined)).to.be.eql('N/A');
      expect(formatting.formatMoney(null, null, 'default')).to.eql('default');
      expect(formatting.formatMoney(undefined, null, 'default')).to.be.eql('default');
    });
  });

  describe('formatMoneyWithoutCents', () => {
    it('should properly format', () => {
      expect(formatting.formatMoneyWithoutCents(100000000.000001)).to.eql('$100,000,000');
      expect(formatting.formatMoneyWithoutCents('100000000.000001')).to.eql('$100,000,000');
      expect(formatting.formatMoneyWithoutCents(100000000.1)).to.eql('$100,000,000');
      expect(formatting.formatMoneyWithoutCents('100000000.1')).to.eql('$100,000,000');
      expect(formatting.formatMoneyWithoutCents(100000000.01)).to.eql('$100,000,000');
      expect(formatting.formatMoneyWithoutCents('100000000.01')).to.eql('$100,000,000');
      expect(formatting.formatMoneyWithoutCents(100000000)).to.eql('$100,000,000');
      expect(formatting.formatMoneyWithoutCents('100000000')).to.eql('$100,000,000');
      expect(formatting.formatMoneyWithoutCents(100000000, '^^')).to.eql('^^100,000,000');
      expect(formatting.formatMoneyWithoutCents('100000000', '^^')).to.eql('^^100,000,000');
      /* eslint-disable max-len */
      expect(formatting.formatMoneyWithoutCents(toBigNumber(100000000000000.0000000000001))).to.eql('$100,000,000,000,000');
      /* eslint-enable max-len */
      expect(formatting.formatMoneyWithoutCents(null)).to.eql('N/A');
      expect(formatting.formatMoneyWithoutCents(undefined)).to.be.eql('N/A');
      expect(formatting.formatMoneyWithoutCents(null, null, 'default')).to.eql('default');
      expect(formatting.formatMoneyWithoutCents(undefined, null, 'default')).to.be.eql('default');
    });
  });

  describe('formatNumber', () => {
    it('should properly format', () => {
      expect(formatting.formatNumber(0.0000000000000001)).to.be.eql('0.0000000000000001');
      expect(formatting.formatNumber('0.0000000000000001')).to.be.eql('0.0000000000000001');
      expect(formatting.formatNumber(100000000)).to.be.eql('100,000,000');
      expect(formatting.formatNumber('100000000')).to.be.eql('100,000,000');
      expect(formatting.formatNumber(100000000, '0[.]0  ')).to.be.eql('100000000');
      expect(formatting.formatNumber('100000000', '0[.]0  ')).to.be.eql('100000000');
      expect(formatting.formatNumber(-100000000)).to.be.eql('-100,000,000');
      expect(formatting.formatNumber('-100000000')).to.be.eql('-100,000,000');
      expect(formatting.formatNumber(100000000.00000001)).to.be.eql('100,000,000.00000001');
      expect(formatting.formatNumber('100000000.00000001')).to.be.eql('100,000,000.00000001');
      expect(formatting.formatNumber(toBigNumber(100000000000000.0000000000001))).to.eql('100,000,000,000,000');
      expect(formatting.formatNumber(1e-13)).to.be.eql('0.0000000000001');
      expect(formatting.formatNumber(null)).to.be.eql('N/A');
      expect(formatting.formatNumber(undefined)).to.be.eql('N/A');
      expect(formatting.formatNumber(null, null, 'default')).to.eql('default');
      expect(formatting.formatNumber(undefined, null, 'default')).to.be.eql('default');
    });
  });

  describe('formatTime', () => {
    it('should properly format', () => {
      expect(formatting.formatTime(1524752757)).to.be.eql('8:25');
      expect(formatting.formatTime('1524752757')).to.be.eql('8:25');
      expect(formatting.formatTime(null)).to.eql('--');
      expect(formatting.formatTime(undefined)).to.be.eql('--');
      expect(formatting.formatTime(null, 'default')).to.eql('default');
      expect(formatting.formatTime(undefined, 'default')).to.be.eql('default');
    });
  });

  describe('formatWeekdayAndTime', () => {
    it('should properly format', () => {
      expect(formatting.formatWeekdayAndTime(1524752757)).to.be.eql('Th 8:57');
      expect(formatting.formatWeekdayAndTime('1524752757')).to.be.eql('Th 8:57');
      expect(formatting.formatWeekdayAndTime(null)).to.eql('--');
      expect(formatting.formatWeekdayAndTime(undefined)).to.be.eql('--');
      expect(formatting.formatWeekdayAndTime(null, 'default')).to.eql('default');
      expect(formatting.formatWeekdayAndTime(undefined, 'default')).to.be.eql('default');
    });
  });

  describe('formatTokenAmount', () => {
    it('should properly format', () => {
      expect(formatting.formatTokenAmount(0.000001)).to.be.eql('0.000001');
      expect(formatting.formatTokenAmount('0.000001')).to.be.eql('0.000001');
      expect(formatting.formatTokenAmount(100.000001)).to.be.eql('100.000001');
      expect(formatting.formatTokenAmount('100.000001')).to.be.eql('100.000001');
      expect(formatting.formatTokenAmount(1000.000001)).to.be.eql('1,000');
      expect(formatting.formatTokenAmount('1000.000001')).to.be.eql('1,000');
      expect(formatting.formatTokenAmount(toBigNumber(1000.000001))).to.be.eql('1,000');
      expect(formatting.formatTokenAmount(undefined)).to.be.eql('N/A');
      expect(formatting.formatTokenAmount(null, 1000, 'default')).to.eql('default');
      expect(formatting.formatTokenAmount(undefined, 1000, 'default')).to.be.eql('default');
    });
  });
});
