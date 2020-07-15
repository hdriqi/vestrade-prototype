import ERC20Factory from '../client/src/contracts/Vestrade_ERC20_Factory.json';
import OfferingFactory from '../client/src/contracts/Vestrade_Offering_Factory.json';
import Store from './src/stores/mongodb';
import { Indexer } from './src/index';

const syncTokenCreated = async () => {
  const indexing = {
    events: {
      // event TokenCreated(string name, address addr);
      TokenCreated: {
        keys: ['name', 'addr']
      }
    },
  };
  const store = new Store(indexing, 'mongodb://localhost:27017/eth-indexer');
  const indexer = new Indexer(
    store, 
    ERC20Factory.abi, 
    '0x0631ea5CC1941dD480A5c5D15c1970CDB7Ce7BF3', 
    'http://3.1.72.190:8545'
  );
  await indexer.syncAll({
    fromBlock: 0,
    batchSize: 5,
  });
};

const syncOfferingEvent = async () => {
  const indexing = {
    events: {
      // event OfferingEvent(string name, address addr, address tokenAddr, uint256 supply, uint256 rate, uint64 startDate, uint64 endDate);
      OfferingEvent: {
        keys: ['name', 'addr', 'tokenAddr', 'supply', 'rate', 'startDate', 'endDate']
      }
    },
  };
  const store = new Store(indexing, 'mongodb://localhost:27017/eth-indexer');
  const indexer = new Indexer(
    store, 
    OfferingFactory.abi, 
    '0x4D1191B9068BDA59d024921d490A2aFe8c7b9b8f', 
    'http://3.1.72.190:8545'
  );
  await indexer.syncAll({
    fromBlock: 0,
    batchSize: 5,
  });
};

syncTokenCreated().then(() => {}).catch((error) => { console.error('Fatal error', error); });

syncOfferingEvent().then(() => {}).catch((error) => { console.error('Fatal error', error); });