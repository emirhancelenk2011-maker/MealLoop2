import { usePreferences } from '../preferences';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';
import Icon from '../components/Icon';

export default function Settings({ user, onLogin, onLogout }) {
  const { t, accountName } = usePreferences();
  return <><div className="page-heading"><div><h1>{t('settings')}</h1><p>{t('settingsText')}</p></div></div><div className="settings-panel">
    <section className="setting-row"><div><h2><Icon name="globe" />{t('language')}</h2><p>{t('languageHint')}</p></div><LanguageSelector expanded /></section>
    <section className="setting-row"><div><h2><Icon name="sun" />{t('theme')}</h2><p>{t('themeHint')}</p></div><ThemeToggle expanded /></section>
    <section className="setting-row"><div><h2><Icon name="user" />{t('account')}</h2><p>{user ? `${accountName(user)} · ${t(user.role)}` : t('accountHint')}</p></div><button className="button secondary" onClick={user ? onLogout : onLogin}>{t(user ? 'signOut' : 'signIn')}</button></section>
  </div></>;
}
