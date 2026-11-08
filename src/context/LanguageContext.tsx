import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Language, UI_TRANSLATIONS, TranslationKey, DISH_TRANSLATIONS_TH } from '../i18n/translations';
import { Dish, Category } from '../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
  getDishName: (dish: Dish) => string;
  getDishDescription: (dish: Dish) => string;
  getCategoryLabel: (category: Category | { id: string; label?: string; name?: string }) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'nsik_lang';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'th') return saved;
      // Default to English as primary, while auto-detecting Thai users
      if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('th')) {
        return 'th';
      }
    } catch {
      // fallback
    }
    return 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'th' : 'en');
  }, [language, setLanguage]);

  const t = useCallback(
    (key: TranslationKey): string => {
      return UI_TRANSLATIONS[language]?.[key] || UI_TRANSLATIONS.en[key] || String(key);
    },
    [language]
  );

  const getDishName = useCallback(
    (dish: Dish): string => {
      if (language === 'th') {
        const slug = dish.slug || dish.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const match = DISH_TRANSLATIONS_TH[slug] || DISH_TRANSLATIONS_TH[dish.name.toLowerCase()];
        if (match?.name) return match.name;
        if (dish.nameTH) return dish.nameTH;
      }
      return dish.name;
    },
    [language]
  );

  const getDishDescription = useCallback(
    (dish: Dish): string => {
      if (language === 'th') {
        const slug = dish.slug || dish.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const match = DISH_TRANSLATIONS_TH[slug] || DISH_TRANSLATIONS_TH[dish.name.toLowerCase()];
        if (match?.desc) return match.desc;
        if (dish.descriptionTH) return dish.descriptionTH;
      }
      return dish.description;
    },
    [language]
  );

  const getCategoryLabel = useCallback(
    (cat: Category | { id: string; label?: string; name?: string }): string => {
      const id = cat.id?.toLowerCase();
      if (language === 'th') {
        if (id === 'all') return UI_TRANSLATIONS.th.catAll;
        if (id === 'starters' || id.includes('starter') || id.includes('appetizer')) return UI_TRANSLATIONS.th.catStarters;
        if (id === 'main' || id.includes('main') || id.includes('curry')) return UI_TRANSLATIONS.th.catMainCourse;
        if (id === 'biryani' || id.includes('biryani')) return UI_TRANSLATIONS.th.catBiryani;
        if (id === 'tandoori' || id.includes('tandoor')) return UI_TRANSLATIONS.th.catTandoori;
        if (id === 'desserts' || id.includes('dessert') || id.includes('sweet')) return UI_TRANSLATIONS.th.catDesserts;
        if (id === 'beverages' || id.includes('beverage') || id.includes('drink')) return UI_TRANSLATIONS.th.catBeverages;
        if (id === 'soups' || id.includes('soup')) return UI_TRANSLATIONS.th.catSoups;
        if (id === 'salads' || id.includes('salad')) return UI_TRANSLATIONS.th.catSalads;
        if (id === 'thai') return UI_TRANSLATIONS.th.catThai;
        if (id === 'indian') return UI_TRANSLATIONS.th.catIndian;
        if (id === 'breads' || id === 'roti' || id === 'naan') return UI_TRANSLATIONS.th.catBreads;
        if (id === 'rice') return UI_TRANSLATIONS.th.catRice;
        if ('labelTH' in cat && cat.labelTH) return cat.labelTH;
        if ('nameTH' in cat && cat.nameTH) return cat.nameTH;
      }
      if (id === 'all') return UI_TRANSLATIONS.en.catAll;
      if (id === 'starters' || id.includes('starter') || id.includes('appetizer')) return UI_TRANSLATIONS.en.catStarters;
      if (id === 'main' || id.includes('main')) return UI_TRANSLATIONS.en.catMainCourse;
      if (id === 'biryani' || id.includes('biryani')) return UI_TRANSLATIONS.en.catBiryani;
      if (id === 'tandoori' || id.includes('tandoor')) return UI_TRANSLATIONS.en.catTandoori;
      if (id === 'desserts' || id.includes('dessert')) return UI_TRANSLATIONS.en.catDesserts;
      if (id === 'beverages' || id.includes('beverage')) return UI_TRANSLATIONS.en.catBeverages;
      return cat.label || cat.name || cat.id;
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        getDishName,
        getDishDescription,
        getCategoryLabel,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
