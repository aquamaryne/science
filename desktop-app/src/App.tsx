import Navbar from './components/navbar';
import { BrowserRouter as Router, Routes, Route, HashRouter } from 'react-router-dom';
import PageThree from './pages/pagr1';
import Instructions from './components/instructions';
import RoadFinanceCalculator from './pages/page4.';
import PageFive from './pages/page5';
import RoadFundingCalculator from './pages/test';

function App() {
  return (
    <HashRouter>
      <Navbar />
      <Routes>
        <Route path='/' element={<Instructions />} />
        <Route path='/pages/page_three' element={<PageThree />} />
        <Route path='/pages/page_four' element={<RoadFinanceCalculator />} />
        <Route path='/pages/page_five' element={<PageFive />} />
        <Route path='/pages/test' element={<RoadFundingCalculator />}/>
      </Routes>
    </HashRouter>
  );
}

export default App;
