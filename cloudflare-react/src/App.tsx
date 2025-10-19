import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RoadFundingCalculator from './components/view/block_one_page';
import { Sidebar } from './components/sidebar';
import Block2MaintenanceCalculator from './components/view/block_two_page';
import { Block3MultiPageApp }  from './components/view/block_three_page';
import UserManual from '@/components/view/instructions';
import HistoryComponent from './components/view/history';

function App() {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <main className='flex-1 ml-80 p-6 min-h-screen'>
           <Routes>
             <Route path='/' element={ <UserManual />} />
             <Route path='/block_one_page' element={ <RoadFundingCalculator />} />
             <Route path='/block_two_page' element={ <Block2MaintenanceCalculator />} />
             <Route path='/block_three_page' element={<Block3MultiPageApp />} />
             <Route path='/history' element={<HistoryComponent />} />
           </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
