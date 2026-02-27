import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, AlignLeft, ChevronRight, LayoutGrid, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function YeniKayit() {
const navigate = useNavigate();

const [hesaplarListesi, setHesaplarListesi] = useState([]);
const [kategoriListesi, setKategoriListesi] = useState([]);

const [islemTuru, setIslemTuru] = useState("Gider");
const [tutar, setTutar] = useState("");
const [hesapId, setHesapId] = useState("");
const [kategoriAdi, setKategoriAdi] = useState(""); // Artık ID değil, metin tutuyoruz
const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0]);
const [aciklama, setAciklama] = useState("");

useEffect(() => {
fetch("http://127.0.0.1:8000/hesaplar/")
.then(res => res.json())
.then(data => {
setHesaplarListesi(data);
if (data.length > 0) setHesapId(data[0].id);
});

fetch("[http://127.0.0.1:8000/kategoriler/](http://127.0.0.1:8000/kategoriler/)")
  .then(res => res.json())
  .then(data => {
    setKategoriListesi(data);
  });
}, []);

const handleKaydet = () => {
if (!tutar || isNaN(tutar) || tutar <= 0) {
alert("Lütfen geçerli bir tutar girin!");
return;
}
if (!kategoriAdi.trim()) {
alert("Lütfen bir kategori adı yazın veya seçin!");
return;
}

const gonderilecekTutar = islemTuru === "Gider" || islemTuru === "Borç" 
  ? -Math.abs(Number(tutar)) 
  : Math.abs(Number(tutar));

// API'nin beklediği paket (Artık kategori_adi yolluyoruz)
const islemPaketi = {
  tutar: gonderilecekTutar,
  aciklama: aciklama || islemTuru,
  hesap_id: Number(hesapId),
  kategori_adi: kategoriAdi.trim()
};

fetch("[http://127.0.0.1:8000/islemler/](http://127.0.0.1:8000/islemler/)", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(islemPaketi)
})
.then(res => {
  if (res.ok) {
    navigate("/"); 
  } else {
    alert("Kaydedilirken bir hata oluştu.");
  }
})
.catch(err => console.log("Gönderme hatası:", err));
};

return (
<div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col font-sans">

  <header className="px-6 py-5 bg-white flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
    <Link to="/" className="text-gray-800 hover:bg-gray-100 p-2 rounded-full transition-colors -ml-2">
      <ArrowLeft size={24} />
    </Link>
    <h1 className="font-bold text-gray-900 text-lg tracking-wide">Yeni İşlem</h1>
    <div className="w-10"></div>
  </header>

  <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto pb-32">
    
    {/* İşlem Türü Seçici */}
    <div className="bg-gray-200/60 p-1 rounded-xl flex shadow-inner">
       {["Gider", "Gelir", "Borç", "Yatırım"].map((tur) => (
         <button 
            key={tur}
            onClick={() => setIslemTuru(tur)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
              islemTuru === tur 
                ? "bg-white shadow-sm text-gray-900" 
                : "text-gray-500 hover:text-gray-700"
            }`}
         >
           {tur}
         </button>
       ))}
    </div>

    {/* Tutar Girişi */}
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
       <p className="text-sm text-gray-400 mb-2 font-medium uppercase tracking-wider">İşlem Tutarı</p>
       <div className="flex items-center justify-center">
         <span className="text-4xl text-gray-300 font-medium mr-2">₺</span>
         <input 
            type="number" 
            value={tutar}
            onChange={(e) => setTutar(e.target.value)}
            placeholder="0" 
            className="text-6xl font-bold text-gray-900 w-full max-w-[200px] text-center outline-none bg-transparent placeholder-gray-200" 
            autoFocus 
         />
       </div>
    </div>

    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
       
       {/* Hesap */}
       <div className="p-4 flex items-center gap-4 border-b border-gray-50">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <Wallet size={20} />
          </div>
          <div className="flex-1 relative">
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Hesap</p>
            <select 
              value={hesapId}
              onChange={(e) => setHesapId(e.target.value)}
              className="w-full bg-transparent font-bold text-gray-800 outline-none appearance-none mt-0.5 cursor-pointer"
            >
              {hesaplarListesi.length === 0 && <option value="">Önce hesap ekleyin...</option>}
              {hesaplarListesi.map((h) => (
                <option key={h.id} value={h.id}>{h.ad} (₺{h.bakiye})</option>
              ))}
            </select>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
       </div>

       {/* ESNEK KATEGORİ GİRİŞİ */}
       <div className="p-4 flex items-center gap-4 border-b border-gray-50">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 shrink-0">
            <LayoutGrid size={20} />
          </div>
          <div className="flex-1 relative">
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Kategori Yaz veya Seç</p>
            
            {/* Datalist kullanımı: Hem yazılır, hem tıklanır */}
            <input 
              list="kategori-onerileri"
              type="text" 
              value={kategoriAdi}
              onChange={(e) => setKategoriAdi(e.target.value)}
              placeholder="Örn: Market, Kahve, Kira..."
              className="w-full bg-transparent font-bold text-gray-800 outline-none mt-0.5"
            />
            <datalist id="kategori-onerileri">
              {kategoriListesi.map((k) => (
                <option key={k.id} value={k.ad} />
              ))}
            </datalist>

          </div>
       </div>
       
       {/* Tarih */}
       <div className="p-4 flex items-center gap-4 border-b border-gray-50">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 shrink-0">
            <Calendar size={20} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Tarih</p>
            <input 
              type="date" 
              value={tarih}
              onChange={(e) => setTarih(e.target.value)}
              className="w-full bg-transparent font-bold text-gray-800 outline-none mt-0.5" 
            />
          </div>
       </div>

       {/* Açıklama */}
       <div className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
            <AlignLeft size={20} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Açıklama</p>
            <input 
              type="text" 
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              placeholder="İsteğe bağlı not..." 
              className="w-full bg-transparent font-medium text-gray-800 outline-none mt-0.5 placeholder-gray-400 text-sm" 
            />
          </div>
       </div>
    </div>

  </main>

  <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-6 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
    <button 
      onClick={handleKaydet} 
      className="w-full bg-[#0B3B24] text-[#84cc16] font-bold text-lg py-4 rounded-2xl shadow-xl hover:bg-[#134e34] active:scale-[0.98] transition-all flex justify-center items-center gap-2"
    >
      İşlemi Kaydet
    </button>
  </div>

</div>
);
}

export default YeniKayit;