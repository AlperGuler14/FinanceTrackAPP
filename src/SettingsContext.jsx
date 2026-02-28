import { createContext, useState, useEffect, useContext } from 'react';

// 1. Context'i (Global Hafıza) oluşturuyoruz
export const SettingsContext = createContext();

// 2. Bu hafızayı diğer sayfalara dağıtacak olan Sağlayıcı (Provider)
export const SettingsProvider = ({ children }) => {
  // LocalStorage'dan (Tarayıcı hafızasından) verileri çek, yoksa varsayılanları kullan
  const [currency, setCurrency] = useState(localStorage.getItem('app_currency') || '₺');
  const [language, setLanguage] = useState(localStorage.getItem('app_language') || 'TR');

  // Para birimi veya dil değiştiğinde bunu hemen tarayıcı hafızasına kaydet
  useEffect(() => {
    localStorage.setItem('app_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  return (
    <SettingsContext.Provider value={{ currency, setCurrency, language, setLanguage }}>
      {children}
    </SettingsContext.Provider>
  );
};

// 3. Diğer sayfalardan bu beyni kolayca çağırmak için bir kanca (Hook)
export const useSettings = () => useContext(SettingsContext);