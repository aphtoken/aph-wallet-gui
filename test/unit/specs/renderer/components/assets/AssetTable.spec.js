import AssetTable from '@/components/assets/AssetTable';
import { toBigNumber } from '@/services/formatting.js';
import utils from './../utils';

let wrapper;

describe('AssetTable.vue', () => {
  context('the holding can be deleted', () => {
    beforeEach(() => {
      const ops = {
        state: {
          searchBy: '',
        },
      };
      const state = {
        holdings: [
          {
            balance: toBigNumber(0),
            isNep5: true,
            isUserAsset: true,
            name: 'NEX Token',
            symbol: 'NEX',
          },
        ],
        stubs: {
          'aph-holding': '<div />',
          'aph-icon': '<div />',
        },
      };

      wrapper = utils.mount(AssetTable, ops, state);
    });

    it('the computed property \'filteredHoldings\' should return the correct data', () => {
      console.log(rapper.vm.filteredHoldings);
      expect(wrapper.vm.filteredHoldings).to.eql([]);
    });
  });
});
