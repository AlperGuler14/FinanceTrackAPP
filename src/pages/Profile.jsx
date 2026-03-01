import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Home, Wallet, TrendingUp, CreditCard, User, LogOut, Settings, Shield, Bell, Moon, Sun, ChevronRight, Crown, Download, Edit2, Lock, Globe, DollarSign, Camera, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast, { Toaster } from 'react-hot-toast';
import { useSettings } from '../SettingsContext'; 

const DICTIONARY = {
  TR: {
    title: "Profilim", freePlan: "Ücretsiz Plan", unlimited: "Finansal sınırları kaldır.", goVip: "VIP'ye Geç",
    appSettings: "Uygulama Ayarları", security: "Güvenlik ve Şifre", darkMode: "Karanlık Tema",
    notifications: "Bildirimler", download: "Verilerimi İndir", logout: "Güvenli Çıkış Yap",
    editProfile: "Profili Düzenle", namePlaceholder: "Adınız", cancel: "İptal", save: "Kaydet",
    apply: "Uygula", currency: "Para Birimi", language: "Uygulama Dili", passwordTitle: "Şifre Değiştir",
    passwordDesc: "Güvenliğiniz için önce mevcut şifrenizi girin.", oldPass: "Mevcut Şifre",
    newPass: "Yeni Şifre (En az 6 karakter)", wrongOld: "Mevcut şifreniz yanlış!", passSuccess: "Şifreniz başarıyla güncellendi!",
    photoUpdated: "Fotoğraf güncellendi!", uploading: "Yükleniyor..."
  },
  EN: {
    title: "My Profile", freePlan: "Free Plan", unlimited: "Remove financial limits.", goVip: "Upgrade to VIP",
    appSettings: "App Settings", security: "Security & Password", darkMode: "Dark Mode",
    notifications: "Notifications", download: "Download My Data", logout: "Secure Logout",
    editProfile: "Edit Profile", namePlaceholder: "Your Name", cancel: "Cancel", save: "Save",
    apply: "Apply", currency: "Currency", language: "App Language", passwordTitle: "Change Password",
    passwordDesc: "Enter your current password for security.", oldPass: "Current Password",
    newPass: "New Password (Min 6 chars)", wrongOld: "Current password is wrong!", passSuccess: "Password updated successfully!",
    photoUpdated: "Photo updated!", uploading: "Uploading..."
  }
};

function Profile() {
  const navigate = useNavigate();
  const { currency, setCurrency, language, setLanguage } = useSettings();
  const t = DICTIONARY[language] || DICTIONARY.TR;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [userEmail, setUserEmail] = useState("Yükleniyor...");
  const [userName, setUserName] = useState("Alper"); 
  const [avatarUrl, setAvatarUrl] = useState(null); // Profil fotoğrafı
  
  const [isEditModalAcik, setIsEditModalAcik] = useState(false);
  const [yeniAd, setYeniAd] = useState(userName);
  
  const [isPasswordModalAcik, setIsPasswordModalAcik] = useState(false);
  const [eskiSifre, setEskiSifre] = useState("");
  const [yeniSifre, setYeniSifre] = useState("");

  const [isAyarlarModalAcik, setIsAyarlarModalAcik] = useState(false);
  const [tempCurrency, setTempCurrency] = useState(currency);
  const [tempLanguage, setTempLanguage] = useState(language);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [isDarkMode]);

  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        // Supabase user_metadata içinden kayıtlı avatarı çekiyoruz
        if (user.user_metadata?.avatar_url) {
          setAvatarUrl(user.user_metadata.avatar_url);
        }
      }
    };
    getUserInfo();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleProfilGuncelle = () => {
    setUserName(yeniAd);
    setIsEditModalAcik(false);
    toast.success(t.save + "!");
  };

  // --- GÜÇLENDİRİLMİŞ ŞİFRE DEĞİŞTİRME MANTIĞI ---
  const handleSifreGuncelle = async () => {
    if (!eskiSifre) return toast.error(t.oldPass + "!");
    if (yeniSifre.length < 6) return toast.error(language === 'TR' ? "En az 6 karakter!" : "Min 6 characters!");
    
    setLoading(true);

    // 1. Adım: Eski şifrenin doğru olup olmadığını test et (Yeniden giriş yaparak)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: eskiSifre,
    });

    if (signInError) {
      setLoading(false);
      return toast.error(t.wrongOld);
    }

    // 2. Adım: Eski şifre doğruysa, yeni şifreyi ayarla
    const { error: updateError } = await supabase.auth.updateUser({ password: yeniSifre });
    
    if (updateError) {
      toast.error(updateError.message);
    } else {
      toast.success(t.passSuccess);
      setIsPasswordModalAcik(false);
      setEskiSifre("");
      setYeniSifre("");
    }
    setLoading(false);
  };

// --- OPTİMİZE EDİLMİŞ FOTOĞRAF YÜKLEME MANTIĞI ---
  const handleAvatarUpload = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error(language === 'TR' ? 'Lütfen bir resim seçin.' : 'Please select an image.');
      }

      const file = event.target.files[0];

      // GÜVENLİK 1: Dosya boyutu kontrolü (Max 2 MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error(language === 'TR' ? 'Fotoğraf boyutu 2MB dan küçük olmalı!' : 'Image must be less than 2MB!');
      }

      // GÜVENLİK 2: Kullanıcı bilgisini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı!");

      // GÜVENLİK 3: Dosya adını kullanıcının ID'si yap (Böylece hep eskisinin üzerine yazar, çöp birikmez)
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`; // Örn: 12345-abcde/avatar.jpg

      // UPSERT: TRUE -> Aynı isimde dosya varsa üzerine yaz!
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, cacheControl: '3600' });

      if (uploadError) {
        throw uploadError;
      }

      // Yüklenen resmin genel (public) linkini al (Sonuna zaman damgası ekliyoruz ki tarayıcı yeni resmi anında görsün)
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const urlWithTime = `${publicUrl}?t=${Date.now()}`;

      // Linki kullanıcının metadata'sına kaydet
      await supabase.auth.updateUser({ data: { avatar_url: urlWithTime } });
      
      setAvatarUrl(urlWithTime);
      toast.success(t.photoUpdated);

    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };
  

  const handleAyarlarKaydet = () => {
    setCurrency(tempCurrency);
    setLanguage(tempLanguage);
    setIsAyarlarModalAcik(false);
    toast.success(t.apply + "!");
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans transition-colors duration-300 pb-24">
      <Toaster position="top-center" />
      
      <header className="px-6 py-5 bg-white dark:bg-gray-800 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10 transition-colors">
        <Link to="/" className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors -ml-2">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="font-bold text-gray-900 dark:text-white text-lg tracking-wide">{t.title}</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-6">
        
        {/* KULLANICI KARTI (FOTOĞRAF YÜKLEME ALANI) */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors relative overflow-hidden">
          <div className="flex items-center gap-4 z-10">
            {/* Fotoğraf Alanı */}
            <div className="relative group">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 shadow-inner flex items-center justify-center border-2 border-white dark:border-gray-600 overflow-hidden shrink-0">
                {uploading ? (
                  <Loader2 className="animate-spin text-gray-400" size={24} />
                ) : (
                  <img src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="Profile" className="w-full h-full object-cover" />
                )}
              </div>
              
              {/* Üzerine Gelince Çıkan Kamera İkonu (Tıklanabilir) */}
              <button 
                onClick={() => fileInputRef.current.click()}
                disabled={uploading}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera size={20} className="text-white" />
              </button>
              
              {/* Gizli Dosya Yükleme Inputu */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">{userName}</h2>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{userEmail}</p>
            </div>
          </div>
          <button onClick={() => setIsEditModalAcik(true)} className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors z-10">
            <Edit2 size={18} />
          </button>
        </div>

        {/* VIP KARTI */}
        <div className="bg-gradient-to-r from-amber-200 via-yellow-400 to-orange-400 rounded-3xl p-1 shadow-lg transform transition-transform hover:scale-[1.02] cursor-pointer">
          <div className="bg-gray-900 rounded-[1.35rem] p-5 relative overflow-hidden h-full flex items-center justify-between">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-yellow-400 opacity-20 blur-3xl rounded-full"></div>
            <div className="z-10">
              <div className="flex items-center gap-2 mb-1">
                <Crown size={18} className="text-yellow-400" />
                <span className="text-xs font-black uppercase tracking-widest text-yellow-400">{t.freePlan}</span>
              </div>
              <p className="text-white font-bold text-sm">{t.unlimited}</p>
            </div>
            <button className="z-10 bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 text-xs font-black px-4 py-2.5 rounded-xl shadow-md">
              {t.goVip}
            </button>
          </div>
        </div>

        {/* AYARLAR MENÜSÜ */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
          <div onClick={() => setIsAyarlarModalAcik(true)} className="p-4 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center transition-colors"><Settings size={20} /></div>
              <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{t.appSettings}</span>
            </div>
            <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
          </div>

          <div onClick={() => setIsPasswordModalAcik(true)} className="p-4 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center transition-colors"><Shield size={20} /></div>
              <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{t.security}</span>
            </div>
            <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
          </div>

          <div onClick={() => setIsDarkMode(!isDarkMode)} className="p-4 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center transition-colors">{isDarkMode ? <Moon size={20} /> : <Sun size={20} />}</div>
              <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{t.darkMode}</span>
            </div>
            <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${isDarkMode ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
          </div>

          <div onClick={() => setNotificationsEnabled(!notificationsEnabled)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center transition-colors"><Bell size={20} /></div>
              <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{t.notifications}</span>
            </div>
            <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${notificationsEnabled ? 'bg-orange-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
          </div>
        </div>

        {/* TEHLİKELİ BÖLGE */}
        <div className="flex flex-col gap-3 mt-4">
          <button className="w-full bg-white dark:bg-gray-800 p-4 rounded-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
            <Download size={18} /> {t.download}
          </button>
          <button onClick={handleLogout} className="w-full bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl font-bold text-red-600 dark:text-red-400 flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
            <LogOut size={18} /> {t.logout}
          </button>
        </div>
      </main>

      {/* ================= MODALLAR ================= */}

      {/* PROFİL DÜZENLEME MODALI */}
      {isEditModalAcik && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 w-full max-w-xs shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">{t.editProfile}</h3>
            <div className="flex flex-col gap-4">
              <input type="text" value={yeniAd} onChange={(e) => setYeniAd(e.target.value)} placeholder={t.namePlaceholder} className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl font-bold text-gray-800 dark:text-white outline-none border border-gray-100 dark:border-gray-600 focus:border-blue-500" />
              <input type="text" value={userEmail} disabled className="w-full bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl font-bold text-gray-400 dark:text-gray-500 outline-none border border-gray-100 dark:border-gray-700 cursor-not-allowed" />
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsEditModalAcik(false)} className="flex-1 py-4 rounded-2xl font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 text-sm">{t.cancel}</button>
              <button onClick={handleProfilGuncelle} className="flex-1 py-4 rounded-2xl font-bold text-white shadow-lg text-sm bg-blue-500">{t.save}</button>
            </div>
          </div>
        </div>
      )}

      {/* UYGULAMA AYARLARI MODALI */}
      {isAyarlarModalAcik && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 w-full max-w-xs shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="text-blue-500" size={24} />
              <h3 className="text-xl font-black text-gray-900 dark:text-white">{t.appSettings}</h3>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2"><DollarSign size={14} /> {t.currency}</label>
                <select value={tempCurrency} onChange={(e) => setTempCurrency(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl font-bold text-gray-800 dark:text-white outline-none border border-gray-100 dark:border-gray-600 cursor-pointer">
                  <option value="₺">Türk Lirası (₺)</option><option value="$">US Dollar ($)</option><option value="€">Euro (€)</option><option value="£">British Pound (£)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2"><Globe size={14} /> {t.language}</label>
                <select value={tempLanguage} onChange={(e) => setTempLanguage(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl font-bold text-gray-800 dark:text-white outline-none border border-gray-100 dark:border-gray-600 cursor-pointer">
                  <option value="TR">Türkçe</option><option value="EN">English</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsAyarlarModalAcik(false)} className="flex-1 py-4 rounded-2xl font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 text-sm">{t.cancel}</button>
              <button onClick={handleAyarlarKaydet} className="flex-1 py-4 rounded-2xl font-bold text-white shadow-lg text-sm bg-blue-500">{t.apply}</button>
            </div>
          </div>
        </div>
      )}

      {/* ŞİFRE DEĞİŞTİRME MODALI (GÜNCELLENDİ) */}
      {isPasswordModalAcik && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 w-full max-w-xs shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-1">
              <Lock className="text-emerald-500" size={24} />
              <h3 className="text-xl font-black text-gray-900 dark:text-white">{t.passwordTitle}</h3>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 font-medium leading-relaxed">{t.passwordDesc}</p>
            
            <div className="flex flex-col gap-4">
              <input type="password" value={eskiSifre} onChange={(e) => setEskiSifre(e.target.value)} placeholder={t.oldPass} className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl font-bold text-gray-800 dark:text-white outline-none border border-gray-100 dark:border-gray-600 focus:border-emerald-500" />
              <input type="password" value={yeniSifre} onChange={(e) => setYeniSifre(e.target.value)} placeholder={t.newPass} className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl font-bold text-gray-800 dark:text-white outline-none border border-gray-100 dark:border-gray-600 focus:border-emerald-500" />
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => { setIsPasswordModalAcik(false); setEskiSifre(''); setYeniSifre(''); }} className="flex-1 py-4 rounded-2xl font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 text-sm">{t.cancel}</button>
              <button onClick={handleSifreGuncelle} disabled={loading} className="flex-1 py-4 rounded-2xl font-bold text-white shadow-lg text-sm bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400">{loading ? "..." : t.save}</button>
            </div>
          </div>
        </div>
      )}

      {/* Navigasyon Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md bg-[#0B3B24] dark:bg-[#062616] rounded-full px-8 py-4 flex justify-between items-center shadow-2xl z-50 transition-colors">
        <Link to="/" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors"><Home size={22} /></Link>
        <Link to="/islemler" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors"><Wallet size={22} /></Link>
        <Link to="/yeni-kayit" className="bg-[#84cc16] text-[#0B3B24] p-4 rounded-full -translate-y-8 border-8 border-[#f3f4f6] dark:border-gray-900 flex items-center justify-center shadow-lg transition-colors"><TrendingUp size={24} /></Link>
        <Link to="/cuzdanlar" className="text-gray-400 dark:text-gray-500 hover:text-white transition-colors"><CreditCard size={22} /></Link>
        <Link to="/profile" className="text-[#84cc16]"><User size={22} /></Link>
      </div>
    </div>
  );
}

export default Profile;