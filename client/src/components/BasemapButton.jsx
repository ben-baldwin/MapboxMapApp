import React from 'react'
const BasemapButton = ({ buttonText, layerParameter, submitFunction, img }) => {

  return (
    <div className='w-full text-lime-200 text-center text-xs md:text-lg'>
      <button className='border border-lime-200 p-1 rounded-md bg-gradient-to-l hover:from-teal-200 hover:to-lime-200' onClick={() => submitFunction(layerParameter)} id={layerParameter}><img className='rounded-md' src={img} alt="Base Map" /></button>
      <p>{buttonText}</p>
    </div>
    // <button className='border rounded-md bg-lime-200 active:accent-gray-800 h-16 w-16' value={layerParameter} img={img} onClick={submitFunction}>{buttonText}</button>
  )
}

export default BasemapButton