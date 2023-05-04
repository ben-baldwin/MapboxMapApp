import React from 'react'

const Menu = () => {
  return (
    <div className='absolute top-8 left-8 w-full max-w-lg min-h-[500px] rounded-md bg-white shadow-xl z-10'>
      <label class="relative inline-flex items-center mr-5 cursor-pointer">
        <input type="checkbox" value="" class="sr-only peer" checked></input>
          <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
          <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Camp sites</span>
      </label>
    </div>
  )
}

export default Menu