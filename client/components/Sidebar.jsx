import { useEffect, useRef } from 'react';
import Icon from './Icon';
import { usePreferences } from '../preferences';

export default function Sidebar({ page, user, collapsed, setCollapsed, mobileOpen, setMobileOpen, onLogin, onLogout }) {
  const { t, accountName } = usePreferences();
  const ref = useRef(null);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 761px)');
    const closeOnDesktop = () => { if (desktop.matches) setMobileOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, [setMobileOpen]);
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.activeElement;
    ref.current.querySelector('.mobile-close')?.focus();
    const onKey = event => {
      if (event.key === 'Escape') setMobileOpen(false);
      if (event.key !== 'Tab') return;
      const items = [...ref.current.querySelectorAll('a,button')].filter(el => el.getClientRects().length);
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [mobileOpen, setMobileOpen]);
  const links = [['home','home'], ['packages','packages'], ['reservations','reservations'], ...(user?.role === 'business' ? [['my-packages','myPackages'], ['add-package','addPackage']] : []), ['settings','settings']];
  return <>
    {mobileOpen && <div className="sidebar-scrim" onClick={() => setMobileOpen(false)} />}
    <aside ref={ref} id="sidebar" className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <a href="#/home" className="brand" aria-label="MealLoop" onClick={() => setMobileOpen(false)}><span className="brand-symbol"><Icon name="leaf" size={25} /></span><span className="sidebar-label">meal<span className="brand-light">loop</span><span className="brand-dot">.</span></span></a>
      <button className="icon-button mobile-close" aria-label={t('close')} onClick={() => setMobileOpen(false)}><Icon name="close" /></button>
      <span className="nav-caption sidebar-label">{t('menu')}</span>
      <nav aria-label={t('menu')}>
        {links.map(([route,key]) => <a key={route} href={`#/${route}`} className={`nav-link ${page === route ? 'active' : ''}`} aria-current={page === route ? 'page' : undefined} title={t(key)} aria-label={t(key)} onClick={() => setMobileOpen(false)}><Icon name={route === 'my-packages' ? 'store' : route === 'add-package' ? 'plus' : route} /><span className="sidebar-label">{t(key)}</span></a>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note sidebar-label"><Icon name="leaf" size={24} /><p>{t('connected')}</p></div>
        <div className="account-card"><span className="avatar"><Icon name={user?.role === 'business' ? 'store' : 'user'} /></span><div className="sidebar-label"><strong>{accountName(user) || t('guest')}</strong><small>{t(user?.role || 'demo')}</small></div></div>
        <button className="sidebar-action" onClick={user ? onLogout : onLogin} title={t(user ? 'signOut' : 'signIn')} aria-label={t(user ? 'signOut' : 'signIn')}><Icon name={user ? 'logout' : 'user'} /><span className="sidebar-label">{t(user ? 'signOut' : 'signIn')}</span></button>
        <button className="sidebar-action collapse-button" aria-label={t(collapsed ? 'expand' : 'collapse')} aria-expanded={!collapsed} aria-controls="sidebar" onClick={() => setCollapsed(!collapsed)}><Icon name="chevron" className={collapsed ? 'rotate' : ''} /><span className="sidebar-label">{t('collapse')}</span></button>
      </div>
    </aside>
  </>;
}
