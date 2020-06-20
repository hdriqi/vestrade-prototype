import React, { useEffect, useState, createContext, useContext } from "react"
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom"
import getWeb3 from "./getWeb3"

import Home from './pages/Home'
import Token from "./pages/Token"
import NewToken from "./pages/NewToken"
import Alert from "./components/Alert"
import Launchpad from "./pages/Launchpad"

export const Web3Context = createContext()
export const useWeb3Context = () => useContext(Web3Context)
export const AlertContext = createContext()
export const useAlertContext = () => useContext(AlertContext)

const App = () => {
  const [web3, setWeb3] = useState(null)
  const [accounts, setAccounts] = useState(null)

  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        // Get network provider and web3 instance.
        const web3 = await getWeb3();
        web3.eth.handleRevert = true

        // Use web3 to get the user's accounts.
        const accounts = await web3.eth.getAccounts();

        setWeb3(web3)
        setAccounts(accounts)
      } catch (error) {
        // Catch any errors for any of the above operations.
        alert(
          `Failed to load web3, accounts, or contract. Check console for details.`,
        );
        console.error(error);
      }
    }
    init()
  }, [])

  if (!web3) {
    return <div>Loading Web3, accounts, and contract...</div>;
  }

  const value = { web3, accounts }
  const alertValue = {
    show: showAlert,
    setShow: setShowAlert,
    msg: alertMessage,
    setMsg: setAlertMessage
  }

  return (
    <Web3Context.Provider value={value}>
      <AlertContext.Provider value={alertValue}>
        <Alert show={showAlert} setShow={setShowAlert} msg={alertMessage} />
        <Router>
          <div className="max-w-xl m-auto">
            <Switch>
              <Route exact path="/">
                <Home />
              </Route>
              <Route exact path="/new">
                <NewToken />
              </Route>
              <Route exact path="/launchpad">
                <Launchpad />
              </Route>
              <Route path="/token/:id">
                <Token />
              </Route>
            </Switch>
          </div>
        </Router>
      </AlertContext.Provider>
    </Web3Context.Provider>
  )
}

export default App;
