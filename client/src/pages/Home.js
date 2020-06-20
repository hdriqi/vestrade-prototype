import React, { useEffect, useState } from 'react'
import { useWeb3Context } from '../App.js'
import VestradeERC20Factory from '../contracts/Vestrade_ERC20_Factory.json'
import VestradeERC20 from '../contracts/Vestrade_ERC20.json'
import { Link } from 'react-router-dom'
import { prettyBalance } from '../utils/common'
import { SpinLoader } from 'react-css-loaders'

const Home = () => {
  const useWeb3 = useWeb3Context()
  const [contract, setContract] = useState()
  const [tokenList, setTokenList] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const networkId = await useWeb3.web3.eth.net.getId();
      const deployedNetwork = VestradeERC20Factory.networks[networkId];
      const instance = new useWeb3.web3.eth.Contract(
        VestradeERC20Factory.abi,
        deployedNetwork && deployedNetwork.address,
      )
      setContract(instance)
    }
    init()
  }, [])

  useEffect(() => {
    if (contract) {
      contract.getPastEvents('TokenCreated', {
        fromBlock: 0,
        toBlock: 'latest'
      }, async (error, result) => {
        if (!error) {
          const tokenCreated = result.map(res => res.returnValues)
          const tokenCreatedData = []
          for await (const token of tokenCreated) {
            const tokenContract = new useWeb3.web3.eth.Contract(
              VestradeERC20.abi,
              token.addr
            )
            const name = await tokenContract.methods.name().call()
            const symbol = await tokenContract.methods.symbol().call()
            const totalSupply = await tokenContract.methods.totalSupply().call()
            tokenCreatedData.push({
              addr: token.addr,
              name: name,
              symbol: symbol,
              totalSupply: totalSupply
            })
          }
          const currentList = [...tokenList].concat(tokenCreatedData)
          setTokenList(currentList)
        } else {
          console.log(error);
        }
        setIsLoading(false)
      });
    }
  }, [contract])

  return (
    <div>
      <div className="flex items-center justify-between h-20">
        <h4 className="text-3xl">Token</h4>
        <Link to="/new">
          <button className="bg-primary-1 rounded-md text-white px-3 py-2">New Token</button>
        </Link>
      </div>
      {
        isLoading ? (
          <div className="mt-4 flex justify-center">
            <SpinLoader
              style={{
                margin: 0
              }}
              background="#E2E8F0"
              color="#1B105F"
              size={5}
            />
          </div>
        ) : (
            <div>
              {
                tokenList.length > 0 && (
                  <div className="">
                    <div className="flex items-center justify-between mt-4 px-2 py-4 bg-white" style={{
                      backgroundColor: `#FAFAFA`
                    }}>
                      <div className="w-1/3">
                        <h4 className="font-semibold">Symbol</h4>
                      </div>
                      <div className="w-1/3">
                        <h4 className="font-semibold">Organization Name</h4>
                      </div>
                      <div className="w-1/3 flex justify-end">
                        <h4 className="font-semibold">Total Supply</h4>
                      </div>
                    </div>
                  </div>
                )
              }
              {
                tokenList.map(token => {
                  return (
                    <div className="">
                      <Link to={`/token/${token.addr}`}>
                        <div className="flex items-center justify-between p-2 bg-white">
                          <div className="w-1/3">
                            <h4>{token.symbol}</h4>
                          </div>
                          <div className="w-1/3">
                            <p>{token.name}</p>
                          </div>
                          <div className="w-1/3 flex justify-end">
                            <h4>{prettyBalance(token.totalSupply, token.decimals, 4)}</h4>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )
                })
              }
            </div>
          )
      }

    </div>
  )
}

export default Home