import dotenv from 'dotenv'
import ERC20Factory from '../client/src/contracts/Vestrade_ERC20_Factory.json';
import OfferingFactory from '../client/src/contracts/Vestrade_Offering_Factory.json';
import Offering from '../client/src/contracts/Vestrade_Offering.json';
import IndexerStore from './src/stores/mongodb';
import { Indexer } from './src/index';
import { MongoClient } from 'mongodb';
import BigNumber from 'bignumber.js'

dotenv.config()

const MONGODB_URL = process.env.MONGODB_URL
const ETH_NODE_URL = 'http://54.151.159.36:8545'
const VestradeERC20FactoryAddr = `0x38FFD2039F846FE395Ab905a9a8A5e267A5E75d0`
const VestradeOfferingFactoryAddr = `0xfe311ee935519cD9538d664B3CbdDAb201103660`

const syncTokenCreated = async (store) => {
  const indexing = {
    events: {
      // event TokenCreated(string name, address addr);
      TokenCreated: {
        keys: ['name', 'addr']
      }
    },
    contractAddress: VestradeERC20FactoryAddr
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
        // event Buy(address addr, address tokenAddr, uint256 tokens, uint256 amount, uint256 timestamp);
        Buy: {
          keys: ['addr', 'tokenAddr', 'tokens', 'amount', 'timestamp']
        },
        Active: {
          keys: ['addr', 'timestamp']
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
                    offeringAddr: offeringAddr,
                    tokenAddr: event.args.tokenAddr,
                    fromAddr: event.args.from,
                    tokens: new BigNumber(event.args.tokens.value).toString(10),
                    amount: new BigNumber(event.args.amount.value).toString(10),
                    timestamp: new BigNumber(event.args.timestamp.value).toString(10),
                  }
                }, {
                  upsert: true
                })
              } catch (err) {
                console.log(err)
              }
            }
            if (event.event === 'Active') {
              try {
                await store.db('vestrade').collection('offering').findOneAndUpdate({
                  addr: event.args.addr
                }, {
                  $set: {
                    isActive: true,
                    timestamp: new BigNumber(event.args.timestamp.value).toString(10),
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
    contractAddress: VestradeOfferingFactoryAddr
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
                addr: event.args.addr
              }, {
                $set: {
                  addr: event.args.addr,
                  name: event.args.name,
                  tokenAddr: event.args.tokenAddr,
                  supply: new BigNumber(event.args.supply.value).toString(10),
                  rate: new BigNumber(event.args.rate.value).toString(10),
                  startDate: new BigNumber(event.args.startDate.value).toString(10),
                  endDate: new BigNumber(event.args.endDate.value).toString(10),
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