import Icon from './Icon';
import { languages } from '../i18n';
import { usePreferences } from '../preferences';

export default function LanguageSelector({ expanded = false }) {
  const { t, language, setLanguage } = usePreferences();
  if (expanded) return <div className="option-group" aria-label={t('language')}>
    {Object.entries(languages).map(([key, label]) => <button key={key} aria-pressed={language === key} className={language === key ? 'selected' : ''} onClick={() => setLanguage(key)}>{label}</button>)}
  </div>;
  return <label className="language-select"><Icon name="globe" size={18} />
    <select aria-label={t('language')} value={language} onChange={event => setLanguage(event.target.value)}>
      {Object.entries(languages).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
    </select>
  </label>;
}
