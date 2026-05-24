import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MiniApp from './pages/MiniApp';
import Admin from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/miniapp" element={<MiniApp />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<MiniApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
