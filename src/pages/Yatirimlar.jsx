import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, PieChart as PieChartIcon, Briefcase, Zap, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '../supabaseClient';

function Yatirimlar() {
  const [toplamYatirim, setToplamYatirim] = useState(0);
  const [grafikVerisi, setGrafikVerisi] = useState([]);
  const [varlikDagilimi, setVarlikDagilimi] = useState([]); // THYAO, Çeyrek vb. detaylı liste
  const [loading, setLoading] = useState(true);

  const RENKLER = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'];

  useEffect(() => {
    portfoyuGetir();
  }, []);

  async function portfoyuGetir() {
    setLoading(true);
    const yatirimTurleri = ['yatırım', 'yatirim', 'hisse', 'fon', 'döviz', 'doviz', 'kripto', 'altın', 'altin'];

    const { data, error } = await supabase
      .from('islemler')
      .select('*')
      .order('tarih', { ascending: false });

    if (!error && data) {
      let genelToplam = 0;
      const kategoriToplami = {};
      const detayliVarliklar = {};

      data.forEach(islem => {
        const kategori = (islem.kategori_adi || "").toLowerCase();
        const miktar = Math.abs(Number(islem.tutar));

        // Sadece yatırım kategorilerini filtrele
        if (yatirimTurleri.includes(kategori)) {
          genelToplam += miktar;

          // 1. Grafik için Ana Kategori Gruplaması (Örn: Hisse, Altın)
          const gorselKategori = islem.kategori_adi;
          kategoriToplami[gorselKategori] = (kategoriToplami[gorselKategori] || 0) + miktar;

          // 2. Liste için "Alt Detay" Gruplaması (Örn: THYAO, Çeyrek)
          // YeniKayit'te köşeli parantez içine almıştık [THYAO], onu yakalıyoruz
          let varlikAdi = gorselKategori; 
          let etiket = "";
          
          if (islem.aciklama && islem.aciklama.startsWith('[')) {
            const closingIndex = islem.aciklama.indexOf(']');
            if (closingIndex > -1) {
              etiket = islem.aciklama.substring(1, closingIndex); // THYAO'yu çeker
              varlikAdi = etiket;
            }
          }

          // Aynı varlığa ait alımları topluyoruz
          if (!detayliVarliklar[varlikAdi]) {
            detayliVarliklar[varlikAdi] = { ad: varlikAdi, tur: gorselKategori, toplamMiktar: 0, islemSayisi: 0 };
          }
          detayliVarliklar[varlikAdi].toplamMiktar += miktar;
          detayliVarliklar[varlikAdi].islemSayisi += 1;
        }
      });

      // Grafik verisini Recharts formatına çevirme
      const chartData = Object.keys(kategoriToplami).map(key => ({
        name: key,
        value: kategoriToplami[key]
      })).sort((a, b) => b.value - a.value);

      // Liste verisini diziye çevirip büyükten küçüğe sıralama
      const listData = Object.values(detayliVarliklar).sort((a, b) => b.toplamMiktar - a.toplamMiktar);

      setToplamYatirim(genelToplam);
      setGrafikVerisi(chartData);
      setVarlikDagilimi(listData);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#f8fafc] flex flex-col font-sans pb-10">
      {/* Üst Kısım / Header */}
      <header className="px-6 py-5 bg-white flex items-center justify-between border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <Link to="/" className="text-gray-800 hover:bg-gray-100 p-2 rounded-full transition-colors -ml-2">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="font-bold text-gray-900 text-lg tracking-wide">Yatırım Portföyü</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-6">
        
        {/* Toplam Portföy Büyüklüğü */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-center mb-2 relative z-10">
            <span className="text-blue-200 text-xs font-bold uppercase tracking-widest">Toplam Varlık Değeri</span>
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Briefcase size={20} className="text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-bold tracking-tight relative z-10">
            {loading ? "..." : `₺ ${toplamYatirim.toLocaleString('tr-TR')}`}
          </h2>
        </div>

        {/* Varlık Dağılımı Grafiği (Donut Chart) */}
        {grafikVerisi.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <PieChartIcon size={18} className="text-blue-500" />
              <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wider">Varlık Dağılımı</h3>
            </div>
            
            <div className="h-48 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={grafikVerisi}
                    cx="50%"
                    cy="50%"
                    innerRadius={60} // Donut şekli için içi boş
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {grafikVerisi.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RENKLER[index % RENKLER.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `₺ ${value.toLocaleString('tr-TR')}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Ortadaki Yazı */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-gray-400 font-bold uppercase">Çeşitlilik</span>
                <span className="text-lg font-bold text-gray-800">{grafikVerisi.length} Tür</span>
              </div>
            </div>

            {/* Lejant */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
              {grafikVerisi.map((item, index) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: RENKLER[index % RENKLER.length] }}></div>
                  {item.name}
                  <span className="text-gray-400 font-medium ml-1">
                    (%{((item.value / toplamYatirim) * 100).toFixed(1)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detaylı Varlık Listesi */}
        <div>
          <h3 className="text-gray-900 font-bold text-sm mb-3 ml-2 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={16} className="text-gray-500" /> Detaylı Pozisyonlar
          </h3>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <p className="p-8 text-center text-gray-400">Yükleniyor...</p>
            ) : varlikDagilimi.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                <AlertCircle size={32} className="mb-2 opacity-50" />
                <p className="text-sm font-medium">Henüz bir yatırımınız bulunmuyor.</p>
              </div>
            ) : (
              varlikDagilimi.map((varlik, index) => {
                const isLast = index === varlikDagilimi.length - 1;
                // Varlık türüne göre renk seçimi
                let iconBg = 'bg-blue-50';
                let iconColor = 'text-blue-500';
                if (varlik.tur === 'Altın') { iconBg = 'bg-yellow-50'; iconColor = 'text-yellow-500'; }
                if (varlik.tur === 'Kripto') { iconBg = 'bg-orange-50'; iconColor = 'text-orange-500'; }
                if (varlik.tur === 'Döviz') { iconBg = 'bg-emerald-50'; iconColor = 'text-emerald-500'; }

                return (
                  <div key={varlik.ad} className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${!isLast ? 'border-b border-gray-50' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
                        <Zap size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-[15px] uppercase">{varlik.ad}</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">{varlik.tur} • {varlik.islemSayisi} İşlem</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[15px] text-gray-900">
                        ₺ {varlik.toplamMiktar.toLocaleString('tr-TR')}
                      </p>
                      <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mt-1">
                        Toplam Alım
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

export default Yatirimlar;