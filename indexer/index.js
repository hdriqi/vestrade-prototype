import ERC20Factory from '../client/src/contracts/Vestrade_ERC20_Factory.json';
import OfferingFactory from '../client/src/contracts/Vestrade_Offering_Factory.json';
import Offering from '../client/src/contracts/Vestrade_Offering.json';
import Store from './src/stores/mongodb';
import { Indexer } from './src/index';
import { MongoClient } from 'mongodb';

const MONGODB_URL = 'mongodb://localhost:27017/eth-indexer'
const ETH_NODE_URL = 'http://3.1.72.190:8545'

const syncTokenCreated = async () => {
  const indexing = {
    events: {
      // event TokenCreated(string name, address addr);
      TokenCreated: {
        keys: ['name', 'addr']
      }
    },
    contractAddress: '0x0631ea5CC1941dD480A5c5D15c1970CDB7Ce7BF3'
  };
  const store = new Store(indexing, MONGODB_URL);
  const indexer = new Indexer(
    store,
    ERC20Factory.abi,
    indexing.contractAddress,
    ETH_NODE_URL
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
    contractAddress: '0x4D1191B9068BDA59d024921d490A2aFe8c7b9b8f'
  };
  const store = new Store(indexing, MONGODB_URL);
  const indexer = new Indexer(
    store,
    OfferingFactory.abi,
    indexing.contractAddress,
    ETH_NODE_URL
  );
  await indexer.syncAll({
    fromBlock: 0,
    batchSize: 5,
  }, {
    afterBlock: async (events) => {
      if (events.length > 0) {
        for (const event of events) {
          const offeringAddr = event.args.addr
          if (offeringAddr) {
            const indexing = {
              events: {
                // event Buy(address addr, address token, uint256 amount, uint256 timestamp);
                Buy: {
                  keys: ['addr', 'tokenAddr', 'amount', 'timestamp']
                }
              },
              contractAddress: offeringAddr
            };
            const store = new Store(indexing, MONGODB_URL);
            const indexer = new Indexer(
              store,
              Offering.abi,
              indexing.contractAddress,
              ETH_NODE_URL
            );
            await indexer.syncAll({
              fromBlock: 0,
              batchSize: 5,
            });
          }
        }
      }
    }
  });
};

const main = async () => {
  const client = await MongoClient.connect(MONGODB_URL, { 
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  const offeringList = await client.db('eth-indexer').collection('OfferingEvent').find()
  const list = await offeringList.toArray()
  const offeringAddrList = list.map(off => off.args.addr)

  for (const offeringAddr of offeringAddrList) {
    if (offeringAddr) {
      const indexing = {
        events: {
          // event Buy(address addr, address token, uint256 amount, uint256 timestamp);
          Buy: {
            keys: ['addr', 'tokenAddr', 'amount', 'timestamp']
          }
        },
        contractAddress: offeringAddr
      };
      const store = new Store(indexing, MONGODB_URL);
      const indexer = new Indexer(
        store,
        Offering.abi,
        indexing.contractAddress,
        ETH_NODE_URL
      );
      await indexer.syncAll({
        fromBlock: 0,
        batchSize: 5,
      });
    }
  }

  syncTokenCreated().then(() => { }).catch((error) => { console.error('Fatal error', error); });
  syncOfferingEvent().then(() => {}).catch((error) => { console.error('Fatal error', error); });  
}

main()