import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RoadFundingCalculator from './components/view/block_one_page';
import { SidebarLayout } from './components/sidebar';
import Block2MaintenanceCalculator from './components/view/block_two_page';
import { Block3MultiPageApp }  from './components/view/block_three_page';
import UserManual from '@/components/view/instructions';
import HistoryComponent from './components/view/history';
import { Toaster } from 'sonner';

function App() {
  return (
    <Router>
      {/* ✅ SidebarLayout обгортає Routes */}
      <SidebarLayout>
        <Routes>
          <Route path='/' element={<UserManual />} />
          <Route path='/block_one_page' element={<RoadFundingCalculator />} />
          <Route path='/block_two_page' element={<Block2MaintenanceCalculator />} />
          <Route path='/block_three_page' element={<Block3MultiPageApp />} />
          <Route path='/history' element={<HistoryComponent />} />
        </Routes>
      </SidebarLayout>
      
      {/* ✅ Toaster залишається окремо */}
      <Toaster position="top-right" richColors closeButton />
    </Router>
  )
}

export default App