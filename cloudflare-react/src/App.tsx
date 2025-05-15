import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RoadFundingCalculator from './components/page/block_one_page';

function App() {

  return (
      <Router>
        <Routes>
          <Route path='/' element={ <RoadFundingCalculator />} />
        </Routes>
      </Router>
  )
}

export default App
