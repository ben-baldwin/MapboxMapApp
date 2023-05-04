import React from 'react'

const BasemapButton = ({buttonText, layerParameter, submitFunction}) => {

    return (
      <button className='border rounded-md p-1 bg-slate-400 active:accent-gray-800' value={layerParameter} onClick={submitFunction}>{buttonText}</button>
    )
  }

export default BasemapButton