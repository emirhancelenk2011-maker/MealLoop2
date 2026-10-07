import Icon from './Icon';
import { usePreferences } from '../preferences';

export default function ThemeToggle({ expanded = false }) {
  const { t, theme, setTheme } = usePreferences();
  if (expanded) return <div className="option-group" aria-label={t('theme')}>
    {['light', 'dark'].map(key => <button key={key} aria-pressed={theme === key} className={theme === key ? 'selected' : ''} onClick={() => setTheme(key)}><Icon name={key === 'light' ? 'sun' : 'moon'} size={17} />{t(key)}</button>)}
  </div>;
  return <button className="icon-button theme-toggle" title={t(theme === 'dark' ? 'switchLight' : 'switchDark')} aria-label={t(theme === 'dark' ? 'switchLight' : 'switchDark')} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}><Icon name={theme === 'dark' ? 'sun' : 'moon'} /></button>;
}
