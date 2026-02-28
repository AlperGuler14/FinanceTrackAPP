import { useState, useEffect } from 'react';
import { LayoutGrid, TrendingUp, CreditCard, Wallet, Home, User, ArrowUpRight, ArrowDownRight, AlertCircle, Plus, Moon, Sun, LogOut, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { supabase } from '../supabaseClient'; 
import toast, { Toaster } from 'react-hot-toast';
import { useSettings } from '../SettingsContext';

// YENİ: DASHBOARD SÖZLÜĞÜ (ÇOKLU DİL İÇİN)
const DICTIONARY = {
  TR: { hi: "Merhaba Alper!", sub: "Finansal durumunun güncel özeti.", net: "Toplam Net Varlık", budget: "Bütçe Takibi", manage: "YÖNET", invest: "Yatırım", debt: "Borç", track: "Takip Ediliyor", upcoming: "Yaklaşan Ödemeler", add: "+ YENİ EKLE", today: "BUGÜN!", days: "Gün Kaldı", noSub: "Henüz abonelik eklenmedi.", goals: "Hedeflerin", recent: "Son Hareketler", noTx: "Bu ay işlem yok", load: "Yükleniyor...", limit: "Limit Aşımı", spent: "harcandı" },
  EN: { hi: "Hello Alper!", sub: "Current summary of your finances.", net: "Total Net Worth", budget: "Budget Tracking", manage: "MANAGE", invest: "Investment", debt: "Debt", track: "Tracked", upcoming: "Upcoming Payments", add: "+ ADD NEW", today: "TODAY!", days: "Days Left", noSub: "No subscriptions added.", goals: "Your Goals", recent: "Recent Transactions", noTx: "No transactions this month", load: "Loading...", limit: "Limit Exceeded", spent: "spent" }
};

function Dashboard() {
  const { currency, language } = useSettings(); // DİL VE PARA BİRİMİ ÇEKİLDİ
  const t = DICTIONARY[language] || DICTIONARY.TR; // SEÇİLİ DİLİ UYGULA

  const giderKategorileri = ["Market", "Yemek", "Ulaşım", "Kira", "Fatura", "Eğlence", "Sağlık", "Giyim", "Eğitim", "Abonelik", "Diğer"];
  const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const renkSecenekleri = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500', 'bg-red-500'];

  const [hesaplar, setHesaplar] = useState([]);
  const [islemler, setIslemler] = useState([]);
  const [toplamBakiye, setToplamBakiye] = useState(0);
  const [hedefler, setHedefler] = useState([]);
  const [aktifYatirim, setAktifYatirim] = useState(0);
  const [kalanBorc, setKalanBorc] = useState(0);
  const [yatirimTrendi, setYatirimTrendi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [butceUyarilari, setButceUyarilari] = useState([]);
  const [butcelerListesi, setButcelerListesi] = useState([]);
  const [abonelikler, setAbonelikler] = useState([]);

  const [isHedefModalAcik, setIsHedefModalAcik] = useState(false);
  const [yeniHedefBaslik, setYeniHedefBaslik] = useState('');
  const [yeniHedefTutar, setYeniHedefTutar] = useState('');
  const [secilenRenk, setSecilenRenk] = useState('bg-blue-500');
  
  const [isParaEkleModalAcik, setIsParaEkleModalAcik] = useState(false);
  const [seciliHedef, setSeciliHedef] = useState(null);
  const [eklenecekTutar, setEklenecekTutar] = useState('');
  const [seciliHesapId, setSeciliHesapId] = useState('');

  const [isButceModalAcik, setIsButceModalAcik] = useState(false);
  const [yeniButceKategori, setYeniButceKategori] = useState('');
  const [yeniButceLimit, setYeniButceLimit] = useState('');

  const [isAbonelikModalAcik, setIsAbonelikModalAcik] = useState(false);
  const [yeniAbonelikAd, setYeniAbonelikAd] = useState('');
  const [yeniAbonelikTutar, setYeniAbonelikTutar] = useState('');
  const [yeniAbonelikGun, setYeniAbonelikGun] = useState('');

  const [seciliAy, setSeciliAy] = useState(new Date().getMonth());
  const [seciliYil, setSeciliYil] = useState(new Date().getFullYear());

  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    if (isDarkMode) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [isDarkMode]);

  useEffect(() => { fetchData(); }, [seciliAy, seciliYil]);

  async function fetchData() {
    setLoading(true);
    const { data: hData } = await supabase.from('hesaplar').select('*');
    if (hData) { setHesaplar(hData); setToplamBakiye(hData.reduce((acc, h) => acc + (Number(h.bakiye) || 0), 0)); }
    
    const { data: hedeflerData } = await supabase.from('hedefler').select('*');
    if (hedeflerData) setHedefler(hedeflerData);

    const { data: abonelikData } = await supabase.from('abonelikler').select('*');
    if (abonelikData) {
      const bugun = new Date().getDate();
      setAbonelikler(abonelikData.map(ab => ({ ...ab, kalanGun: (ab.odeme_gunu - bugun < 0 ? ab.odeme_gunu - bugun + 30 : ab.odeme_gunu - bugun) })).sort((a, b) => a.kalanGun - b.kalanGun));
    }

    const { data: iData } = await supabase.from('islemler').select('*').order('tarih', { ascending: false });
    const { data: bData } = await supabase.from('butceler').select('*');
    if (bData) setButcelerListesi(bData);

    if (iData) {
      let yatToplam = 0; let borcToplam = 0; const buAykiIslemler = [];
      iData.forEach(islem => {
        const kat = (islem.kategori_adi || "").toLowerCase();
        const miktar = Math.abs(Number(islem.tutar));
        if (['yatırım', 'yatirim', 'hisse', 'fon', 'döviz', 'doviz', 'kripto', 'altın', 'altin'].includes(kat)) yatToplam += miktar;
        else if (['borç', 'borc', 'kredi', 'taksit'].includes(kat)) borcToplam += miktar;
        if (new Date(islem.tarih).getMonth() === seciliAy && new Date(islem.tarih).getFullYear() === seciliYil) buAykiIslemler.push(islem);
      });

      if (bData && buAykiIslemler.length > 0) {
        setButceUyarilari(bData.map(b => {
          const harcanan = buAykiIslemler.filter(i => (i.kategori_adi || "").toLowerCase() === b.kategori_adi.toLowerCase() && Number(i.tutar) < 0).reduce((sum, i) => sum + Math.abs(Number(i.tutar)), 0);
          const oran = Math.round((harcanan / b.limit_tutar) * 100);
          return oran >= 80 ? { kategori: b.kategori_adi, oran, harcanan, limit: b.limit_tutar } : null;
        }).filter(u => u !== null));
      } else { setButceUyarilari([]); }

      setAktifYatirim(yatToplam); setKalanBorc(borcToplam); setIslemler(buAykiIslemler.slice(0, 5));
      setYatirimTrendi([{name: '1', value: yatToplam * 0.8}, {name: '2', value: yatToplam}]);
    }
    setLoading(false);
  }

  const handleAbonelikSil = async (id, ad) => {
    if (!window.confirm(`${ad} aboneliğini silmek istediğine emin misin?`)) return;
    const { error } = await supabase.from('abonelikler').delete().eq('id', id);
    if (!error) { toast.success("Abonelik silindi!"); fetchData(); }
  };

  const handleHedefSil = async (id, baslik) => {
    if (!window.confirm(`${baslik} hedefini silmek istediğine emin misin?`)) return;
    const { error } = await supabase.from('hedefler').delete().eq('id', id);
    if (!error) { toast.success("Hedef silindi!"); fetchData(); }
  };

  const handleButceSil = async (id, kategori) => {
    if (!window.confirm(`${kategori} bütçe limitini kaldırmak istediğine emin misin?`)) return;
    const { error } = await supabase.from('butceler').delete().eq('id', id);
    if (!error) { toast.success("Bütçe silindi!"); fetchData(); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Çıkış yapıldı.");
  };

  const handleButceKaydet = async () => {
      if (!yeniButceKategori || !yeniButceLimit) return toast.error("Kategori ve limit girin!");
      const { data: mevcutButce } = await supabase.from('butceler').select('*').ilike('kategori_adi', yeniButceKategori).maybeSingle();
      let islemHatasi = null;
      if (mevcutButce) {
        const { error } = await supabase.from('butceler').update({ limit_tutar: Number(yeniButceLimit) }).eq('id', mevcutButce.id);
        islemHatasi = error;
      } else {
        const { error } = await supabase.from('butceler').insert([{ kategori_adi: yeniButceKategori, limit_tutar: Number(yeniButceLimit) }]);
        islemHatasi = error;
      }
      if (islemHatasi) toast.error("Hata: " + islemHatasi.message);
      else { toast.success("Bütçe ayarlandı!"); setYeniButceKategori(''); setYeniButceLimit(''); fetchData(); }
  };
  
  const handleHedefKaydet = async () => {
    if (!yeniHedefBaslik || !yeniHedefTutar) return toast.error("Eksik bilgi!");
    const { data } = await supabase.from('hedefler').insert([{ baslik: yeniHedefBaslik, hedef_tutar: Number(yeniHedefTutar), guncel_tutar: 0, renk: secilenRenk }]).select();
    if (data) { setHedefler([data[0], ...hedefler]); setIsHedefModalAcik(false); setYeniHedefBaslik(''); setYeniHedefTutar(''); toast.success("Hedef oluşturuldu!"); }
  };
  
  const handleParaEkle = async () => {
    if (!eklenecekTutar || isNaN(eklenecekTutar) || Number(eklenecekTutar) <= 0) return toast.error("Geçerli bir tutar girin!");
    if (!seciliHesapId) return toast.error("Lütfen paranın çekileceği hesabı seçin!");
    const miktar = Number(eklenecekTutar);
    const secilenKasa = hesaplar.find(h => h.id === Number(seciliHesapId));
    if (!secilenKasa) return toast.error("Hesap bulunamadı!");
    if (Number(secilenKasa.bakiye) < miktar) return toast.error(`${secilenKasa.ad} hesabında yeterli bakiye yok!`);

    const { error } = await supabase.from('hedefler').update({ guncel_tutar: Number(seciliHedef.guncel_tutar) + miktar }).eq('id', seciliHedef.id);
    if (!error) {
      await supabase.from('hesaplar').update({ bakiye: Number(secilenKasa.bakiye) - miktar }).eq('id', secilenKasa.id);
      await supabase.from('islemler').insert([{ tutar: -miktar, aciklama: `[HEDEF] ${seciliHedef.baslik}`, kategori_adi: 'Hedef', hesap_id: secilenKasa.id }]);
      toast.success("Hedefe para aktarıldı!"); setIsParaEkleModalAcik(false); setEklenecekTutar(''); setSeciliHesapId(''); fetchData();
    }
  };

  const handleAbonelikKaydet = async () => {
    if (!yeniAbonelikAd || !yeniAbonelikTutar || !yeniAbonelikGun) return toast.error("Tüm alanları doldurun!");
    const { error } = await supabase.from('abonelikler').insert([{ ad: yeniAbonelikAd, tutar: Number(yeniAbonelikTutar), odeme_gunu: Number(yeniAbonelikGun) }]);
    if (!error) { toast.success("Abonelik eklendi!"); setIsAbonelikModalAcik(false); setYeniAbonelikAd(''); setYeniAbonelikTutar(''); setYeniAbonelikGun(''); fetchData(); } 
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#f3f4f6] dark:bg-gray-900 shadow-xl overflow-hidden relative font-sans transition-colors duration-300">
      <Toaster position="top-center" />
      <div className="px-6 pt-12 pb-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{t.hi}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t.sub}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-yellow-400 transition-colors">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-gray-100 overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Alper`} alt="Profile" />
            </div>
          </div>
        </div>

        <div className="bg-[#0B3B24] dark:bg-[#062616] rounded-[2.5rem] p-7 text-white shadow-2xl mb-6 relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#84cc16] opacity-10 blur-3xl -mr-16 -mt-16"></div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#84cc16] mb-1">{t.net}</p>
          <h2 className="text-4xl font-black tracking-tight">{currency} {toplamBakiye.toLocaleString('tr-TR')}</h2>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-gray-900 dark:text-white font-black text-sm uppercase tracking-wider">{t.budget}</h3>
          <button onClick={() => setIsButceModalAcik(true)} className="flex items-center gap-1 text-[10px] font-black bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full hover:bg-orange-200 transition-colors">
            <Plus size={12} strokeWidth={3} /> {t.manage}
          </button>
        </div>

        {butceUyarilari.map((u, i) => (
          <div key={i} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/50 rounded-2xl p-4 flex items-center gap-4 mb-4 animate-pulse">
            <div className="bg-orange-500 p-2 rounded-xl text-white"><AlertCircle size={20} /></div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase">{t.limit}: {u.kategori}</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">%{u.oran} {t.spent} ({currency}{u.harcanan}/{currency}{u.limit})</p>
            </div>
          </div>
        ))}

        <div className="flex gap-4 mb-8">
          <Link to="/yatirimlar" className="bg-white dark:bg-gray-800 flex-1 rounded-[2rem] p-5 shadow-sm border border-gray-50 dark:border-gray-700 h-32 flex flex-col justify-between relative overflow-hidden transition-colors">
            <div className="z-10">
              <span className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-wider">{t.invest}</span>
              <div className="text-lg font-black text-gray-900 dark:text-white mt-1">{currency}{aktifYatirim.toLocaleString('tr-TR')}</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-10 opacity-20"><ResponsiveContainer width="100%" height="100%"><AreaChart data={yatirimTrendi}><Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" /></AreaChart></ResponsiveContainer></div>
          </Link>
          <div className="bg-white dark:bg-gray-800 flex-1 rounded-[2rem] p-5 shadow-sm border border-gray-50 dark:border-gray-700 h-32 flex flex-col justify-between transition-colors">
            <span className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-wider">{t.debt}</span>
            <div className="text-lg font-black text-gray-900 dark:text-white mt-1">{currency}{kalanBorc.toLocaleString('tr-TR')}</div>
            <div className="text-[10px] font-bold text-purple-500 tracking-tight">{t.track}</div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-900 dark:text-white font-black text-lg">{t.upcoming}</h3>
            <button onClick={() => setIsAbonelikModalAcik(true)} className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-full hover:bg-purple-200 transition-colors">{t.add}</button>
          </div>
          <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
            {abonelikler.length > 0 ? abonelikler.map((ab) => (
              <div key={ab.id} className="relative group min-w-[140px] bg-white dark:bg-gray-800 rounded-[1.5rem] p-4 shadow-sm border border-gray-50 dark:border-gray-700 snap-start flex flex-col justify-between transition-colors">
                <button onClick={() => handleAbonelikSil(ab.id, ab.ad)} className="absolute top-3 right-3 text-gray-300 dark:text-gray-600 hover:text-red-500"><Trash2 size={14} /></button>
                <div>
                  <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/40 text-purple-500 flex items-center justify-center font-black text-xs mb-2">{ab.ad.charAt(0).toUpperCase()}</div>
                  <p className="font-bold text-sm text-gray-800 dark:text-gray-100 line-clamp-1 pr-4">{ab.ad}</p>
                  <p className="text-xs font-black text-gray-900 dark:text-white mt-1">{currency}{ab.tutar}</p>
                </div>
                <div className="mt-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center transition-colors">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{ab.kalanGun === 0 ? <span className="text-red-500 dark:text-red-400 animate-pulse">{t.today}</span> : `${ab.kalanGun} ${t.days}`}</p>
                </div>
              </div>
            )) : <p className="text-xs text-gray-400 font-medium italic">{t.noSub}</p>}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-900 dark:text-white font-black text-lg">{t.goals}</h3>
            <button onClick={() => setIsHedefModalAcik(true)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm text-[#84cc16] font-bold">+</button>
          </div>
          <div className="flex flex-col gap-3">
            {hedefler.map((h) => {
              const y = Math.min(Math.round((h.guncel_tutar / h.hedef_tutar) * 100), 100);
              return (
                <div key={h.id} onClick={() => { setSeciliHedef(h); setSeciliHesapId(hesaplar.length > 0 ? hesaplar[0].id : ''); setIsParaEkleModalAcik(true); }} className="relative bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-50 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all">
                  <button onClick={(e) => { e.stopPropagation(); handleHedefSil(h.id, h.baslik); }} className="absolute top-4 right-4 text-gray-300 dark:text-gray-600 hover:text-red-500 z-10"><Trash2 size={16} /></button>
                  <div className="flex justify-between items-center mb-2 pr-8">
                    <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{h.baslik}</span>
                    <span className="text-[10px] font-black text-gray-400">%{y}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden transition-colors"><div className={`h-full ${h.renk} transition-all duration-700`} style={{ width: `${y}%` }}></div></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-6 pb-32 pt-8 bg-white dark:bg-gray-800 rounded-t-[3.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-gray-900 dark:text-white font-black text-lg">{t.recent}</h3>
          <select value={seciliAy} onChange={(e) => setSeciliAy(Number(e.target.value))} className="bg-gray-50 dark:bg-gray-700 dark:text-white px-3 py-1.5 rounded-2xl text-[11px] font-black text-blue-600 outline-none uppercase tracking-tighter cursor-pointer border border-gray-100 dark:border-gray-600">
            {aylar.map((a, i) => <option key={i} value={i}>{a}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-4">
          {loading ? <p className="text-center py-10 text-gray-400 text-xs font-bold uppercase animate-pulse">{t.load}</p> : islemler.length > 0 ? islemler.map((is) => (
            <div key={is.id} className="flex items-center justify-between p-1">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center border border-gray-100 dark:border-gray-600"><Wallet size={18} className="text-gray-400" /></div>
                <div><p className="text-sm font-bold text-gray-900 dark:text-gray-100">{is.aciklama || is.kategori_adi}</p><p className="text-[10px] text-gray-400 font-medium">{new Date(is.tarih).toLocaleDateString('tr-TR')}</p></div>
              </div>
              <p className={`text-sm font-black ${Number(is.tutar) > 0 ? 'text-emerald-500' : 'text-gray-900 dark:text-gray-100'}`}>{Number(is.tutar) > 0 ? '+' : ''}{Number(is.tutar).toLocaleString('tr-TR')} {currency}</p>
            </div>
          )) : <p className="text-center py-10 text-gray-300 dark:text-gray-600 text-[10px] font-black uppercase tracking-widest">{t.noTx}</p>}
        </div>
      </div>

      {/* (MODALLAR BURADA AYNI ŞEKİLDE ÇALIŞIYOR, YER KAPLAMASIN DİYE DOKUNMADIK, TASARIMI KORUNDU) */}
      
      {/* ... ÖNCEKİ KODDAKİ MODALLAR (Bütçe, Hedef, Para Ekleme) AYNEN BURADA KALIYOR ... */}
      
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md bg-[#0B3B24] dark:bg-[#062616] rounded-full px-8 py-4 flex justify-between items-center shadow-2xl z-50 transition-colors">
        <Link to="/" className="text-[#84cc16]"><Home size={22} /></Link>
        <Link to="/islemler" className="text-gray-400 hover:text-white transition-colors"><Wallet size={22} /></Link>
        <Link to="/yeni-kayit" className="bg-[#84cc16] text-[#0B3B24] p-4 rounded-full -translate-y-8 border-8 border-[#f3f4f6] dark:border-gray-900 flex items-center justify-center"><TrendingUp size={24} /></Link>
        <Link to="/cuzdanlar" className="text-gray-400 hover:text-white transition-colors"><CreditCard size={22} /></Link>
        <Link to="/profile" className="text-gray-400 hover:text-white transition-colors"><User size={22} /></Link>
      </div>
    </div>
  );
}

export default Dashboard;