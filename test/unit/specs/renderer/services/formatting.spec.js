/** eslint-disable no-unused-expressions */
import { formatting } from '@/services';

describe('services/formatting', () => {
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
      expect(formatting.formatMoney(null)).to.eql('N/A');
      expect(formatting.formatMoney(undefined)).to.be.eql('N/A');
      expect(formatting.formatMoney(null, null, 'default')).to.eql('default');
      expect(formatting.formatMoney(undefined, null, 'default')).to.be.eql('default');
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
      expect(formatting.formatNumber(1e-13)).to.be.eql('0.0000000000001');
      expect(formatting.formatNumber(null)).to.be.eql('N/A');
      expect(formatting.formatNumber(undefined)).to.be.eql('N/A');
      expect(formatting.formatNumber(null, null, 'default')).to.eql('default');
      expect(formatting.formatNumber(undefined, null, 'default')).to.be.eql('default');
    });
  });

  describe('formatTime', () => {
    it('should properly format', () => {
      expect(formatting.formatTime(1524752757)).to.be.eql('8:25 AMC');
      expect(formatting.formatTime('1524752757')).to.be.eql('8:25 AMC');
      expect(formatting.formatTime(null)).to.eql('--');
      expect(formatting.formatTime(undefined)).to.be.eql('--');
      expect(formatting.formatTime(null, 'default')).to.eql('default');
      expect(formatting.formatTime(undefined, 'default')).to.be.eql('default');
    });
  });
});
