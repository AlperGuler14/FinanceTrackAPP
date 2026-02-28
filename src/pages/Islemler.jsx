import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Wallet, LayoutGrid, Zap, ArrowDownRight, ArrowUpRight, CreditCard, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '../supabaseClient';
import { useSettings } from '../SettingsContext'; 

// YENİ: İŞLEMLER SÖZLÜĞÜ
const DICTIONARY = {
  TR: { title: "İşlem Geçmişi", all: "Tümü", exp: "Gider", inc: "Gelir", inv: "Yatırım", debt: "Borç", net: "Net Durum", total: "Toplam", dist: "Dağılımı", noTx: "Bu filtreye ait işlem bulunamadı.", load: "Veriler çekiliyor..." },
  EN: { title: "Transaction History", all: "All", exp: "Expense", inc: "Income", inv: "Investment", debt: "Debt", net: "Net Status", total: "Total", dist: "Distribution", noTx: "No transactions found for this filter.", load: "Fetching data..." }
};

function Islemler() {
  const { currency, language } = useSettings(); 
  const t = DICTIONARY[language] || DICTIONARY.TR;

  // DİNAMİK FİLTRE DİZİSİ
  const filtreler = [t.all, t.exp, t.inc, t.inv, t.debt];
  
  const [aktifFiltre, setAktifFiltre] = useState(t.all);
  const [islemGecmisi, setIslemGecmisi] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dil değiştiğinde filtreyi sıfırla ki isim çakışması olmasın
  useEffect(() => { setAktifFiltre(t.all); }, [language]);

  useEffect(() => { verileriGetir(); }, []);

  async function verileriGetir() {
    setLoading(true);
    const { data, error } = await supabase.from('islemler').select('*, hesaplar ( ad )').order('tarih', { ascending: false });

    if (error) { console.error("Hata:", error); } 
    else {
      setIslemGecmisi(data.map(islem => {
        let tur = islem.tutar > 0 ? t.inc : t.exp;
        const katAdi = (islem.kategori_adi || "").toLowerCase();
        
        if (['yatırım', 'yatirim', 'hisse', 'fon', 'döviz', 'doviz', 'kripto', 'altın'].includes(katAdi)) tur = t.inv;
        else if (['borç', 'borc', 'kredi', 'taksit'].includes(katAdi)) tur = t.debt;

        let ikon = LayoutGrid, renk = 'text-orange-500', bg = 'bg-orange-100 dark:bg-orange-900/30';
        if (tur === t.inc) { ikon = ArrowUpRight; renk = 'text-[#84cc16]'; bg = 'bg-emerald-50 dark:bg-emerald-900/20'; } 
        else if (tur === t.inv) { ikon = Zap; renk = 'text-blue-500'; bg = 'bg-blue-50 dark:bg-blue-900/30'; } 
        else if (tur === t.debt) { ikon = CreditCard; renk = 'text-purple-600'; bg = 'bg-purple-100 dark:bg-purple-900/30'; } 
        else if (tur === t.exp) { ikon = ArrowDownRight; renk = 'text-red-500'; bg = 'bg-red-50 dark:bg-red-900/30'; }

        return {
          id: islem.id, tur, kategori: islem.kategori_adi || "Diğer", aciklama: islem.aciklama,
          tarih: new Date(islem.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
          tutar: islem.tutar, hesap: islem.hesaplar?.ad || "Genel Hesap", ikon, renk, bg
        };
      }));
    }
    setLoading(false);
  }

  const filtrelenmisIslemler = islemGecmisi.filter(is => aktifFiltre === t.all || is.tur === aktifFiltre);

  const verileriDisaAktar = () => {
    const basliklar = ['İşlem ID', 'Tür', 'Kategori', 'Açıklama', `Tutar (${currency})`, 'Hesap', 'Tarih'];
    const csvSatirlari = filtrelenmisIslemler.map(is => [is.id, is.tur, is.kategori, `"${is.aciklama || ''}"`, is.tutar, is.hesap, is.tarih].join(','));
    const blob = new Blob(['\uFEFF' + [basliklar.join(','), ...csvSatirlari].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.setAttribute('download', 'finans_verilerim.csv');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const toplamTutar = filtrelenmisIslemler.reduce((toplam, islem) => toplam + Number(islem.tutar), 0);
  const kategoriToplamlari = filtrelenmisIslemler.reduce((acc, islem) => {
    acc[islem.kategori] = (acc[islem.kategori] || 0) + Math.abs(Number(islem.tutar)); return acc;
  }, {});
  const grafikVerisi = Object.keys(kategoriToplamlari).map(key => ({ name: key, value: kategoriToplamlari[key] })).sort((a, b) => b.value - a.value);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans pb-10 transition-colors duration-300">
      <header className="px-6 py-5 bg-white dark:bg-gray-800 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10 transition-colors">
        <Link to="/" className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 p-2 rounded-full -ml-2"><ArrowLeft size={24} /></Link>
        <h1 className="font-bold text-gray-900 dark:text-white text-lg tracking-wide">{t.title}</h1>
        <div className="flex items-center gap-2 -mr-2">
          <button className="text-gray-800 dark:text-gray-200 p-2 rounded-full"><Search size={20} /></button>
          <button onClick={verileriDisaAktar} className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-full" title="Excel'e İndir"><Download size={20} /></button>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filtreler.map(filtre => (
            <button key={filtre} onClick={() => setAktifFiltre(filtre)} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${aktifFiltre === filtre ? 'bg-[#0B3B24] dark:bg-[#062616] text-[#84cc16] shadow-md' : 'bg-white dark:bg-gray-800 text-gray-500'}`}>{filtre}</button>
          ))}
        </div>

        <div className="bg-[#134e34] dark:bg-[#0a2e1f] rounded-3xl p-6 shadow-md text-white flex items-center justify-between relative overflow-hidden transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl"></div>
          <div>
            <p className="text-[#84cc16] text-xs font-bold uppercase tracking-widest mb-1">{aktifFiltre === t.all ? t.net : `${t.total} ${aktifFiltre}`}</p>
            <h2 className="text-3xl font-bold tracking-tight">{toplamTutar.toLocaleString('tr-TR')} {currency}</h2>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm"><Wallet size={24} /></div>
        </div>

        {grafikVerisi.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <h3 className="text-gray-900 dark:text-white font-bold text-sm mb-4 text-center uppercase tracking-wider">{aktifFiltre} {t.dist}</h3>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={grafikVerisi} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                    {grafikVerisi.map((e, i) => <Cell key={`cell-${i}`} fill={['#0B3B24', '#84cc16', '#134e34', '#bef264', '#f59e0b', '#3b82f6'][i % 6]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `${currency} ${value.toLocaleString('tr-TR')}`} contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '12px', border: 'none' }} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
          {loading ? <p className="p-8 text-center text-gray-400 animate-pulse">{t.load}</p> : filtrelenmisIslemler.map((islem, index) => {
            const Ikon = islem.ikon;
            return (
              <div key={islem.id} className={`p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${index !== filtrelenmisIslemler.length - 1 ? 'border-b border-gray-50 dark:border-gray-700' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${islem.bg} ${islem.renk}`}><Ikon size={22} /></div>
                  <div><p className="font-bold text-gray-900 dark:text-white text-[15px]">{islem.kategori}</p><p className="text-xs text-gray-500 mt-0.5 font-medium">{islem.hesap} • {islem.tarih}</p></div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-[15px] ${islem.tutar > 0 ? 'text-[#84cc16]' : 'text-gray-900 dark:text-gray-100'}`}>{islem.tutar > 0 ? '+' : ''}{Number(islem.tutar).toLocaleString('tr-TR')} {currency}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{islem.tur}</p>
                </div>
              </div>
            );
          })}
          {!loading && filtrelenmisIslemler.length === 0 && <div className="p-8 text-center text-gray-500 text-sm font-medium">{t.noTx}</div>}
        </div>
      </main>
    </div>
  );
}

export default Islemler;