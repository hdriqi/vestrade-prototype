import React, { useEffect, useState } from "react";
import VestradeOfferingFactory from '../../contracts/Vestrade_Offering_Factory.json'
import VestradeOffering from '../../contracts/Vestrade_Offering.json'
import VestradeERC20 from '../../contracts/Vestrade_ERC20.json'
import {
  useParams, Link,
} from "react-router-dom"
import { useWeb3Context, useAlertContext } from "../../App";
import JSBI from 'jsbi'
import DatePicker from 'react-date-picker'
import { prettyBalance } from '../../utils/common'
import { SpinLoader } from 'react-css-loaders'

const LaunchpadOffering = ({ offering }) => {
  const useWeb3 = useWeb3Context()
  const alert = useAlertContext()

  const [isLoading, setIsLoading] = useState(true)
  const [startStatus, setStartStatus] = useState(false)
  const [showModalBuy, setShowModalBuy] = useState(false)
  const [buyAmount, setBuyAmount] = useState(0)

  useEffect(() => {
    const init = async () => {
      const latestIsStarted = await offering.contract.methods.offeringStatus().call()
      if (latestIsStarted) {
        setStartStatus('confirmed')
      }
      setIsLoading(false)
    }

    if (offering.contract) {
      init()
    }
  }, [])

  const buy = async () => {
    const amount = buyAmount
    const valueInETH = amount / offering.rate

    const tokenContract = new useWeb3.web3.eth.Contract(
      VestradeERC20.abi,
      offering.tokenAddr
    )
    const decimals = await tokenContract.methods.decimals().call()
    const amountPrecision = JSBI.BigInt(amount * 10 ** decimals)
    const value = useWeb3.web3.utils.toWei(valueInETH.toString(), 'ether')

    offering.contract.methods.buy(amountPrecision.toString()).send({
      from: useWeb3.accounts[0],
      value: value
    })
      .once('error', (error) => {
        console.log(error)
      })
      .once('transactionHash', (transactionHash) => {
        console.log(`tx hash ${transactionHash}`)
        alert.setMsg('Transaction success, you will receive token soon')
        alert.setShow(true)
        setShowModalBuy(false)
      })
      .once('confirmation', (confirmationNumber, receipt) => {
        alert.setMsg('You have just receive the token, please check your wallet')
        alert.setShow(true)
      })
  }

  if (isLoading) {
    return null
  }

  const clickOutside = (e) => {
    if (e.target.id === 'new-buy-modal') {
      setShowModalBuy(false)
    }
  }

  return (
    <div>
      {
        showModalBuy && (
          <div id="new-buy-modal" onClick={clickOutside} className="fixed inset-0 z-20" style={{
            backgroundColor: `rgba(0,0,0,0.6)`
          }}>
            <div className="mt-24 max-w-sm m-auto bg-white rounded-md p-4">
              <input className="w-full mt-1 rounded-md bg-gray-200 px-3 py-2 outline-none" autoFocus type="text" value={buyAmount} onChange={e => setBuyAmount(e.target.value)} />
              <p>Total Price {buyAmount / offering.rate} ETH</p>
              <button onClick={_ => buy()} className="mt-4 bg-primary-1 text-white px-3 py-2 rounded-md w-full">BUY</button>
            </div>
          </div>
        )
      }
      <div className={`bg-white py-2`}>
        <div className="flex">
          <div className="w-1/4 overflow-hidden px-2">
            <p className="truncate text-primary-1 font-semibold">{offering.symbol}</p>
          </div>
          <div className="w-1/4 overflow-hidden px-2">
            <p className="truncate text-primary-1 font-semibold">{offering.addr}</p>
          </div>
          <div className="w-1/4 overflow-hidden px-2">
            <p>@{1 / offering.rate} ETH</p>
          </div>
          <div className="w-1/4 px-2 flex justify-end">
            <div className="text-right">
              <p>{prettyBalance(offering.balance, 18, 4)}</p>
              <p>{prettyBalance(offering.supply, 18, 4)}</p>
            </div>
          </div>
        </div>
        <div className="flex mt-2 px-2 items-center justify-between">
          <div>
            <p>Token Address: {offering.tokenAddr}</p>
            <p>Start Date: {new Date(parseInt(offering.startDate)).toLocaleDateString()}</p>
            <p>End Date: {new Date(parseInt(offering.endDate)).toLocaleDateString()}</p>
          </div>
          <button className="w-20 h-8 bg-primary-1 text-white rounded-md px-3 py-1" onClick={_ => setShowModalBuy(true)}>Buy</button>
        </div>
      </div>
    </div>
  )
}

const Launchpad = () => {
  const useWeb3 = useWeb3Context()
  const [contract, setContract] = useState()
  const [offeringList, setOfferingList] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const networkId = await useWeb3.web3.eth.net.getId();
      const deployedNetwork = VestradeOfferingFactory.networks[networkId];
      const instance = new useWeb3.web3.eth.Contract(
        VestradeOfferingFactory.abi,
        deployedNetwork && deployedNetwork.address,
      )
      setContract(instance)
    }
    init()
  }, [])

  useEffect(() => {
    if (contract) {
      contract.getPastEvents('OfferingEvent', {
        fromBlock: 0,
        toBlock: 'latest'
      }, async (error, result) => {
        if (!error) {
          const offeringCreated = result.map(res => res.returnValues)
          const newList = []
          for await (const offering of offeringCreated) {
            const offContract = new useWeb3.web3.eth.Contract(
              VestradeOffering.abi,
              offering.addr
            )
            const tokenContract = new useWeb3.web3.eth.Contract(
              VestradeERC20.abi,
              offering.tokenAddr
            )
            const init = await offContract.methods.init().call()
            const symbol = await tokenContract.methods.symbol().call()
            if (init && new Date().getTime() <= offering.endDate) {
              const balance = await offContract.methods.balance().call()

              newList.push({
                symbol: symbol,
                name: offering.name,
                contract: offContract,
                rate: offering.rate,
                addr: offering.addr,
                tokenAddr: offering.tokenAddr,
                balance: balance,
                startDate: offering.startDate,
                endDate: offering.endDate,
                supply: JSBI.BigInt(offering.supply).toString()
              })
            }
          }
          const currentList = [...offeringList].concat(newList)
          setOfferingList(currentList)
        } else {
          console.log(error);
        }
        setIsLoading(false)
      });
    }
  }, [contract])

  return (
    <div>
      <div className="flex items-center justify-between mt-4">
        <h4 className="text-3xl">Launchpad</h4>
      </div>
      {
        isLoading ? (
          <div className="flex justify-center">
            <SpinLoader
              style={{
                margin: 0
              }}
              color="#1B105F"
              background="#E2E8F0"
              size={5}
            />
          </div>
        ) : (
            <div>
              {
                offeringList.length > 0 && (
                  <div className="">
                    <div className="flex items-center justify-between mt-4 py-4 bg-white" style={{
                      backgroundColor: `#FAFAFA`
                    }}>
                      <div className="w-1/4 px-2">
                        <h4 className="font-semibold">Symbol</h4>
                      </div>
                      <div className="w-1/4 px-2">
                        <h4 className="font-semibold">Contract Address</h4>
                      </div>
                      <div className="w-1/4 px-2">
                        <h4 className="font-semibold">Price</h4>
                      </div>
                      <div className="w-1/4 px-2 flex justify-end">
                        <h4 className="font-semibold">Supply</h4>
                      </div>
                    </div>
                  </div>
                )
              }
              {
                offeringList.map(offering => {
                  return (
                    <LaunchpadOffering offering={offering} />
                  )
                })
              }
            </div>
          )
      }

    </div>
  )
}

export default Launchpad