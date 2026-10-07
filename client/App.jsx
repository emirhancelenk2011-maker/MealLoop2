import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { persist, stored, usePreferences } from './preferences';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Icon from './components/Icon';
import ActionDialog from './components/ActionDialog';
import EmptyState from './components/EmptyState';
import useAnimations from './useAnimations';
import Home from './pages/Home';
import Packages from './pages/Packages';
import Reservations from './pages/Reservations';
import Settings from './pages/Settings';
import PackageForm from './pages/PackageForm';

const routes = { home:'home', packages:'packages', reservations:'reservations', settings:'settings', 'my-packages':'myPackages', 'add-package':'addPackage', 'edit-package':'editPackage' };
const readRoute = hash => { const value = hash.slice(2).split('/')[0]; return Object.hasOwn(routes,value) ? value : 'home'; };

export default function App() {
  const { t, language } = usePreferences();
  const [route, setRoute] = useState(() => location.hash);
  const page = readRoute(route);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [data, setData] = useState({ packages:[], reservations:[], ownPackages:[] });
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(() => stored('sidebar','expanded') === 'collapsed');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [notice, setNotice] = useState('');
  const generation = useRef(0), mutation = useRef(false);
  const main = useRef(null);
  useAnimations(main, [route, data, loading, language]);

  const refresh = useCallback(async (currentUser, { quiet = false } = {}) => {
    const request = ++generation.current;
    if (!quiet) setLoading(true);
    try {
      const [packages,reservations,ownPackages] = await Promise.all([api('/packages'), currentUser ? api('/reservations') : [], currentUser?.role === 'business' ? api('/business/packages') : []]);
      if (request === generation.current) { setData({packages,reservations,ownPackages}); setError(''); }
    } catch (e) { if (request === generation.current) { setError(e.code || 'server_error'); if (e.status === 401) setUser(null); } }
    finally { if (request === generation.current) setLoading(false); }
  }, []);
  const bootstrap = useCallback(async () => {
    try { const session = await api('/session'); setUser(session); setReady(true); await refresh(session); }
    catch (e) { setError(e.code || 'server_error'); setReady(true); setLoading(false); }
  }, [refresh]);
  useEffect(() => { bootstrap(); }, [bootstrap]);
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => { if (!mutation.current) refresh(user,{quiet:true}); }, 30000);
    return () => clearInterval(timer);
  }, [ready,user,refresh]);
  useEffect(() => {
    const change = () => { setRoute(location.hash); setMobileOpen(false); setModal(null); setError(''); window.scrollTo(0,0); main.current?.focus(); };
    addEventListener('hashchange',change); return () => removeEventListener('hashchange',change);
  }, []);
  useEffect(() => { persist('sidebar',collapsed ? 'collapsed' : 'expanded'); }, [collapsed]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''),6000); return () => clearTimeout(timer); }, [notice]);
  const open = value => { setModalError(''); setModal(value); setMobileOpen(false); };
  const openLogin = async () => {
    open({type:'login'}); setAccounts(null);
    try { setAccounts(await api('/demo-accounts')); } catch (e) { setAccounts([]); setModalError(e.code || 'server_error'); }
  };
  const mutate = async (action, success, insideModal = false) => {
    if (mutation.current) return;
    mutation.current = true; setBusy(true); setError(''); setModalError('');
    try { await action(); if (success) setNotice(success); return true; }
    catch (e) { (insideModal ? setModalError : setError)(e.code || 'server_error'); if (e.status === 401) setUser(null); return false; }
    finally { mutation.current = false; setBusy(false); }
  };
  const login = id => mutate(async () => { const session = await api('/session',{method:'POST',body:{user_id:id}}); setUser(session); setData({packages:[],reservations:[],ownPackages:[]}); setModal(null); location.hash='/home'; await refresh(session); },null,true);
  const logout = () => mutate(async () => { await api('/session',{method:'DELETE'}); setUser(null); setData({packages:[],reservations:[],ownPackages:[]}); location.hash='/home'; await refresh(null); });
  const confirm = async () => {
    if (modal.type === 'reserve' && !user) return openLogin();
    const current = modal;
    const successKey = { reserve:'reservationSuccess', cancel:'cancelSuccess', collect:'collectSuccess', delete:'packageDeleted' }[current.type];
    const done = await mutate(async () => {
      if (current.type === 'reserve') await api('/reservations',{method:'POST',body:{package_id:current.item.id,request_key:current.requestKey}});
      else if (current.type === 'delete') await api(`/packages/${current.item.id}`,{method:'DELETE'});
      else await api(`/reservations/${current.item.id}/${current.type}`,{method:'POST'});
    },successKey,true);
    if (done) { setModal(null); if (current.type === 'reserve') location.hash='/reservations'; }
    await refresh(user,{quiet:true});
  };
  const save = async (body,id) => {
    const done = await mutate(() => api(id ? `/packages/${id}` : '/packages',{method:id ? 'PUT' : 'POST',body}),'packageSaved');
    if (done) { await refresh(user,{quiet:true}); location.hash='/my-packages'; }
  };
  const details = item => open({type:'reserve',item,requestKey:crypto.randomUUID()});
  const pageTitle = t(page === 'reservations' && user?.role === 'business' ? 'businessOrders' : routes[page]);
  const editId = Number(route.split('/')[2]);
  const editItem = data.ownPackages.find(item => item.id === editId);
  const businessPage = ['my-packages','add-package','edit-package'].includes(page);
  let content;
  if (loading) content = <div className="loading-state" role="status"><span className="loading-dot" />{t('loading')}</div>;
  else if (businessPage && user?.role !== 'business') content = <EmptyState icon="store" title={t('businessOnly')}><button className="button" onClick={openLogin}>{t('signIn')}</button></EmptyState>;
  else if (page === 'home') content = <Home {...data} user={user} onDetails={details} />;
  else if (page === 'packages') content = <Packages packages={data.packages} onDetails={details} />;
  else if (page === 'my-packages') content = <Packages key="manage" packages={data.ownPackages} manage onEdit={item => { location.hash=`/edit-package/${item.id}`; }} onDelete={item => open({type:'delete',item})} />;
  else if (page === 'reservations') content = <Reservations reservations={data.reservations} user={user} onAction={(type,item) => open({type,item})} onLogin={openLogin} />;
  else if (page === 'settings') content = <Settings user={user} onLogin={openLogin} onLogout={logout} />;
  else if (page === 'add-package' || (page === 'edit-package' && editItem)) content = <PackageForm key={page === 'edit-package' ? editId : 'new'} item={page === 'edit-package' ? editItem : null} busy={busy} onSave={save} />;
  else content = <EmptyState title={t('package_missing')}><a className="button" href="#/my-packages">{t('myPackages')}</a></EmptyState>;
  return <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
    <title>{pageTitle} · MealLoop</title>
    <Sidebar page={page === 'edit-package' ? 'my-packages' : page} user={user} collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} onLogin={openLogin} onLogout={logout} />
    <div className="app-main" inert={mobileOpen ? true : undefined}><Navbar title={pageTitle} user={user} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} onLogin={openLogin} /><main ref={main} tabIndex={-1} className="page-content">
      {error && <div className="alert error" role="alert"><span>{t(error)}</span><button onClick={() => bootstrap()}>{t('retry')}</button></div>}
      {content}
    </main><footer><span>© {new Date().getFullYear()} MealLoop</span><span>{t('payAtPickup')} <Icon name="leaf" size={15} /></span></footer></div>
    {notice && <div className="toast" role="status"><Icon name="check" /><span>{t(notice)}</span><button className="icon-button" aria-label={t('close')} onClick={() => setNotice('')}><Icon name="close" size={16} /></button></div>}
    {modal && <ActionDialog modal={modal} user={user} accounts={accounts} busy={busy} error={modalError} onClose={() => setModal(null)} onConfirm={confirm} onLogin={login} />}
  </div>;
}
