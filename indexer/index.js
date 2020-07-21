import ERC20Factory from '../client/src/contracts/Vestrade_ERC20_Factory.json';
import OfferingFactory from '../client/src/contracts/Vestrade_Offering_Factory.json';
import Offering from '../client/src/contracts/Vestrade_Offering.json';
import IndexerStore from './src/stores/mongodb';
import { Indexer } from './src/index';
import { MongoClient } from 'mongodb';
import BigNumber from 'bignumber.js'

const MONGODB_URL = 'mongodb://localhost:27017/eth-indexer'
const ETH_NODE_URL = 'http://3.1.72.190:8545'

const syncTokenCreated = async (store) => {
  const indexing = {
    events: {
      // event TokenCreated(string name, address addr);
      TokenCreated: {
        keys: ['name', 'addr']
      }
    },
    contractAddress: '0xFbcA95f79905D2245e38EB3a11Ab117e1689B14C'
  };
  const indexerStore = new IndexerStore(indexing, MONGODB_URL);
  const indexer = new Indexer(
    indexerStore,
    ERC20Factory.abi,
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
          if (event.event === 'TokenCreated') {
            await store.db('vestrade').collection('tokenDetail').findOneAndUpdate({
              tokenAddr: event.args.addr
            }, {
              $set: {
                tokenAddr: event.args.addr,
                name: event.args.name,
                symbol: event.args.symbol
              }
            }, {
              upsert: true
            })
          }
        }
      }
    }
  });
};

const newBuyEvent = async (offeringAddr, store) => {
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
    const indexerStore = new IndexerStore(indexing, MONGODB_URL);
    const indexer = new Indexer(
      indexerStore,
      Offering.abi,
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
            if (event.event === 'Buy') {
              try {
                // keys: ['addr', 'tokenAddr', 'amount', 'timestamp']
                await store.db('vestrade').collection('transaction').findOneAndUpdate({
                  txId: event.transactionHash
                }, {
                  $set: {
                    tokenAddr: event.args.tokenAddr,
                    fromAddr: event.args.addr,
                    amount: event.args.amount,
                    timestamp: event.args.timestamp,
                  }
                }, {
                  upsert: true
                })
              } catch (err) {
                console.log(err)
              }
            }
          }
        }
      }
    });
  }
}

const syncOfferingEvent = async (store) => {
  const indexing = {
    events: {
      // event OfferingEvent(string name, address addr, address tokenAddr, uint256 supply, uint256 rate, uint64 startDate, uint64 endDate);
      OfferingEvent: {
        keys: ['name', 'addr', 'tokenAddr', 'supply', 'rate', 'startDate', 'endDate']
      }
    },
    contractAddress: '0x12113E6b3643184976EE4d71760CFdBbA3Cac811'
  };
  const indexerStore = new IndexerStore(indexing, MONGODB_URL);
  const indexer = new Indexer(
    indexerStore,
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
          if (event.event === 'OfferingEvent') {
            try {
              await newBuyEvent(event.args.addr, store)
              // keys: ['name', 'addr', 'tokenAddr', 'supply', 'rate', 'startDate', 'endDate']
              await store.db('vestrade').collection('offering').findOneAndUpdate({
                tokenAddr: event.args.tokenAddr
              }, {
                $set: {
                  name: event.args.name,
                  tokenAddr: event.args.addr,
                  supply: event.args.supply,
                  rate: event.args.rate,
                  startDate: event.args.startDate,
                  endDate: event.args.endDate,
                }
              }, {
                upsert: true
              })
            } catch (err) {
              console.log(err)
            }
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
    await newBuyEvent(offeringAddr, client)
  }

  syncTokenCreated(client).then(() => { }).catch((error) => { console.error('Fatal error', error); });
  syncOfferingEvent(client).then(() => { }).catch((error) => { console.error('Fatal error', error); });
}

main()