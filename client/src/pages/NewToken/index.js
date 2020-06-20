import React, { useEffect, useState } from 'react'
import { useWeb3Context } from '../../App.js'
import VestradeERC20Factory from '../../contracts/Vestrade_ERC20_Factory.json'
import VestradeERC20 from '../../contracts/Vestrade_ERC20.json'
import { Link, useHistory } from 'react-router-dom'
import { SpinLoader } from 'react-css-loaders'

const NewTokenPage = () => {
  const useWeb3 = useWeb3Context()
  const [contract, setContract] = useState()
  const [tokenList, setTokenList] = useState([])
  const [newTokenName, setNewTokenName] = useState('')
  const [newTokenSymbol, setNewTokenSymbol] = useState('')
  const [submitStatus, setSubmitStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const history = useHistory()

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
      });
    }
  }, [contract])

  const newToken = async () => {
    setIsSubmitting(true)
    setSubmitStatus('Waiting Approval')
    contract.methods.create(newTokenName, newTokenSymbol.toUpperCase(), 18).send({
      from: useWeb3.accounts[0]
    })
      .once('error', (error) => {
        console.log(error)
        setIsSubmitting(false)
      })
      .once('transactionHash', (transactionHash) => {
        console.log(`tx hash ${transactionHash}`)
        setSubmitStatus(`Creating token ${newTokenSymbol.toUpperCase()}`)
      })
      .once('confirmation', async (confirmationNumber, receipt) => {
        setSubmitStatus(`${newTokenSymbol.toUpperCase()} successfully created!`)
        setTimeout(() => {
          setIsSubmitting(false)
          history.push('/')
        }, 1500)
        // console.log(receipt)
        // const tokenCreated = [receipt.events.TokenCreated.returnValues]
        // const tokenCreatedData = []
        // for await (const token of tokenCreated) {
        //   const tokenContract = new useWeb3.web3.eth.Contract(
        //     VestradeERC20.abi,
        //     token.addr
        //   )
        //   const name = await tokenContract.methods.name().call()
        //   const symbol = await tokenContract.methods.symbol().call()
        //   const totalSupply = await tokenContract.methods.totalSupply().call()
        //   tokenCreatedData.push({
        //     addr: token.addr,
        //     name: name,
        //     symbol: symbol,
        //     totalSupply: totalSupply
        //   })
        // }
        // const currentList = [...tokenList].concat(tokenCreatedData)
        // setTokenList(currentList)
      })
  }

  const _validateSubmit = () => {
    if ((newTokenSymbol.length > 0 && newTokenSymbol.length <= 8) && newTokenName.length > 0) {
      console.log('valid')
      return true
    }
    return false
  }

  const clickOutside = (e) => {
    if (e.target.id === 'new-token-modal') {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {
        isSubmitting && (
          <div id="new-token-modal" onClick={clickOutside} className="fixed inset-0 z-10" style={{
            backgroundColor: `rgba(0,0,0,0.6)`
          }}>
            <div className="mt-24 max-w-sm m-auto bg-white rounded-md p-4 text-center">
              <h3 className="text-xl">{submitStatus}</h3>
              <div className="mt-4 flex justify-center">
                <SpinLoader
                  style={{
                    margin: 0
                  }}
                  color="#1B105F"
                  size={5}
                />
              </div>
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
      <div className="mt-4 max-w-lg m-auto bg-white rounded-md p-4">
        <h3 className="text-xl font-semibold">New Token</h3>
        <p>This process will create new token that will be available on Ethereum blockchain.</p>
        <label className="block mt-4 text-center">Token Symbol</label>
        <input className="w-full mt-1 uppercase text-2xl text-center rounded-md bg-gray-200 px-3 py-2 outline-none" type="text" placeholder="Up to 8 characters" value={newTokenSymbol} onChange={e => setNewTokenSymbol(e.target.value)} autoFocus />
        <label className="block mt-4">Organization Name</label>
        <input className="w-full mt-1 rounded-md bg-gray-200 px-3 py-2 outline-none" type="text" placeholder="Name" value={newTokenName} onChange={e => setNewTokenName(e.target.value)} />
        <label className="block mt-4">Issuer's ETH Address</label>
        <input className="w-full mt-1 rounded-md bg-gray-200 px-3 py-2 outline-none" type="text" placeholder="Name" value={useWeb3 && useWeb3.accounts && useWeb3.accounts[0]} readOnly />
        <button disabled={!_validateSubmit()} className="mt-4 w-full bg-primary-1 rounded-md text-white px-3 py-2" onClick={newToken}>Create</button>
      </div>
    </div>
  )
}

export default NewTokenPage