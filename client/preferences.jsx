import { createContext, useContext, useEffect, useState } from 'react';
import { languages, translate } from './i18n';
import { localizeOffer, localizeAccount } from './offer-content';
import { formatDate, formatMoney } from './format';

const Context = createContext(null);
export function stored(key, fallback) {
  try { return localStorage.getItem('mealloop.' + key) ?? fallback; } catch { return fallback; }
}
export function persist(key, value) { try { localStorage.setItem('mealloop.' + key, value); } catch { /* Storage may be disabled. */ } }
export function PreferencesProvider({ children }) {
  const [language, setLanguage] = useState(() => Object.hasOwn(languages, stored('language', 'uz')) ? stored('language', 'uz') : 'uz');
  const [theme, setTheme] = useState(() => {
    const saved = stored('theme', null);
    return ['light', 'dark'].includes(saved) ? saved : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  useEffect(() => { persist('language', language); document.documentElement.lang = language; }, [language]);
  useEffect(() => {
    persist('theme', theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return <Context.Provider value={{
    language, setLanguage, theme, setTheme,
    t: (key, values) => translate(language, key, values),
    money: value => formatMoney(value, language),
    date: value => formatDate(value, language),
    offer: item => localizeOffer(item, language),
    accountName: account => localizeAccount(account, language),
  }}>
    <meta name="theme-color" content={theme === 'dark' ? '#171d19' : '#f6f7f2'} />
    {children}
  </Context.Provider>;
}
export const usePreferences = () => useContext(Context);
