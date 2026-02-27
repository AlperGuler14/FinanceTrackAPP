import { useState, useEffect } from 'react';
import { Search, MoreHorizontal, LayoutGrid, TrendingUp, CreditCard, Wallet, Home, User, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

function Dashboard() {
// Arka plandan gelecek verileri tutacağımız state'ler
const [hesaplar, setHesaplar] = useState([]);
const [islemler, setIslemler] = useState([]);
const [toplamBakiye, setToplamBakiye] = useState(0);

// Sayfa yüklendiğinde veritabanına bağlanıp verileri çekiyoruz
useEffect(() => {
// 1. Hesapları ve Bakiyeleri Çek
fetch("http://127.0.0.1:8000/hesaplar/")
.then(res => res.json())
.then(data => {
setHesaplar(data);
// Bütün hesaplardaki bakiyeleri toplayıp ana ekrana yazdıracağız
const toplam = data.reduce((acc, hesap) => acc + hesap.bakiye, 0);
setToplamBakiye(toplam);
})
.catch(err => console.log("Hesap hatası:", err));

// 2. Son İşlemleri Çek
fetch("[http://127.0.0.1:8000/islemler/](http://127.0.0.1:8000/islemler/)")
  .then(res => res.json())
  .then(data => {
    // En son yapılan işlemleri en üste almak için ters çevirip ilk 4'ünü alıyoruz
    setIslemler(data.reverse().slice(0, 4));
  })
  .catch(err => console.log("İşlem hatası:", err));
}, []);

return (
<div className="max-w-md mx-auto min-h-screen bg-[#f3f4f6] shadow-xl overflow-hidden relative">

  {/* Üst Karşılama Alanı */}
  <div className="px-6 pt-12 pb-4">
    <div className="flex justify-between items-start mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          Merhaba<br />Alper!
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Finansal durumunun güncel özeti.
        </p>
      </div>
      <div className="flex gap-3 items-center">
        <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
            <img src="[https://api.dicebear.com/7.x/avataaars/svg?seed=Alper](https://api.dicebear.com/7.x/avataaars/svg?seed=Alper)" alt="Profile" />
        </div>
        <button className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
          <LayoutGrid size={20} className="text-gray-700" />
        </button>
      </div>
    </div>

    {/* Ana Kart: Toplam Net Varlık */}
    <div className="bg-[#0B3B24] rounded-[2rem] p-6 text-white relative overflow-hidden shadow-lg mb-6 mt-2">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 bg-[#134e34] px-3 py-1 rounded-full w-max">
          <div className="w-2 h-2 rounded-full bg-[#84cc16]"></div>
          <span className="text-xs font-medium">Güncel Varlık</span>
        </div>
        <button className="text-gray-300 hover:text-white">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <p className="text-sm text-gray-300 mb-1">Toplam Net Değerin</p>
      <div className="flex items-baseline gap-2 mb-6">
        <h2 className="text-4xl font-bold tracking-tight">
          {/* Burası artık veritabanından geliyor! */}
          ₺ {toplamBakiye.toLocaleString('tr-TR')}
        </h2>
      </div>
      
      <div className="flex items-center justify-between text-sm border-t border-[#1a5c3f] pt-4 mt-2">
        <div className="flex flex-col">
          <span className="text-gray-400 text-xs">Hesap Sayısı</span>
          <span className="text-[#84cc16] font-medium flex items-center gap-1 mt-0.5">
            {hesaplar.length} Aktif Hesap
          </span>
        </div>
        <button className="text-sm font-medium text-gray-300 hover:text-white flex items-center gap-1 transition-colors bg-[#134e34] px-3 py-1.5 rounded-xl">
          Raporları Gör
        </button>
      </div>
    </div>

    {/* Özet Kartları (Şimdilik tasarım bozulmasın diye sabit bıraktım) */}
    <div className="flex gap-4">
      <div className="bg-white flex-1 rounded-[1.5rem] p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Aktif Yatırım</span>
          <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600">
            <TrendingUp size={16} />
          </div>
        </div>
        <div className="text-xl font-bold text-gray-900 mb-1">₺ 85.000</div>
        <div className="flex items-center text-xs font-medium text-[#84cc16]">
          <ArrowUpRight size={12} className="mr-0.5" /> +5.2% getiri
        </div>
      </div>

      <div className="bg-white flex-1 rounded-[1.5rem] p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Kalan Borç</span>
          <div className="bg-red-50 p-1.5 rounded-lg text-red-500">
            <CreditCard size={16} />
          </div>
        </div>
        <div className="text-xl font-bold text-gray-900 mb-1">₺ 18.200</div>
        <div className="flex items-center text-xs font-medium text-red-500">
          <ArrowDownRight size={12} className="mr-0.5" /> Yaklaşan ödeme
        </div>
      </div>
    </div>
  </div>

  {/* İşlem Geçmişi (Artık Veritabanından Geliyor!) */}
  <div className="px-6 pb-28 pt-2 bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.03)] mt-2 min-h-[300px]">
    <div className="flex justify-between items-center mb-6 pt-2">
      <h3 className="text-gray-900 font-bold text-lg">Son Hareketler</h3>
      <Link to="/islemler" className="text-sm text-[#84cc16] font-medium">Tümünü Gör</Link>
    </div>

    <div className="flex flex-col gap-5">
      {islemler.length === 0 ? (
        <p className="text-gray-500 text-center text-sm">Henüz bir işlem bulunmuyor.</p>
      ) : (
        islemler.map((islem) => (
          <div key={islem.id} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                <Wallet size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="text-[0.95rem] font-bold text-gray-900">{islem.aciklama}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(islem.tarih).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[0.95rem] font-bold text-gray-900">₺ {islem.tutar}</p>
            </div>
          </div>
        ))
      )}
    </div>
  </div>

  {/* Dinamik Alt Menü */}
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md bg-[#0B3B24] rounded-full px-6 py-3 flex justify-between items-center shadow-2xl z-50">
    <button className="text-[#84cc16] flex flex-col items-center gap-1 transition-transform hover:scale-110">
      <Home size={22} strokeWidth={2.5} />
    </button>
    <Link to="/islemler" className="text-gray-400 hover:text-white transition-colors">
      <Wallet size={22} />
    </Link>
    <Link 
      to="/yeni-kayit"
      className="bg-[#84cc16] text-[#0B3B24] p-3 rounded-full shadow-[0_0_15px_rgba(132,204,22,0.4)] -translate-y-4 hover:scale-105 transition-transform border-4 border-[#f3f4f6] flex items-center justify-center"
    >
      <TrendingUp size={24} strokeWidth={2.5} />
    </Link>
    <Link to="/Card" className="text-gray-400 hover:text-white transition-colors">
      <CreditCard size={22} />
    </Link>
    <Link to="/Profile" className="text-gray-400 hover:text-white transition-colors">
      <User size={22} />
    </Link>
  </div>

</div>
);
}

export default Dashboard;