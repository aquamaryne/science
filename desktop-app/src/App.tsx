import Navbar from './components/navbar';
import { BrowserRouter as Router, Routes, Route, HashRouter } from 'react-router-dom';
import PageThree from './pages/pagr1';
import Instructions from './components/instructions';

function App() {
  return (
    <HashRouter>
      <Navbar />
      <Routes>
        <Route path='/' element={<Instructions />} />
        <Route path='/pages/page_three' element={<PageThree />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
