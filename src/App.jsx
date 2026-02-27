import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import YeniKayit from './pages/YeniKayit';
import Islemler from './pages/Islemler'; 
import Yatirimlar from './pages/Yatirimlar';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/yeni-kayit" element={<YeniKayit />} />
        <Route path="/islemler" element={<Islemler />} /> {/* YENİ YOLUMUZ */}
        <Route path="/yatirimlar" element={<Yatirimlar />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;