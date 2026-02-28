import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; 

// YENİ: Global beynimizi import ediyoruz
import { SettingsProvider } from './SettingsContext';

// Sayfalar
import Dashboard from './Pages/Dashboard'; 
import Islemler from './Pages/Islemler';
import YeniKayit from './Pages/YeniKayit';
import Cuzdanlar from './pages/Card';
import Profile from './pages/Profile'; 
import Login from './pages/Login'; 

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] dark:bg-gray-900 flex items-center justify-center flex-col gap-4 transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-[#84cc16] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-[#0B3B24] dark:text-[#84cc16]">Sistem Yükleniyor...</p>
      </div>
    );
  }

  return (
    // YENİ: Tüm uygulamayı SettingsProvider içine aldık!
    <SettingsProvider>
      <Router>
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={session ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/islemler" element={session ? <Islemler /> : <Navigate to="/login" />} />
          <Route path="/yeni-kayit" element={session ? <YeniKayit /> : <Navigate to="/login" />} />
          <Route path="/cuzdanlar" element={session ? <Cuzdanlar /> : <Navigate to="/login" />} />
          <Route path="/profile" element={session ? <Profile /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </SettingsProvider>
  );
}

export default App;