import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center space-x-1 rounded-lg border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-700">
      <Globe className="h-4 w-4 text-gray-500 dark:text-gray-300" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'en' | 'si')}
        className="bg-transparent text-xs sm:text-sm text-gray-700 dark:text-gray-200 focus:outline-none"
        aria-label={t('Language')}
      >
        <option value="en">EN</option>
        <option value="si">සිං</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
