import Navbar from './components/navbar';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PageThree from './pages/page_three';
import Instructions from './components/instructions';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path='/' element={<Instructions />} />
        <Route path='/pages/page_three' element={<PageThree />} />
      </Routes>
    </Router>
  );
}

export default App;
