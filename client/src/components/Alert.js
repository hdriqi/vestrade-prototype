import React from 'react'

const Alert = ({ show, setShow, msg }) => {
  const clickOutside = (e) => {
    if (e.target.id === 'new-token-modal') {
      setShow(false)
    }
  }

  return (
    <div>
      {
        show && (
          <div id="new-alert" onClick={clickOutside} className="fixed inset-0 z-20" style={{
            backgroundColor: `rgba(0,0,0,0.6)`
          }}>
            <div className="mt-24 max-w-sm m-auto bg-white rounded-md p-4">
              <p className="text-lg text-center">
                {msg}
              </p>
              <button onClick={_ => setShow(false)} className="mt-4 bg-primary-1 text-white px-3 py-2 rounded-md w-full">OK</button>
            </div>
          </div>
        )
      }
    </div>
  )
}

export default Alert