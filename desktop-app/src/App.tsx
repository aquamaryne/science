import Navbar from './components/navbar';
import { BrowserRouter as Router, Routes, Route, HashRouter } from 'react-router-dom';
import Instructions from './components/instructions';
import RoadFinanceCalculator from './pages/page4.';
import PageFive from './pages/page5';
import RoadFundingCalculator from './pages/page3';

function App() {
  return (
    <HashRouter>
      <Navbar />
      <Routes>
        <Route path='/' element={<Instructions />} />
        <Route path='/pages/page_three' element={<RoadFundingCalculator />} />
        <Route path='/pages/page_four' element={<RoadFinanceCalculator />} />
        <Route path='/pages/page_five' element={<PageFive />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
