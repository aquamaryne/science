import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RoadFundingCalculator from './components/navbar';

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
