import Modal from './Modal';
import PackageImage from './PackageImage';
import Icon from './Icon';
import { usePreferences } from '../preferences';

export default function ActionDialog({ modal, user, accounts, busy, error, onClose, onConfirm, onLogin }) {
  const { t, money, date, offer, accountName } = usePreferences();
  const display = modal.item ? offer(modal.item) : null;
  const title = modal.type === 'login' ? 'demo' : { reserve:'confirmReserve', cancel:'confirmCancel', collect:'confirmCollect', delete:'confirmDelete' }[modal.type];
  return <Modal title={t(title)} onClose={onClose} busy={busy}>
    {modal.type === 'login' ? <><p className="text-muted">{t('demoHint')}</p><div className="demo-accounts">{accounts === null ? <p>{t('loading')}</p> : !accounts.length ? <p>{t('noAccounts')}</p> : accounts.map(account => <button key={account.id} disabled={busy} onClick={() => onLogin(account.id)}><span className="avatar"><Icon name={account.role === 'business' ? 'store' : 'user'} /></span><span><strong>{accountName(account)}</strong><small>{t(account.role)}</small></span><Icon name="arrow" size={18} /></button>)}</div></> : modal.type === 'reserve' ? <><div className="detail-art"><PackageImage item={modal.item} eager /></div><span className="business-name">{display.business_name}</span><h3 className="detail-title">{display.title}</h3><p>{display.description}</p><div className="detail-info"><p><Icon name="pin" size={17} />{display.address}</p><p><Icon name="clock" size={17} />{date(modal.item.pickup_start)} – {date(modal.item.pickup_end)}</p></div><div className="detail-total"><span>{t('onePackage')}</span><strong>{money(modal.item.price)}</strong></div><p className="text-muted small-text">{t('reserveHint')}</p></> : <p>{t(`${title}Text`)}</p>}
    {error && <div className="alert error" role="alert">{t(error)}</div>}
    {modal.type !== 'login' && <div className="modal-actions"><button className="button secondary" disabled={busy} onClick={onClose}>{t('cancel')}</button><button className={`button ${['delete','cancel'].includes(modal.type) ? 'danger' : ''}`} disabled={busy || (modal.type === 'reserve' && user?.role === 'business')} onClick={onConfirm}>{t(busy ? 'saving' : modal.type === 'reserve' ? (user ? 'reserve' : 'signIn') : 'confirm')}</button></div>}
    {modal.type === 'reserve' && user?.role === 'business' && <p className="text-muted small-text">{t('customerOnly')}</p>}
  </Modal>;
}
