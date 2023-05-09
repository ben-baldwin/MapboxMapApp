import React from 'react'
const BasemapButton = ({ buttonText, layerParameter, submitFunction, img }) => {

  return (
    <div className='border border-lime-200 p-1 rounded-md bg-gradient-to-l hover:from-teal-200 hover:to-lime-200 h-20 w-20'>
      <button className='w-full h-full' onClick={() => submitFunction(layerParameter)} id={layerParameter}><img className='w-full h-full rounded-md' src={img} alt="Base Map" /></button>
      <p className='text-lime-200 text-center text-sm'>{buttonText}</p>
    </div>
    // <button className='border rounded-md bg-lime-200 active:accent-gray-800 h-16 w-16' value={layerParameter} img={img} onClick={submitFunction}>{buttonText}</button>
  )
}

export default BasemapButton