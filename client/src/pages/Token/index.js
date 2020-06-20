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

const Offering = ({ offering }) => {
  const useWeb3 = useWeb3Context()
  const alert = useAlertContext()
  let { id } = useParams();

  const tokenContract = new useWeb3.web3.eth.Contract(
    VestradeERC20.abi,
    id
  )

  const [isLoading, setIsLoading] = useState(true)
  const [mintTokenStatus, setMintTokenStatus] = useState(null)
  const [startStatus, setStartStatus] = useState(false)
  const [showSetting, setShowSetting] = useState(false)

  useEffect(() => {
    const init = async () => {
      const latestMintStatus = await offering.contract.methods.mintStatus().call()
      const latestIsStarted = await offering.contract.methods.offeringStatus().call()
      if (latestMintStatus) {
        setMintTokenStatus('confirmed')
      }
      if (latestIsStarted) {
        setMintTokenStatus('confirmed')
        setStartStatus('confirmed')
      }
      setIsLoading(false)
    }

    if (offering.contract) {
      init()
    }
  }, [])

  const mintToken = async (offering) => {
    tokenContract.methods.mint(offering.addr, offering.supply).send({
      from: useWeb3.accounts[0]
    })
      .once('error', (error) => {
        console.log(error)
      })
      .once('transactionHash', (transactionHash) => {
        console.log(`tx hash ${transactionHash}`)
        alert.setMsg('Transaction success, minting will begin soon')
        alert.setShow(true)
        setMintTokenStatus('pending')
      })
      .once('confirmation', (confirmationNumber, receipt) => {
        console.log(receipt.events)
        setMintTokenStatus('confirmed')
      })
  }

  const startOffering = async (offering) => {
    await offering.contract.methods.startOffering().send({
      from: useWeb3.accounts[0]
    })
      .once('error', (error) => {
        console.log(error)
      })
      .once('transactionHash', (transactionHash) => {
        console.log(`tx hash ${transactionHash}`)
        alert.setMsg('Transaction success, offering will begin soon')
        alert.setShow(true)
        setStartStatus('pending')
      })
      .once('confirmation', (confirmationNumber, receipt) => {
        console.log(receipt.events)
        setStartStatus('confirmed')
      })
  }

  const MintComponent = () => {
    if (!mintTokenStatus) {
      return <button onClick={_ => mintToken(offering)}>Mint</button>
    }
    else if (mintTokenStatus === 'pending') {
      return <div>Pending</div>
    }
    else if (mintTokenStatus === 'confirmed') {
      return <div>Minted</div>
    }
  }

  const StartedComponent = () => {
    if (!startStatus) {
      return <button disabled={!(mintTokenStatus === 'confirmed')} onClick={_ => startOffering(offering)}>Start</button>
    }
    else if (startStatus === 'pending') {
      return <div>Pending</div>
    }
    else if (startStatus === 'confirmed') {
      return <div>Started</div>
    }
  }

  const buy = async () => {
    const amount = 1000
    const valueInETH = amount / offering.rate

    const tokenContract = new useWeb3.web3.eth.Contract(
      VestradeERC20.abi,
      id
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
        alert('Transaction success, offering will begin soon')
        setStartStatus('pending')
      })
      .once('confirmation', (confirmationNumber, receipt) => {
        console.log(receipt.events)
        setStartStatus('confirmed')
      })
  }

  const clickOutside = (e) => {
    if (e.target.id === 'new-token-modal') {
      setShowSetting(false)
    }
  }

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-center py-2 bg-white">
          <SpinLoader
            style={{
              margin: 0
            }}
            color="#1B105F"
            size={3}
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      {
        showSetting && (
          <div id="new-token-modal" onClick={clickOutside} className="fixed inset-0 z-10" style={{
            backgroundColor: `rgba(0,0,0,0.6)`
          }}>
            <div className="mt-24 max-w-md m-auto bg-white rounded-md p-4">
              <div className="flex justify-between">
                <div className="w-8/12">
                  <p>Step 1</p>
                  <p>Before you can start the offering, you need to mint new token that later will be available for sale.</p>
                </div>
                <div className="w-4/12 flex items-center justify-end">
                  <div>
                    <MintComponent />
                  </div>
                </div>
              </div>
              <div className="pt-4 flex justify-between">
                <div className="w-8/12">
                  <p>Step 2</p>
                  <p>Offering will be online once you click the start button.</p>
                  {/* <p className="text-sm">Note: it can only be buyable in range of start date and end date.</p> */}
                </div>
                <div className="w-4/12 flex items-center justify-end">
                  <div>
                    <StartedComponent />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
      <div onClick={_ => setShowSetting(true)} className={
        `bg-white py-2 ${startStatus !== 'confirmed' && 'opacity-75'}`
      }>
        <div className="flex">
        <div className="w-1/4 overflow-hidden px-2">
            <p className="truncate text-primary-1 font-semibold">{offering.name}</p>
          </div>
          <div className="w-1/4 overflow-hidden px-2">
            <p className="truncate text-primary-1 font-semibold">{offering.addr}</p>
          </div>
          <div className="w-1/4 overflow-hidden px-2">
            <p>@{1 / offering.rate} ETH</p>
          </div>
          <div className="w-1/4 px-2">
            <p>{prettyBalance(offering.balance, 18, 4)}</p>
            <p>{prettyBalance(offering.supply, 18, 4)}</p>
          </div>
        </div>
        {/* <div className="flex px-2">
          <p>{new Date(parseInt(offering.startDate)).toLocaleDateString()} - {new Date(parseInt(offering.endDate)).toLocaleDateString()}</p>
        </div> */}
      </div>
      {/* <button onClick={buy}>Buy</button> */}
    </div>
  )
}

const Token = () => {
  const useWeb3 = useWeb3Context()
  const alert = useAlertContext()
  let { id } = useParams();
  const [contract, setContract] = useState()
  const [offeringList, setOfferingList] = useState([])
  const [showNewOfferingModal, setShowNewOfferingModal] = useState(false)
  const [newOfferingName, setNewOfferingName] = useState('')
  const [newOfferingMint, setNewOfferingMint] = useState('')
  const [newOfferingPrice, setNewOfferingPrice] = useState('')
  const [newOfferingStart, setNewOfferingStart] = useState(new Date())
  const [newOfferingEnd, setNewOfferingEnd] = useState(new Date())
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
            if (offering.tokenAddr === id) {
              const offContract = new useWeb3.web3.eth.Contract(
                VestradeOffering.abi,
                offering.addr
              )
              const balance = await offContract.methods.balance().call()

              newList.push({
                name: offering.name,
                contract: offContract,
                rate: offering.rate,
                addr: offering.addr,
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

  const newOffering = async () => {
    const tokenContract = new useWeb3.web3.eth.Contract(
      VestradeERC20.abi,
      id
    )
    const decimals = await tokenContract.methods.decimals().call()
    const mintValue = JSBI.BigInt(newOfferingMint * 10 ** decimals).toString()

    const oneWei = useWeb3.web3.utils.toWei('1', 'ether')

    const rate = JSBI.divide(JSBI.BigInt(newOfferingPrice * 10 ** decimals), JSBI.BigInt(oneWei))

    contract.methods.create(newOfferingName, id, mintValue, rate.toString(), newOfferingStart.getTime(), newOfferingEnd.getTime()).send({
      from: useWeb3.accounts[0]
    })
      .once('error', (error) => {
        console.log(error)
        setShowNewOfferingModal(false)
      })
      .once('transactionHash', (transactionHash) => {
        console.log(`tx hash ${transactionHash}`)
        alert.setMsg('Transaction success, your offering will be available in soon')
        alert.setShow(true)
        setShowNewOfferingModal(false)
      })
      .once('confirmation', async (confirmationNumber, receipt) => {
        // console.log(receipt)
        console.log(receipt.events)
        const offering = receipt.events.OfferingEvent.returnValues
        const offContract = new useWeb3.web3.eth.Contract(
          VestradeOffering.abi,
          offering.addr
        )
        const balance = await offContract.methods.balance().call()
        const newData = {
          name: offering.name,
          contract: offContract,
          rate: offering.rate,
          addr: offering.addr,
          balance: balance,
          startDate: offering.startDate,
          endDate: offering.endDate,
          supply: JSBI.BigInt(offering.supply).toString()
        }
        const currentList = [...offeringList].concat([newData])
        setOfferingList(currentList)
        setShowNewOfferingModal(false)
      })
  }

  const clickOutside = (e) => {
    if (e.target.id === 'new-token-modal') {
      setShowNewOfferingModal(false)
    }
  }

  return (
    <div>
      {
        showNewOfferingModal && (
          <div id="new-token-modal" onClick={clickOutside} className="fixed inset-0 z-10" style={{
            backgroundColor: `rgba(0,0,0,0.6)`
          }}>
            <div className="mt-24 max-w-sm m-auto bg-white rounded-md p-4">
              <label className="block">Name</label>
              <input className="mt-1 w-full rounded-md bg-gray-200 px-3 py-2 outline-none" type="text" placeholder="Name" value={newOfferingName} onChange={e => setNewOfferingName(e.target.value)} />
              <label className="block mt-4">Supply</label>
              <input className="mt-1 w-full rounded-md bg-gray-200 px-3 py-2 outline-none" type="text" placeholder="Supply" value={newOfferingMint} onChange={e => setNewOfferingMint(e.target.value)} />
              <label className="block mt-4">Token per ETH</label>
              <input className="mt-1 w-full rounded-md bg-gray-200 px-3 py-2 outline-none" type="text"
                placeholder="Price" value={newOfferingPrice} onChange={e => setNewOfferingPrice(e.target.value)} />
              <div className="flex items-center justify-between">
                <div>
                  <label className="block mt-4">Start Date</label>
                  <DatePicker
                    onChange={setNewOfferingStart}
                    value={newOfferingStart}
                    minDate={new Date()}
                  />
                </div>
                <div>
                  <label className="block mt-4">End Date</label>
                  <DatePicker
                    onChange={setNewOfferingEnd}
                    value={newOfferingEnd}
                    minDate={newOfferingStart}
                  />
                </div>
              </div>
              <button className="mt-4 w-full bg-primary-1 rounded-md text-white px-3 py-2" onClick={newOffering}>New Offering</button>
            </div>
          </div>
        )
      }
      <div className="inline-block">
        <Link to="/">
          <div className="flex items-center h-20">
            <svg className="mr-2" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M6.41412 13L12.707 19.2929L11.2928 20.7071L2.58569 12L11.2928 3.29289L12.707 4.70711L6.41412 11H20.9999V13H6.41412Z" fill="black" />
            </svg>
            <h4>Home</h4>
          </div>
        </Link>
      </div>
      <div className="flex items-center justify-between mt-4">
        <h4 className="text-3xl">Offering</h4>
        <button className="bg-primary-1 px-3 py-2 text-white rounded-md" onClick={_ => setShowNewOfferingModal(true)}>New Offering</button>
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
                        <h4 className="font-semibold">Name</h4>
                      </div>
                      <div className="w-1/4 px-2">
                        <h4 className="font-semibold">Address</h4>
                      </div>
                      <div className="w-1/4 px-2">
                        <h4 className="font-semibold">Price</h4>
                      </div>
                      <div className="w-1/4 px-2">
                        <h4 className="font-semibold">Supply</h4>
                      </div>
                    </div>
                  </div>
                )
              }
              {
                offeringList.map(offering => {
                  return (
                    <Offering offering={offering} />
                  )
                })
              }
            </div>
          )
      }

    </div>
  )
}

export default Token