import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, CreditCard, Wallet, MoreVertical, Landmark, Trash2, Edit2, ArrowRightLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import toast, { Toaster } from 'react-hot-toast';
import { useSettings } from '../SettingsContext'; // BEYİN EKLENDİ

const DICTIONARY = {
  TR: { title: "Cüzdanlarım", total: "Toplam Nakit Varlık", registered: "Kayıtlı Hesaplar", add: "+ YENİ EKLE", load: "Hesaplar yükleniyor...", current: "Güncel Bakiye", noAcc: "Henüz bir hesap eklemediniz.", newAcc: "Yeni Hesap", newAccDesc: "Nakit, Banka veya Kredi Kartı ekle.", accName: "Hesap Adı (Örn: Ziraat, Nakit)", startBal: "Başlangıç Bakiyesi", cancel: "İptal", create: "Oluştur", quick: "Hızlı İşlem Ekle", edit: "Kart Adını Düzenle", del: "Kartı Sil", giveup: "Vazgeç", bank: "Banka", cash: "Nakit", credit: "Kredi Kartı" },
  EN: { title: "My Wallets", total: "Total Cash Assets", registered: "Registered Accounts", add: "+ ADD NEW", load: "Loading accounts...", current: "Current Balance", noAcc: "No accounts added yet.", newAcc: "New Account", newAccDesc: "Add Cash, Bank or Credit Card.", accName: "Account Name (e.g. Bank, Cash)", startBal: "Starting Balance", cancel: "Cancel", create: "Create", quick: "Quick Transaction", edit: "Edit Card Name", del: "Delete Card", giveup: "Cancel", bank: "Bank", cash: "Cash", credit: "Credit Card" }
};

function Card() {
  const { currency, language } = useSettings();
  const t = DICTIONARY[language] || DICTIONARY.TR;

  const [hesaplar, setHesaplar] = useState([]);
  const [toplamBakiye, setToplamBakiye] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isCuzdanModalAcik, setIsCuzdanModalAcik] = useState(false);
  const [yeniCuzdanAd, setYeniCuzdanAd] = useState("");
  const [yeniCuzdanBakiye, setYeniCuzdanBakiye] = useState("");
  const [yeniCuzdanTipi, setYeniCuzdanTipi] = useState("Banka"); 

  const navigate = useNavigate();
  const [seciliKart, setSeciliKart] = useState(null);
  const [isAksiyonModalAcik, setIsAksiyonModalAcik] = useState(false);

  const hesapTipleri = ["Banka", "Nakit", "Kredi Kartı"];
  // Ekranda çevrilmiş halini göstermek için yardımcı fonksiyon
  const tipCevir = (tip) => tip === "Banka" ? t.bank : tip === "Nakit" ? t.cash : t.credit;

  useEffect(() => { fetchHesaplar(); }, []);

  async function fetchHesaplar() {
    setLoading(true);
    const { data, error } = await supabase.from('hesaplar').select('*').order('created_at', { ascending: true });
    if (error) { toast.error(language === 'TR' ? "Hata oluştu." : "Error loading accounts."); } 
    else if (data) { setHesaplar(data); setToplamBakiye(data.reduce((acc, h) => acc + (Number(h.bakiye) || 0), 0)); }
    setLoading(false);
  }

  const handleCuzdanKaydet = async () => {
    if (!yeniCuzdanAd.trim()) return toast.error(language === 'TR' ? "Hesap adı girin!" : "Enter account name!");
    setLoading(true);
    const baslangicBakiye = Number(yeniCuzdanBakiye) || 0;
    const { error } = await supabase.from('hesaplar').insert([{ ad: `${yeniCuzdanAd.trim()} (${yeniCuzdanTipi})`, bakiye: baslangicBakiye }]);
    if (error) { toast.error(error.message); } 
    else { toast.success(language === 'TR' ? "Hesap eklendi!" : "Account added!"); setIsCuzdanModalAcik(false); setYeniCuzdanAd(""); setYeniCuzdanBakiye(""); fetchHesaplar(); }
    setLoading(false);
  };

  const handleKartSil = async () => {
    if (!seciliKart) return;
    if (!window.confirm(language === 'TR' ? `${seciliKart.ad} silinsin mi?` : `Delete ${seciliKart.ad}?`)) return;
    setLoading(true);
    const { error } = await supabase.from('hesaplar').delete().eq('id', seciliKart.id);
    if (error) { toast.error(language === 'TR' ? "Silinemedi!" : "Could not delete!"); } 
    else { toast.success(language === 'TR' ? "Silindi." : "Deleted."); setIsAksiyonModalAcik(false); fetchHesaplar(); }
    setLoading(false);
  };

  const getGradient = (index) => ["from-emerald-500 to-teal-700", "from-blue-500 to-indigo-700", "from-orange-500 to-red-600", "from-purple-500 to-fuchsia-700", "from-gray-700 to-gray-900"][index % 5];
  const getIcon = (isim) => {
    if (isim.includes("Nakit")) return <Wallet size={20} className="text-white opacity-80" />;
    if (isim.includes("Kredi")) return <CreditCard size={20} className="text-white opacity-80" />;
    return <Landmark size={20} className="text-white opacity-80" />;
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans transition-colors duration-300">
      <Toaster position="top-center" />
      <header className="px-6 py-5 bg-white dark:bg-gray-800 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10 transition-colors">
        <Link to="/" className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full -ml-2"><ArrowLeft size={24} /></Link>
        <h1 className="font-bold text-gray-900 dark:text-white text-lg tracking-wide">{t.title}</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-6">
        <div className="flex flex-col items-center justify-center p-6 mb-2">
          <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-2">{t.total}</p>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{currency} {toplamBakiye.toLocaleString('tr-TR')}</h2>
        </div>

        <div className="flex justify-between items-center mb-2">
          <h3 className="text-gray-900 dark:text-white font-black text-sm uppercase tracking-wider">{t.registered}</h3>
          <button onClick={() => setIsCuzdanModalAcik(true)} className="flex items-center gap-1 text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full hover:bg-emerald-200"><Plus size={12} strokeWidth={3} /> {t.add}</button>
        </div>

        <div className="flex flex-col gap-4 pb-10">
          {loading ? <p className="text-center py-10 text-gray-400 dark:text-gray-500 font-bold animate-pulse">{t.load}</p> : hesaplar.length > 0 ? hesaplar.map((hesap, index) => (
            <div key={hesap.id} className={`bg-gradient-to-br ${getGradient(index)} rounded-3xl p-6 shadow-lg text-white relative overflow-hidden flex flex-col justify-between min-h-[140px] transform transition-transform hover:scale-[1.02] cursor-pointer`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex justify-between items-start z-10">
                <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm">{getIcon(hesap.ad)}<span className="text-xs font-bold tracking-wider">{hesap.ad.split(' (')[0]}</span></div>
                <button onClick={() => { setSeciliKart(hesap); setIsAksiyonModalAcik(true); }} className="text-white/70 hover:text-white transition-colors p-1"><MoreVertical size={20} /></button>
              </div>
              <div className="z-10 mt-6">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">{t.current}</p>
                <p className="text-3xl font-black tracking-tight">{currency} {Number(hesap.bakiye).toLocaleString('tr-TR')}</p>
              </div>
            </div>
          )) : <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 text-center"><p className="text-gray-400 dark:text-gray-500 text-sm font-medium">{t.noAcc}</p></div>}
        </div>
      </main>

      {isCuzdanModalAcik && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 w-full max-w-xs shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">{t.newAcc}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 font-medium">{t.newAccDesc}</p>
            <div className="flex flex-col gap-4">
              <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-xl flex shadow-inner transition-colors">
                {hesapTipleri.map((tip) => (
                  <button key={tip} onClick={() => setYeniCuzdanTipi(tip)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${yeniCuzdanTipi === tip ? "bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>{tipCevir(tip)}</button>
                ))}
              </div>
              <input type="text" value={yeniCuzdanAd} onChange={(e) => setYeniCuzdanAd(e.target.value)} placeholder={t.accName} className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl font-bold text-gray-800 dark:text-white outline-none border border-gray-100 dark:border-gray-600" />
              <input type="number" value={yeniCuzdanBakiye} onChange={(e) => setYeniCuzdanBakiye(e.target.value)} placeholder={`${t.startBal} (${currency})`} className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl font-bold text-gray-800 dark:text-white outline-none border border-gray-100 dark:border-gray-600" />
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsCuzdanModalAcik(false)} className="flex-1 py-4 rounded-2xl font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 text-sm">{t.cancel}</button>
              <button onClick={handleCuzdanKaydet} disabled={loading} className="flex-1 py-4 rounded-2xl font-bold text-white shadow-lg text-sm bg-emerald-500 hover:bg-emerald-600">{loading ? "..." : t.create}</button>
            </div>
          </div>
        </div>
      )}

      {isAksiyonModalAcik && seciliKart && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-end justify-center p-4 backdrop-blur-sm sm:items-center">
          <div className="bg-white dark:bg-gray-800 rounded-t-[2rem] sm:rounded-[2.5rem] p-6 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6 sm:hidden"></div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1 text-center">{seciliKart.ad}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 font-medium text-center">{t.current}: {currency}{Number(seciliKart.bakiye).toLocaleString('tr-TR')}</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setIsAksiyonModalAcik(false); navigate('/yeni-kayit'); }} className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center"><ArrowRightLeft size={18} /></div>{t.quick}
              </button>
              <button onClick={() => toast(language === 'TR' ? "Yakında!" : "Coming soon!", { icon: '🛠️' })} className="w-full bg-gray-50 dark:bg-gray-700 p-4 rounded-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center"><Edit2 size={18} /></div>{t.edit}
              </button>
              <button onClick={handleKartSil} className="w-full bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-500 flex items-center justify-center"><Trash2 size={18} /></div>{t.del}
              </button>
            </div>
            <button onClick={() => setIsAksiyonModalAcik(false)} className="w-full mt-6 py-4 rounded-2xl font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 text-sm">{t.giveup}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Card;