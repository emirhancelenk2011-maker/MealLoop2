import Icon from './Icon';
import LanguageSelector from './LanguageSelector';
import ThemeToggle from './ThemeToggle';
import { usePreferences } from '../preferences';

export default function Navbar({ title, mobileOpen, setMobileOpen, user, onLogin }) {
  const { t } = usePreferences();
  return <header className="navbar">
    <div className="navbar-start"><button className="icon-button mobile-toggle" aria-label={t('menu')} aria-controls="sidebar" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}><Icon name="menu" /></button><span className="breadcrumb">MealLoop <span>/</span> <strong>{title}</strong></span></div>
    <div className="navbar-actions"><LanguageSelector />
      <ThemeToggle />
      {!user && <button className="button small navbar-login" onClick={onLogin}>{t('signIn')}</button>}
    </div>
  </header>;
}
