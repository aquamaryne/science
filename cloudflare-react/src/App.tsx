import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RoadFundingCalculator from './components/view/block_one_page';
import { Sidebar } from './components/sidebar';
// import Instructions from './components/page/instructions';

function App() {

  return (
      <Router>
        <div className="flex">
          <Sidebar />
          <main className='flex-1 p-6'>
            <Routes>
              {/* <Route path='/' element={ <Instructions />} /> */}
              <Route path='/block_one_page' element={ <RoadFundingCalculator />} />
            </Routes>
          </main>
        </div>
      </Router>
  )
}

export default App
