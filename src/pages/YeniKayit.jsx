import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, AlignLeft, ChevronRight, LayoutGrid, Wallet, Tag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 
import { useSettings } from '../SettingsContext'; // BEYİN EKLENDİ

const DICTIONARY = {
  TR: { title: "Yeni İşlem", amount: "İşlem Tutarı", account: "Hesap", selectAcc: "Cüzdan seçin...", noAcc: "Lütfen önce hesap ekleyin.", cat: "Kategori", selectCat: "Kategori seçin...", date: "Tarih", note: "Açıklama", notePlace: "İsteğe bağlı not...", save: "İşlemi Kaydet", saving: "Kaydediliyor...", exp: "Gider", inc: "Gelir", inv: "Yatırım", debt: "Borç" },
  EN: { title: "New Record", amount: "Amount", account: "Account", selectAcc: "Select wallet...", noAcc: "Please add an account first.", cat: "Category", selectCat: "Select category...", date: "Date", note: "Note", notePlace: "Optional note...", save: "Save Record", saving: "Saving...", exp: "Expense", inc: "Income", inv: "Invest", debt: "Debt" }
};

function YeniKayit() {
  const navigate = useNavigate();
  const { currency, language } = useSettings();
  const t = DICTIONARY[language] || DICTIONARY.TR;

  const [hesaplarListesi, setHesaplarListesi] = useState([]);
  const [islemTuru, setIslemTuru] = useState("Gider"); // Arka planda DB için TR kalacak
  const [tutar, setTutar] = useState("");
  const [hesapId, setHesapId] = useState("");
  const [kategoriAdi, setKategoriAdi] = useState("");
  const [altDetay, setAltDetay] = useState(""); 
  const [tarih, setTarih] = useState(new Date().toISOString().split('T')[0]);
  const [aciklama, setAciklama] = useState("");
  const [loading, setLoading] = useState(false);

  const turCevirisi = { "Gider": t.exp, "Gelir": t.inc, "Yatırım": t.inv, "Borç": t.debt };

  const hizliKategoriler = {
    "Gider": ["Market", "Yemek", "Ulaşım", "Kira", "Fatura", "Eğlence"],
    "Gelir": ["Maaş", "Prim", "Harçlık", "Satış"],
    "Yatırım": ["Hisse", "Fon", "Döviz", "Altın", "Kripto"],
    "Borç": ["Kredi", "Kredi Kartı", "Taksit", "Elden Borç"]
  };

  const yatirimAltDetaylari = { "Altın": ["Gram", "Çeyrek", "Yarım", "Tam", "Ata"], "Döviz": ["USD", "EUR", "GBP"] };

  useEffect(() => {
    async function ilkVerileriGetir() {
      const { data: hesaplar } = await supabase.from('hesaplar').select('*');
      if (hesaplar) { setHesaplarListesi(hesaplar); if (hesaplar.length > 0) setHesapId(hesaplar[0].id); }
    }
    ilkVerileriGetir();
  }, []);

  useEffect(() => { setAltDetay(""); setKategoriAdi(""); }, [islemTuru]);

  const handleKaydet = async () => {
    if (!tutar || isNaN(tutar) || tutar <= 0) return alert(language === 'TR' ? "Lütfen geçerli bir tutar girin!" : "Please enter a valid amount!");
    if (!kategoriAdi.trim()) return alert(language === 'TR' ? "Lütfen bir kategori seçin!" : "Please select a category!");
    setLoading(true);

    const netTutar = islemTuru === "Gider" || islemTuru === "Borç" ? -Math.abs(Number(tutar)) : Math.abs(Number(tutar));
    let finalAciklama = aciklama;
    if (islemTuru === "Yatırım" && altDetay) finalAciklama = aciklama ? `[${altDetay.toUpperCase()}] ${aciklama}` : `[${altDetay.toUpperCase()}]`;
    else if (!aciklama) finalAciklama = islemTuru;

    const { error: islemHata } = await supabase.from('islemler').insert([{ tutar: netTutar, aciklama: finalAciklama, hesap_id: Number(hesapId), kategori_adi: kategoriAdi.trim(), tarih: tarih }]);
    if (islemHata) { alert("Hata: " + islemHata.message); setLoading(false); return; }

    const secilenHesap = hesaplarListesi.find(h => h.id === Number(hesapId));
    if (secilenHesap) {
      await supabase.from('hesaplar').update({ bakiye: Number(secilenHesap.bakiye) + netTutar }).eq('id', hesapId);
    }
    setLoading(false); navigate("/"); 
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col font-sans transition-colors duration-300">
      <header className="px-6 py-5 bg-white dark:bg-gray-800 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10 transition-colors">
        <Link to="/" className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 p-2 rounded-full -ml-2"><ArrowLeft size={24} /></Link>
        <h1 className="font-bold text-gray-900 dark:text-white text-lg tracking-wide">{t.title}</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto pb-32">
        
        {/* İŞLEM TÜRÜ SEÇİCİ */}
        <div className="bg-gray-200/60 dark:bg-gray-800/60 p-1 rounded-xl flex shadow-inner transition-colors">
           {["Gider", "Gelir", "Yatırım", "Borç"].map((tur) => (
             <button key={tur} onClick={() => setIslemTuru(tur)} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${islemTuru === tur ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>{turCevirisi[tur]}</button>
           ))}
        </div>

        {/* TUTAR GİRİŞİ */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center transition-colors">
           <p className="text-sm text-gray-400 dark:text-gray-500 mb-2 font-medium uppercase tracking-wider">{t.amount}</p>
           <div className="flex items-center justify-center">
             <span className="text-4xl text-gray-300 dark:text-gray-600 font-medium mr-2">{currency}</span>
             <input type="number" value={tutar} onChange={(e) => setTutar(e.target.value)} placeholder="0" className="text-6xl font-bold text-gray-900 dark:text-white w-full max-w-[200px] text-center outline-none bg-transparent placeholder-gray-200" autoFocus />
           </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
           
           {/* HESAP SEÇİMİ */}
           <div className="p-4 flex items-center gap-4 border-b border-gray-50 dark:border-gray-700 transition-colors">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0"><Wallet size={20} /></div>
              <div className="flex-1 relative">
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">{t.account}</p>
                {hesaplarListesi.length > 0 ? (
                  <select value={hesapId} onChange={(e) => setHesapId(e.target.value)} className="w-full bg-transparent font-bold text-gray-800 dark:text-white outline-none appearance-none mt-0.5 cursor-pointer dark:bg-gray-800">
                    {hesaplarListesi.map((h) => <option key={h.id} value={h.id}>{h.ad} ({currency}{h.bakiye})</option>)}
                  </select>
                ) : <p className="text-xs text-red-500 mt-1 font-bold">{t.noAcc}</p>}
              </div>
              <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
           </div>

           {/* KATEGORİ SEÇİMİ */}
           <div className="p-4 flex flex-col gap-3 border-b border-gray-50 dark:border-gray-700 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500 dark:text-orange-400 shrink-0"><LayoutGrid size={20} /></div>
                <div className="flex-1">
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{t.cat}</p>
                  <input type="text" value={kategoriAdi} onChange={(e) => setKategoriAdi(e.target.value)} placeholder={t.selectCat} className="w-full bg-transparent font-bold text-gray-800 dark:text-white outline-none mt-0.5" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pl-14">
                {hizliKategoriler[islemTuru].map((kat) => (
                  <button key={kat} onClick={() => setKategoriAdi(kat)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${kategoriAdi === kat ? 'bg-[#0B3B24] dark:bg-[#062616] text-[#84cc16]' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{kat}</button>
                ))}
              </div>
           </div>

           {/* YATIRIM DETAYI (Ekstra çipler) */}
           {islemTuru === "Yatırım" && kategoriAdi && (
             <div className="p-4 flex flex-col gap-3 border-b border-blue-50 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 dark:text-blue-400 shrink-0"><Tag size={20} /></div>
                  <div className="flex-1">
                    <p className="text-[11px] text-blue-400 font-bold uppercase tracking-wider">{kategoriAdi} Detayı</p>
                    {(kategoriAdi === "Hisse" || kategoriAdi === "Fon" || kategoriAdi === "Kripto") ? (
                      <input type="text" value={altDetay} onChange={(e) => setAltDetay(e.target.value)} placeholder="Örn: THYAO, BTC" className="w-full bg-transparent font-bold text-blue-900 dark:text-blue-100 outline-none mt-0.5 uppercase" />
                    ) : <div className="w-full bg-transparent font-bold text-blue-900 dark:text-blue-100 mt-0.5">Seçim yapın</div>}
                  </div>
                </div>
                {(kategoriAdi === "Altın" || kategoriAdi === "Döviz") && (
                  <div className="flex flex-wrap gap-2 pl-14">
                    {yatirimAltDetaylari[kategoriAdi].map((detay) => (
                      <button key={detay} onClick={() => setAltDetay(detay)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${altDetay === detay ? 'bg-blue-500 text-white shadow-sm' : 'bg-white dark:bg-gray-800 text-blue-600 border border-blue-100'}`}>{detay}</button>
                    ))}
                  </div>
                )}
             </div>
           )}

           {/* TARİH VE AÇIKLAMA */}
           <div className="p-4 flex items-center gap-4 border-b border-gray-50 dark:border-gray-700 transition-colors">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500"><Calendar size={20} /></div>
              <div className="flex-1">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{t.date}</p>
                <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} className="w-full bg-transparent font-bold text-gray-800 dark:text-white outline-none mt-0.5" style={{ colorScheme: 'dark light' }} />
              </div>
           </div>

           <div className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500"><AlignLeft size={20} /></div>
              <div className="flex-1">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{t.note}</p>
                <input type="text" value={aciklama} onChange={(e) => setAciklama(e.target.value)} placeholder={t.notePlace} className="w-full bg-transparent font-medium text-gray-800 dark:text-white outline-none mt-0.5 text-sm" />
              </div>
           </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-6 bg-gradient-to-t from-gray-50 via-gray-50 dark:from-gray-900 dark:via-gray-900 to-transparent transition-colors">
        <button onClick={handleKaydet} disabled={loading} className={`w-full ${loading ? 'bg-gray-400' : 'bg-[#0B3B24] dark:bg-[#0a2e1f]'} text-[#84cc16] font-bold text-lg py-4 rounded-2xl shadow-xl transition-all`}>
          {loading ? t.saving : t.save}
        </button>
      </div>
    </div>
  );
}

export default YeniKayit;