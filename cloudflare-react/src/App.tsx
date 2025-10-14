import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RoadFundingCalculator from './components/view/block_one_page';
import { Sidebar } from './components/sidebar';
import Block2MaintenanceCalculator from './components/view/block_two_page';
import { Block3MultiPageApp }  from './components/view/block_three_page';
// import Instructions from '@/components/View/instructions';
import { Provider } from 'react-redux';
import { store } from '@/store/store';

function App() {

  return (
    <Provider store={store}>
      <Router>
        <div className="flex">
          <Sidebar />
          <main className='flex-1 p-6'>
            <Routes>
              {/* <Route path='/' element={ <Instructions />} /> */}
              <Route path='/block_one_page' element={ <RoadFundingCalculator />} />
              <Route path='/block_two_page' element={ <Block2MaintenanceCalculator />} />
              <Route path='/block_three_page' element={<Block3MultiPageApp />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Provider>
  )
}

export default App
