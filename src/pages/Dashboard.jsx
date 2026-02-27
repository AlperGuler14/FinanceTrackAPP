import { useState, useEffect } from 'react';
import { LayoutGrid, TrendingUp, CreditCard, Wallet, Home, User, ArrowUpRight, ArrowDownRight, AlertCircle, Plus, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { supabase } from '../supabaseClient'; 
import toast, { Toaster } from 'react-hot-toast';

function Dashboard() {
  const giderKategorileri = ["Market", "Yemek", "Ulaşım", "Kira", "Fatura", "Eğlence", "Sağlık", "Giyim", "Eğitim", "Abonelik", "Diğer"];
  const aylar = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const renkSecenekleri = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500', 'bg-pink-500', 'bg-red-500'];

  // Temel State'ler
  const [hesaplar, setHesaplar] = useState([]);
  const [islemler, setIslemler] = useState([]);
  const [toplamBakiye, setToplamBakiye] = useState(0);
  const [hedefler, setHedefler] = useState([]);
  const [aktifYatirim, setAktifYatirim] = useState(0);
  const [kalanBorc, setKalanBorc] = useState(0);
  const [yatirimTrendi, setYatirimTrendi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [butceUyarilari, setButceUyarilari] = useState([]);
  const [abonelikler, setAbonelikler] = useState([]);

  // Modal State'leri
  const [isHedefModalAcik, setIsHedefModalAcik] = useState(false);
  const [yeniHedefBaslik, setYeniHedefBaslik] = useState('');
  const [yeniHedefTutar, setYeniHedefTutar] = useState('');
  const [secilenRenk, setSecilenRenk] = useState('bg-blue-500');
  
  const [isParaEkleModalAcik, setIsParaEkleModalAcik] = useState(false);
  const [seciliHedef, setSeciliHedef] = useState(null);
  const [eklenecekTutar, setEklenecekTutar] = useState('');

  const [isButceModalAcik, setIsButceModalAcik] = useState(false);
  const [yeniButceKategori, setYeniButceKategori] = useState('');
  const [yeniButceLimit, setYeniButceLimit] = useState('');

  const [isAbonelikModalAcik, setIsAbonelikModalAcik] = useState(false);
  const [yeniAbonelikAd, setYeniAbonelikAd] = useState('');
  const [yeniAbonelikTutar, setYeniAbonelikTutar] = useState('');
  const [yeniAbonelikGun, setYeniAbonelikGun] = useState('');

  const [seciliAy, setSeciliAy] = useState(new Date().getMonth());
  const [seciliYil, setSeciliYil] = useState(new Date().getFullYear());

  // YENİ: DARK MODE STATE'İ VE LOCAL STORAGE
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // YENİ: TEMA DEĞİŞTİĞİNDE HTML TAG'İNE DARK CLASS'INI EKLE
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    fetchData();
  }, [seciliAy, seciliYil]);

  async function fetchData() {
    setLoading(true);
    const { data: hData } = await supabase.from('hesaplar').select('*');
    if (hData) { setHesaplar(hData); setToplamBakiye(hData.reduce((acc, h) => acc + (Number(h.bakiye) || 0), 0)); }
    
    const { data: hedeflerData } = await supabase.from('hedefler').select('*');
    if (hedeflerData) setHedefler(hedeflerData);

    const { data: abonelikData } = await supabase.from('abonelikler').select('*');
    if (abonelikData) {
      const bugun = new Date().getDate();
      const siraliAbonelikler = abonelikData.map(ab => {
        let kalan = ab.odeme_gunu - bugun;
        if (kalan < 0) kalan += 30;
        return { ...ab, kalanGun: kalan };
      }).sort((a, b) => a.kalanGun - b.kalanGun);
      setAbonelikler(siraliAbonelikler);
    }

    const { data: iData } = await supabase.from('islemler').select('*').order('tarih', { ascending: false });
    const { data: bData } = await supabase.from('butceler').select('*');

    if (iData) {
      let yatToplam = 0; let borcToplam = 0; const buAykiIslemler = [];
      const yatirimTurleri = ['yatırım', 'yatirim', 'hisse', 'fon', 'döviz', 'doviz', 'kripto', 'altın', 'altin'];
      const borcTurleri = ['borç', 'borc', 'kredi', 'taksit'];

      iData.forEach(islem => {
        const kat = (islem.kategori_adi || "").toLowerCase();
        const miktar = Math.abs(Number(islem.tutar));
        const dTarih = new Date(islem.tarih);
        
        if (yatirimTurleri.includes(kat)) yatToplam += miktar;
        else if (borcTurleri.includes(kat)) borcToplam += miktar;

        if (dTarih.getMonth() === seciliAy && dTarih.getFullYear() === seciliYil) {
          buAykiIslemler.push(islem);
        }
      });

      if (bData && buAykiIslemler.length > 0) {
        const uyarilar = bData.map(b => {
          const harcanan = buAykiIslemler.filter(i => (i.kategori_adi || "").toLowerCase() === b.kategori_adi.toLowerCase() && Number(i.tutar) < 0).reduce((sum, i) => sum + Math.abs(Number(i.tutar)), 0);
          const oran = Math.round((harcanan / b.limit_tutar) * 100);
          return oran >= 80 ? { kategori: b.kategori_adi, oran, harcanan, limit: b.limit_tutar } : null;
        }).filter(u => u !== null);
        setButceUyarilari(uyarilar);
      } else { setButceUyarilari([]); }

      setAktifYatirim(yatToplam); setKalanBorc(borcToplam); setIslemler(buAykiIslemler.slice(0, 5));
      setYatirimTrendi([{name: '1', value: yatToplam * 0.8}, {name: '2', value: yatToplam}]);
    }
    setLoading(false);
  }

  // Fonksiyonlar (Aynı)
  const handleButceKaydet = async () => { /*... (Kod aynı kalabilir, yer kaplamasın diye kısalttım, öncekiyle tamamen aynı) ...*/
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
      else { toast.success("Bütçe ayarlandı!"); setIsButceModalAcik(false); setYeniButceKategori(''); setYeniButceLimit(''); fetchData(); }
  };
  const handleHedefKaydet = async () => {
    if (!yeniHedefBaslik || !yeniHedefTutar) return toast.error("Eksik bilgi!");
    const { data } = await supabase.from('hedefler').insert([{ baslik: yeniHedefBaslik, hedef_tutar: Number(yeniHedefTutar), guncel_tutar: 0, renk: secilenRenk }]).select();
    if (data) { setHedefler([data[0], ...hedefler]); setIsHedefModalAcik(false); setYeniHedefBaslik(''); setYeniHedefTutar(''); toast.success("Hedef oluşturuldu!"); }
  };
  const handleParaEkle = async () => {
    if (!eklenecekTutar || isNaN(eklenecekTutar)) return toast.error("Geçersiz tutar!");
    const miktar = Number(eklenecekTutar);
    const hKasa = hesaplar.find(h => h.ad.toLowerCase() === 'hedefler');
    if (!hKasa || (miktar > 0 && Number(hKasa.bakiye) < miktar)) return toast.error("Hedefler kasasında yetersiz bakiye!");
    const { error } = await supabase.from('hedefler').update({ guncel_tutar: Number(seciliHedef.guncel_tutar) + miktar }).eq('id', seciliHedef.id);
    if (!error) {
      await supabase.from('hesaplar').update({ bakiye: Number(hKasa.bakiye) - miktar }).eq('id', hKasa.id);
      await supabase.from('islemler').insert([{ tutar: -miktar, aciklama: `[HEDEF] ${seciliHedef.baslik}`, kategori_adi: 'Hedef', hesap_id: hKasa.id }]);
      toast.success("Güncellendi!"); setIsParaEkleModalAcik(false); setEklenecekTutar(''); fetchData();
    }
  };
  const handleAbonelikKaydet = async () => {
    if (!yeniAbonelikAd || !yeniAbonelikTutar || !yeniAbonelikGun) return toast.error("Tüm alanları doldurun!");
    const { error } = await supabase.from('abonelikler').insert([{ ad: yeniAbonelikAd, tutar: Number(yeniAbonelikTutar), odeme_gunu: Number(yeniAbonelikGun) }]);
    if (!error) { toast.success("Abonelik eklendi!"); setIsAbonelikModalAcik(false); setYeniAbonelikAd(''); setYeniAbonelikTutar(''); setYeniAbonelikGun(''); fetchData(); } 
    else toast.error("Hata: " + error.message);
  };

  return (
    // DİKKAT: Ana div'e dark:bg-gray-900 ekledik
    <div className="max-w-md mx-auto min-h-screen bg-[#f3f4f6] dark:bg-gray-900 shadow-xl overflow-hidden relative font-sans transition-colors duration-300">
      <Toaster position="top-center" />
      
      <div className="px-6 pt-12 pb-4">
        {/* Header - Dark Mode Switch Eklendi */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">Merhaba Alper!</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Finansal durumunun güncel özeti.</p>
          </div>
          <div className="flex gap-3">
            {/* TEMA DEĞİŞTİRME BUTONU */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-yellow-400 transition-colors"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-gray-100 overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Alper`} alt="Profile" />
            </div>
          </div>
        </div>

        {/* Ana Varlık Kartı (Zaten koyu, pek dokunmaya gerek yok ama dark: uyumu yapıldı) */}
        <div className="bg-[#0B3B24] dark:bg-[#062616] rounded-[2.5rem] p-7 text-white shadow-2xl mb-6 relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#84cc16] opacity-10 blur-3xl -mr-16 -mt-16"></div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#84cc16] mb-1">Toplam Net Varlık</p>
          <h2 className="text-4xl font-black tracking-tight">₺ {toplamBakiye.toLocaleString('tr-TR')}</h2>
        </div>

        {/* Bütçe Kontrolü */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-gray-900 dark:text-white font-black text-sm uppercase tracking-wider">Bütçe Takibi</h3>
          <button onClick={() => setIsButceModalAcik(true)} className="flex items-center gap-1 text-[10px] font-black bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full hover:bg-orange-200 transition-colors">
            <Plus size={12} strokeWidth={3} /> LİMİT KOY
          </button>
        </div>

        {/* Bütçe Uyarıları */}
        {butceUyarilari.map((u, i) => (
          <div key={i} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/50 rounded-2xl p-4 flex items-center gap-4 mb-4 animate-pulse">
            <div className="bg-orange-500 p-2 rounded-xl text-white"><AlertCircle size={20} /></div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase">Limit Aşımı: {u.kategori}</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">%{u.oran} harcandı (₺{u.harcanan}/₺{u.limit})</p>
            </div>
          </div>
        ))}

        {/* Özet Kartlar */}
        <div className="flex gap-4 mb-8">
          <Link to="/yatirimlar" className="bg-white dark:bg-gray-800 flex-1 rounded-[2rem] p-5 shadow-sm border border-gray-50 dark:border-gray-700 h-32 flex flex-col justify-between relative overflow-hidden transition-colors">
            <div className="z-10">
              <span className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-wider">Yatırım</span>
              <div className="text-lg font-black text-gray-900 dark:text-white mt-1">₺{aktifYatirim.toLocaleString('tr-TR')}</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-10 opacity-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yatirimTrendi}><Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" /></AreaChart>
              </ResponsiveContainer>
            </div>
          </Link>
          <div className="bg-white dark:bg-gray-800 flex-1 rounded-[2rem] p-5 shadow-sm border border-gray-50 dark:border-gray-700 h-32 flex flex-col justify-between transition-colors">
            <span className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-wider">Borç</span>
            <div className="text-lg font-black text-gray-900 dark:text-white mt-1">₺{kalanBorc.toLocaleString('tr-TR')}</div>
            <div className="text-[10px] font-bold text-purple-500 tracking-tight">Takip Ediliyor</div>
          </div>
        </div>

        {/* Abonelikler */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-900 dark:text-white font-black text-lg">Yaklaşan Ödemeler</h3>
            <button onClick={() => setIsAbonelikModalAcik(true)} className="text-[10px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-full hover:bg-purple-200 transition-colors">
              + YENİ EKLE
            </button>
          </div>
          <div className="flex overflow-x-auto gap-3 pb-2 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {abonelikler.length > 0 ? abonelikler.map((ab) => (
              <div key={ab.id} className="min-w-[140px] bg-white dark:bg-gray-800 rounded-[1.5rem] p-4 shadow-sm border border-gray-50 dark:border-gray-700 snap-start flex flex-col justify-between transition-colors">
                <div>
                  <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/40 text-purple-500 dark:text-purple-400 flex items-center justify-center font-black text-xs mb-2">
                    {ab.ad.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-bold text-sm text-gray-800 dark:text-gray-100 line-clamp-1">{ab.ad}</p>
                  <p className="text-xs font-black text-gray-900 dark:text-white mt-1">₺{ab.tutar}</p>
                </div>
                <div className="mt-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-2 text-center transition-colors">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">
                    {ab.kalanGun === 0 ? <span className="text-red-500 dark:text-red-400 animate-pulse">BUGÜN!</span> : `${ab.kalanGun} Gün Kaldı`}
                  </p>
                </div>
              </div>
            )) : <p className="text-xs text-gray-400 font-medium italic">Henüz abonelik eklenmedi.</p>}
          </div>
        </div>

        {/* Hedefler */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-900 dark:text-white font-black text-lg">Hedeflerin</h3>
            <button onClick={() => setIsHedefModalAcik(true)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm text-[#84cc16] font-bold">+</button>
          </div>
          <div className="flex flex-col gap-3">
            {hedefler.map((h) => {
              const y = Math.min(Math.round((h.guncel_tutar / h.hedef_tutar) * 100), 100);
              return (
                <div key={h.id} onClick={() => { setSeciliHedef(h); setIsParaEkleModalAcik(true); }} className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-50 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{h.baslik}</span>
                    <span className="text-[10px] font-black text-gray-400">%{y}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden transition-colors">
                    <div className={`h-full ${h.renk} transition-all duration-700`} style={{ width: `${y}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Son Hareketler */}
      <div className="px-6 pb-32 pt-8 bg-white dark:bg-gray-800 rounded-t-[3.5rem] shadow-[0_-20px_60px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-gray-900 dark:text-white font-black text-lg">Son Hareketler</h3>
          <div className="flex items-center bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 px-3 py-1.5 rounded-2xl transition-colors">
            <select value={seciliAy} onChange={(e) => setSeciliAy(Number(e.target.value))} className="bg-transparent dark:text-white text-[11px] font-black text-blue-600 outline-none uppercase tracking-tighter cursor-pointer">
              {aylar.map((a, i) => <option key={i} value={i}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {loading ? (
             <p className="text-center py-10 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase animate-pulse">Yükleniyor...</p>
          ) : islemler.length > 0 ? (
            islemler.map((is) => (
              <div key={is.id} className="flex items-center justify-between p-1">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center border border-gray-100 dark:border-gray-600 transition-colors"><Wallet size={18} className="text-gray-400 dark:text-gray-500" /></div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{is.aciklama || is.kategori_adi}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{new Date(is.tarih).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
                <p className={`text-sm font-black ${Number(is.tutar) > 0 ? 'text-emerald-500' : 'text-gray-900 dark:text-gray-100'}`}>{Number(is.tutar) > 0 ? '+' : ''}{Number(is.tutar).toLocaleString('tr-TR')} ₺</p>
              </div>
            ))
          ) : <p className="text-center py-10 text-gray-300 dark:text-gray-600 text-[10px] font-black uppercase tracking-widest">Bu ay işlem yok</p>}
        </div>
      </div>

      {/* ================= MODALLAR ================= */}
      {/* (Tüm Modallara dark: sınıfları eklendi) */}

      {isButceModalAcik && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 w-full max-w-xs shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">Bütçe Belirle</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 font-medium">Hangi kategoriye limit koymak istersin?</p>
            <div className="flex flex-col gap-4">
              <select value={yeniButceKategori} onChange={(e) => setYeniButceKategori(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl font-bold text-gray-800 dark:text-white outline-none border border-gray-100 dark:border-gray-600 focus:border-orange-500 cursor-pointer">
                <option value="" disabled>Kategori Seçin...</option>
                {giderKategorileri.map((kat, index) => <option key={index} value={kat}>{kat}</option>)}
              </select>
              <input type="number" value={yeniButceLimit} onChange={(e) => setYeniButceLimit(e.target.value)} placeholder="Aylık Limit (₺)" className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl font-bold text-gray-800 dark:text-white outline-none border border-gray-100 dark:border-gray-600 focus:border-orange-500" />
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsButceModalAcik(false)} className="flex-1 py-4 rounded-2xl font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 text-sm">İptal</button>
              <button onClick={handleButceKaydet} className="flex-1 py-4 rounded-2xl font-bold text-white shadow-lg text-sm bg-orange-500 hover:bg-orange-600 transition-colors">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {isAbonelikModalAcik && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 w-full max-w-xs shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">Abonelik Ekle</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 font-medium">Düzenli ödemelerini takip et.</p>
            <div className="flex flex-col gap-4">
              <input type="text" value={yeniAbonelikAd} onChange={(e) => setYeniAbonelikAd(e.target.value)} placeholder="Örn: Netflix, Kira" className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl font-bold text-gray-800 dark:text-white outline-none border border-gray-100 dark:border-gray-600 focus:border-purple-500" />
              <input type="number" value={yeniAbonelikTutar} onChange={(e) => setYeniAbonelikTutar(e.target.value)} placeholder="Aylık Tutar (₺)" className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl font-bold text-gray-800 dark:text-white outline-none border border-gray-100 dark:border-gray-600 focus:border-purple-500" />
              <input type="number" min="1" max="31" value={yeniAbonelikGun} onChange={(e) => setYeniAbonelikGun(e.target.value)} placeholder="Ayın Kaçıncı Günü? (1-31)" className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl font-bold text-gray-800 dark:text-white outline-none border border-gray-100 dark:border-gray-600 focus:border-purple-500" />
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsAbonelikModalAcik(false)} className="flex-1 py-4 rounded-2xl font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 text-sm">İptal</button>
              <button onClick={handleAbonelikKaydet} className="flex-1 py-4 rounded-2xl font-bold text-white shadow-lg text-sm bg-purple-500 hover:bg-purple-600 transition-colors">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {isParaEkleModalAcik && seciliHedef && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 w-full max-w-xs shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">{seciliHedef.baslik}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 font-medium tracking-tight">Hedefe ne kadar eklenecek?</p>
            <input type="number" value={eklenecekTutar} onChange={(e) => setEklenecekTutar(e.target.value)} placeholder="0" className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl font-black text-gray-800 dark:text-white outline-none mb-6 border border-gray-100 dark:border-gray-600 focus:border-blue-500 text-lg" />
            <div className="flex gap-3">
              <button onClick={() => setIsParaEkleModalAcik(false)} className="flex-1 py-4 rounded-2xl font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 text-sm">İptal</button>
              <button onClick={handleParaEkle} className={`flex-1 py-4 rounded-2xl font-bold text-white shadow-lg text-sm ${seciliHedef.renk} hover:brightness-110`}>Güncelle</button>
            </div>
          </div>
        </div>
      )}

      {isHedefModalAcik && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">Yeni Hedef Belirle</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Hedef Adı</label>
                <input type="text" value={yeniHedefBaslik} onChange={(e) => setYeniHedefBaslik(e.target.value)} placeholder="Örn: Yeni Bilgisayar" className="w-full bg-gray-50 dark:bg-gray-700 p-3 rounded-xl font-bold text-gray-800 dark:text-white outline-none mt-1 border border-gray-100 dark:border-gray-600 focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Gereken Tutar (₺)</label>
                <input type="number" value={yeniHedefTutar} onChange={(e) => setYeniHedefTutar(e.target.value)} placeholder="0" className="w-full bg-gray-50 dark:bg-gray-700 p-3 rounded-xl font-bold text-gray-800 dark:text-white outline-none mt-1 border border-gray-100 dark:border-gray-600 focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block mb-2">Renk Seçimi</label>
                <div className="flex gap-3">
                  {renkSecenekleri.map(renk => (
                    <button key={renk} onClick={() => setSecilenRenk(renk)} className={`w-8 h-8 rounded-full ${renk} ${secilenRenk === renk ? 'ring-4 ring-gray-200 dark:ring-gray-600 scale-110' : ''} transition-all`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsHedefModalAcik(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">İptal</button>
              <button onClick={handleHedefKaydet} className="flex-1 py-3 rounded-xl font-bold text-[#84cc16] bg-[#0B3B24] shadow-lg hover:bg-[#134e34] transition-colors">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* Navigasyon Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md bg-[#0B3B24] dark:bg-[#062616] rounded-full px-8 py-4 flex justify-between items-center shadow-2xl z-50 transition-colors">
        <Link to="/" className="text-[#84cc16]"><Home size={22} /></Link>
        <Link to="/islemler" className="text-gray-400 dark:text-gray-500"><Wallet size={22} /></Link>
        <Link to="/yeni-kayit" className="bg-[#84cc16] text-[#0B3B24] p-4 rounded-full -translate-y-8 border-8 border-[#f3f4f6] dark:border-gray-900 flex items-center justify-center shadow-lg transition-colors"><TrendingUp size={24} /></Link>
        <Link to="/Card" className="text-gray-400 dark:text-gray-500"><CreditCard size={22} /></Link>
        <Link to="/Profile" className="text-gray-400 dark:text-gray-500"><User size={22} /></Link>
      </div>
    </div>
  );
}

export default Dashboard;