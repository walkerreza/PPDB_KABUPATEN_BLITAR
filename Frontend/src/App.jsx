import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-8">
      <div className="container mx-auto flex flex-col items-center">
        <div className="grid grid-cols-2 gap-12 mb-12 w-full max-w-4xl">
          <div className="flex justify-center items-center">
            <a href="https://vite.dev" target="_blank" className="hover:scale-110 transition-transform">
              <img src={viteLogo} className="h-32 w-32" alt="Vite logo" />
            </a>
          </div>
          <div className="flex justify-center items-center">
            <a href="https://react.dev" target="_blank" className="hover:scale-110 transition-transform">
              <img src={reactLogo} className="h-32 w-32" alt="React logo" />
            </a>
          </div>
        </div>
        <h1 className="text-5xl font-bold text-white mb-12 text-center">Vite + React</h1>
        <div className="bg-white rounded-xl shadow-2xl p-12 w-full max-w-4xl">
          <div className="flex flex-col items-center justify-center">
            <button 
              onClick={() => setCount((count) => count + 1)}
              className="bg-indigo-500 text-white text-lg px-8 py-3 rounded-full hover:bg-indigo-600 transition-colors mb-6"
            >
              Count is {count}
            </button>
            <p className="text-gray-600 text-lg">
              Edit <code className="bg-gray-100 px-3 py-1 rounded-lg">src/App.jsx</code> and save to test HMR
            </p>
          </div>
        </div>
        <p className="text-white mt-12 text-center text-lg hover:text-indigo-200 transition-colors">
          Click on the Vite and React logos to learn more
        </p>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  )
}

export default App
