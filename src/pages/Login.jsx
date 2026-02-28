import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { TrendingUp, Mail, Lock } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isLoginMode) {
      // GİRİŞ YAPMA MANTIĞI
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else toast.success("Giriş başarılı, yönlendiriliyorsunuz...");
    } else {
      // KAYIT OLMA MANTIĞI
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) toast.error(error.message);
      else toast.success("Kayıt başarılı! Lütfen giriş yapın.");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 px-6 transition-colors duration-300">
      <Toaster position="top-center" />
      
      {/* Logo Alanı */}
      <div className="w-20 h-20 bg-[#0B3B24] dark:bg-[#062616] rounded-3xl flex items-center justify-center shadow-xl mb-8 transform rotate-12">
        <div className="-rotate-12 text-[#84cc16]">
          <TrendingUp size={40} strokeWidth={2.5} />
        </div>
      </div>

      <div className="w-full bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-2xl transition-colors">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 text-center">
          {isLoginMode ? "Tekrar Hoş Geldin!" : "Aramıza Katıl"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8 font-medium">
          Finansal özgürlüğüne giden yolu yönet.
        </p>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {/* E-posta Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail size={20} className="text-gray-400" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresin"
              required
              className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700 border-none rounded-2xl font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#84cc16] transition-all"
            />
          </div>

          {/* Şifre Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={20} className="text-gray-400" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifren"
              required
              minLength={6}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-700 border-none rounded-2xl font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#84cc16] transition-all"
            />
          </div>

          {/* Buton */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-4 py-4 rounded-2xl font-black text-lg transition-all flex justify-center items-center shadow-lg ${
              loading 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-[#0B3B24] dark:bg-[#0a2e1f] text-[#84cc16] hover:scale-[1.02]'
            }`}
          >
            {loading ? "Bekleniyor..." : (isLoginMode ? "Giriş Yap" : "Kayıt Ol")}
          </button>
        </form>

        {/* Mod Değiştirici */}
        <p className="mt-8 text-center text-sm font-bold text-gray-500 dark:text-gray-400">
          {isLoginMode ? "Hesabın yok mu?" : "Zaten üye misin?"}{" "}
          <button 
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-[#84cc16] hover:underline cursor-pointer"
          >
            {isLoginMode ? "Hemen Kaydol" : "Giriş Yap"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;