import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Wallet, TrendingUp, LayoutGrid, Zap, ArrowDownRight, ArrowUpRight, CreditCard, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '../supabaseClient';

function Islemler() {
  const [aktifFiltre, setAktifFiltre] = useState('Tümü');
  const [islemGecmisi, setIslemGecmisi] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verileriGetir();
  }, []);

  async function verileriGetir() {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('islemler')
      .select(`
        *,
        hesaplar ( ad )
      `)
      .order('tarih', { ascending: false });

    if (error) {
      console.error("Veri çekme hatası:", error);
    } else {
      const formatliIslemler = data.map(islem => {
        let tur = islem.tutar > 0 ? 'Gelir' : 'Gider';
        const kategoriAdi = (islem.kategori_adi || "").toLowerCase();
        
        // GENİŞLETİLMİŞ KATEGORİ TANIMA
        const yatirimTurleri = ['yatırım', 'yatirim', 'hisse', 'fon', 'döviz', 'doviz', 'kripto', 'altın', 'altin'];
        const borcTurleri = ['borç', 'borc', 'kredi', 'taksit'];

        if (yatirimTurleri.includes(kategoriAdi)) {
          tur = 'Yatırım';
        } else if (borcTurleri.includes(kategoriAdi)) {
          tur = 'Borç';
        }

        let ikon = LayoutGrid;
        let renk = 'text-orange-500 dark:text-orange-400';
        let bg = 'bg-orange-100 dark:bg-orange-900/30';

        if (tur === 'Gelir') {
          ikon = ArrowUpRight;
          renk = 'text-[#84cc16]';
          bg = 'bg-emerald-50 dark:bg-emerald-900/20';
        } else if (tur === 'Yatırım') {
          ikon = Zap;
          renk = 'text-blue-500 dark:text-blue-400';
          bg = 'bg-blue-50 dark:bg-blue-900/30';
        } else if (tur === 'Borç') {
          ikon = CreditCard;
          renk = 'text-purple-600 dark:text-purple-400';
          bg = 'bg-purple-100 dark:bg-purple-900/30';
        } else if (tur === 'Gider') {
          ikon = ArrowDownRight;
          renk = 'text-red-500 dark:text-red-400';
          bg = 'bg-red-50 dark:bg-red-900/30';
        }

        return {
          id: islem.id,
          tur: tur,
          kategori: islem.kategori_adi || "Diğer", 
          aciklama: islem.aciklama,
          tarih: new Date(islem.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
          tutar: islem.tutar,
          hesap: islem.hesaplar?.ad || "Genel Hesap",
          ikon: ikon,
          renk: renk,
          bg: bg
        };
      });
      
      setIslemGecmisi(formatliIslemler);
    }
    setLoading(false);
  }

  const filtrelenmisIslemler = islemGecmisi.filter(islem => {
    if (aktifFiltre === 'Tümü') return true;
    return islem.tur === aktifFiltre;
  });

  const verileriDisaAktar = () => {
    const basliklar = ['İşlem ID', 'Tür', 'Kategori', 'Açıklama', 'Tutar (TL)', 'Hesap', 'Tarih'];
    const csvSatirlari = filtrelenmisIslemler.map(islem => {
      return [
        islem.id,
        islem.tur,
        islem.kategori,
        `"${islem.aciklama || ''}"`, 
        islem.tutar,
        islem.hesap,
        islem.tarih
      ].join(',');
    });

    const csvVerisi = '\uFEFF' + [basliklar.join(','), ...csvSatirlari].join('\n');
    const blob = new Blob([csvVerisi], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'finans_verilerim.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toplamTutar = filtrelenmisIslemler.reduce((toplam, islem) => toplam + Number(islem.tutar), 0);

  const kategoriToplamlari = filtrelenmisIslemler.reduce((acc, islem) => {
    const miktar = Math.abs(Number(islem.tutar));
    acc[islem.kategori] = (acc[islem.kategori] || 0) + miktar;
    return acc;
  }, {});

  const grafikVerisi = Object.keys(kategoriToplamlari).map(key => ({
    name: key,
    value: kategoriToplamlari[key]
  })).sort((a, b) => b.value - a.value);

  const RENKLER = ['#0B3B24', '#84cc16', '#134e34', '#bef264', '#f59e0b', '#3b82f6'];

  return (
    // DİKKAT: dark:bg-gray-900 eklendi
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans pb-10 transition-colors duration-300">
      
      {/* HEADER */}
      <header className="px-6 py-5 bg-white dark:bg-gray-800 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10 transition-colors">
        <Link to="/" className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors -ml-2">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="font-bold text-gray-900 dark:text-white text-lg tracking-wide">İşlem Geçmişi</h1>
        
        <div className="flex items-center gap-2 -mr-2">
          <button className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-full transition-colors">
            <Search size={20} />
          </button>
          <button 
            onClick={verileriDisaAktar}
            className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 p-2 rounded-full transition-colors"
            title="Excel'e İndir"
          >
            <Download size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-6">
        
        {/* FİLTRELER */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {['Tümü', 'Gider', 'Gelir', 'Yatırım', 'Borç'].map((filtre) => (
            <button
              key={filtre}
              onClick={() => setAktifFiltre(filtre)}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                aktifFiltre === filtre 
                  ? 'bg-[#0B3B24] dark:bg-[#062616] text-[#84cc16] shadow-md' 
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {filtre}
            </button>
          ))}
        </div>

        {/* TOPLAM KARTI (Zaten koyu yeşil olduğu için gece moduna da çok iyi uyum sağlar) */}
        <div className="bg-[#134e34] dark:bg-[#0a2e1f] rounded-3xl p-6 shadow-md text-white flex items-center justify-between relative overflow-hidden transition-colors">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl"></div>
          <div>
            <p className="text-[#84cc16] text-xs font-bold uppercase tracking-widest mb-1">
              {aktifFiltre === 'Tümü' ? 'Net Durum' : `Toplam ${aktifFiltre}`}
            </p>
            <h2 className="text-3xl font-bold tracking-tight">
              {toplamTutar.toLocaleString('tr-TR')} ₺
            </h2>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
             <Wallet size={24} className="text-white" />
          </div>
        </div>

        {/* GRAFİK */}
        {grafikVerisi.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <h3 className="text-gray-900 dark:text-white font-bold text-sm mb-4 text-center uppercase tracking-wider">
              {aktifFiltre} Dağılımı
            </h3>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={grafikVerisi}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {grafikVerisi.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RENKLER[index % RENKLER.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `₺ ${value.toLocaleString('tr-TR')}`}
                    contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', fontSize: '12px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* İŞLEM LİSTESİ */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
          {loading ? (
            <p className="p-8 text-center text-gray-400 dark:text-gray-500 font-bold animate-pulse">Veriler çekiliyor...</p>
          ) : filtrelenmisIslemler.map((islem, index) => {
            const Ikon = islem.ikon;
            const isLast = index === filtrelenmisIslemler.length - 1;
            
            return (
              <div key={islem.id} className={`p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${!isLast ? 'border-b border-gray-50 dark:border-gray-700' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${islem.bg} ${islem.renk}`}>
                    <Ikon size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-[15px]">{islem.kategori}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{islem.hesap} • {islem.tarih}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-[15px] ${islem.tutar > 0 ? 'text-[#84cc16]' : 'text-gray-900 dark:text-gray-100'}`}>
                    {islem.tutar > 0 ? '+' : ''}{Number(islem.tutar).toLocaleString('tr-TR')} ₺
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-1">{islem.tur}</p>
                </div>
              </div>
            );
          })}
          
          {!loading && filtrelenmisIslemler.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
              Bu filtreye ait işlem bulunamadı.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Islemler;