import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Wallet, TrendingUp, CreditCard, RefreshCw, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

function Islemler() {
const [aktifFiltre, setAktifFiltre] = useState('Tümü'); // Sayfa açıldığında hepsi görünsün
const [islemGecmisi, setIslemGecmisi] = useState([]);

// Veritabanından verileri çekme
useEffect(() => {
// Promise.all ile 3 farklı tablodan aynı anda veri çekiyoruz
Promise.all([
fetch("http://127.0.0.1:8000/islemler/").then(res => res.json()),
fetch("http://127.0.0.1:8000/hesaplar/").then(res => res.json()),
fetch("http://127.0.0.1:8000/kategoriler/").then(res => res.json())
])
.then(([islemlerData, hesaplarData, kategorilerData]) => {

  // Gelen ham verileri, senin harika tasarımına uygun hale getiriyoruz
  const formatliIslemler = islemlerData.map(islem => {
    // ID'leri kullanarak Hesap ve Kategori isimlerini buluyoruz
    const bagliHesap = hesaplarData.find(h => h.id === islem.hesap_id)?.ad || "Bilinmeyen Hesap";
    const bagliKategori = kategorilerData.find(k => k.id === islem.kategori_id)?.ad || "Diğer";
    
    // Şimdilik eklediğimiz her işlemi 'Gider' olarak kabul ediyoruz (Tasarımın bozulmasın diye eksi değer veriyoruz)
    return {
      id: islem.id,
      tur: 'Gider', 
      kategori: islem.aciklama || bagliKategori,
      tarih: new Date(islem.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      tutar: -Math.abs(islem.tutar), 
      hesap: bagliHesap,
      ikon: LayoutGrid, // Şimdilik varsayılan ikon
      renk: 'text-orange-500',
      bg: 'bg-orange-100'
    };
  });

  // En son eklenen en üstte görünsün diye ters çeviriyoruz
  setIslemGecmisi(formatliIslemler.reverse());
})
.catch(err => console.log("Veri çekme hatası:", err));
}, []);

// 1. İşlemleri Filtrele
const filtrelenmisIslemler = islemGecmisi.filter(islem => {
if (aktifFiltre === 'Tümü') return true;
return islem.tur === aktifFiltre;
});

// 2. Toplam Tutarı Hesapla
const toplamTutar = filtrelenmisIslemler.reduce((toplam, islem) => toplam + islem.tutar, 0);

// 3. GRAFİK İÇİN VERİ GRUPLAMA
const kategoriToplamlari = filtrelenmisIslemler.reduce((acc, islem) => {
const miktar = Math.abs(islem.tutar);
acc[islem.kategori] = (acc[islem.kategori] || 0) + miktar;
return acc;
}, {});

const grafikVerisi = Object.keys(kategoriToplamlari).map(key => ({
name: key,
value: kategoriToplamlari[key]
})).sort((a, b) => b.value - a.value);

const RENKLER = ['#0B3B24', '#84cc16', '#134e34', '#bef264', '#f59e0b', '#3b82f6'];

return (
<div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col font-sans pb-10">

  <header className="px-6 py-5 bg-white flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
    <Link to="/" className="text-gray-800 hover:bg-gray-100 p-2 rounded-full transition-colors -ml-2">
      <ArrowLeft size={24} />
    </Link>
    <h1 className="font-bold text-gray-900 text-lg tracking-wide">İşlem Geçmişi</h1>
    <button className="text-gray-800 hover:bg-gray-100 p-2 rounded-full transition-colors -mr-2">
      <Search size={20} />
    </button>
  </header>

  <main className="flex-1 p-6 flex flex-col gap-6">
    
    {/* Filtreleme Sekmeleri */}
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {['Tümü', 'Gider', 'Gelir', 'Yatırım', 'Borç'].map((filtre) => (
        <button
          key={filtre}
          onClick={() => setAktifFiltre(filtre)}
          className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
            aktifFiltre === filtre 
              ? 'bg-[#0B3B24] text-[#84cc16] shadow-md' 
              : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          {filtre}
        </button>
      ))}
    </div>

    {/* Toplam Özet Kartı */}
    <div className="bg-[#134e34] rounded-3xl p-6 shadow-md text-white flex items-center justify-between relative overflow-hidden">
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white opacity-5 rounded-full blur-2xl"></div>
      <div>
        <p className="text-[#84cc16] text-xs font-bold uppercase tracking-widest mb-1">
          {aktifFiltre === 'Tümü' ? 'Net Durum' : `Toplam ${aktifFiltre}`}
        </p>
        <h2 className="text-3xl font-bold tracking-tight">
          {toplamTutar > 0 && aktifFiltre !== 'Gider' && aktifFiltre !== 'Borç' ? '+' : ''}
          {toplamTutar} ₺
        </h2>
      </div>
      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
         <Wallet size={24} className="text-white" />
      </div>
    </div>

    {/* DİNAMİK KATEGORİ GRAFİĞİ */}
    {aktifFiltre !== 'Tümü' && grafikVerisi.length > 0 && (
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-gray-900 font-bold text-sm mb-4 text-center uppercase tracking-wider">
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
                formatter={(value) => `₺ ${value}`}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Lejant */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
          {grafikVerisi.map((item, index) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RENKLER[index % RENKLER.length] }}></div>
              {item.name}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* İşlemler Listesi */}
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {filtrelenmisIslemler.map((islem, index) => {
        const Ikon = islem.ikon;
        const isLast = index === filtrelenmisIslemler.length - 1;
        
        return (
          <div key={islem.id} className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer ${!isLast ? 'border-b border-gray-50' : ''}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${islem.bg} ${islem.renk}`}>
                <Ikon size={22} />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-[15px]">{islem.kategori}</p>
                <p className="text-xs text-gray-500 mt-0.5 font-medium">{islem.hesap} • {islem.tarih}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold text-[15px] ${islem.tutar > 0 ? 'text-[#84cc16]' : 'text-gray-900'}`}>
                {islem.tutar > 0 ? '+' : ''}{islem.tutar} ₺
              </p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{islem.tur}</p>
            </div>
          </div>
        );
      })}
      
      {filtrelenmisIslemler.length === 0 && (
        <div className="p-8 text-center text-gray-500 text-sm font-medium">
          Bu kategoride henüz bir işlem bulunmuyor.
        </div>
      )}
    </div>
  </main>

</div>
);
}

export default Islemler;