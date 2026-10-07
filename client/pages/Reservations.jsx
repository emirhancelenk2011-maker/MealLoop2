import { useState } from 'react';
import { usePreferences } from '../preferences';
import Icon from '../components/Icon';
import EmptyState from '../components/EmptyState';

export default function Reservations({ reservations, user, onAction, onLogin }) {
  const { t, money, date, offer } = usePreferences();
  const [filter, setFilter] = useState('all');
  const business = user?.role === 'business';
  const items = reservations.filter(r => filter === 'all' || r.status === filter);
  return <><div className="page-heading"><div><h1>{t(business ? 'businessOrders' : 'reservations')}</h1><p>{t('payAtPickup')}</p></div></div>
    {!user ? <EmptyState icon="user" title={t('signInNeeded')}><button className="button" onClick={onLogin}>{t('signIn')}</button></EmptyState> : <><div className="category-tabs reservation-tabs" aria-label={t('status')}>{['all','reserved','collected','cancelled'].map(key => <button key={key} aria-pressed={filter === key} className={filter === key ? 'selected' : ''} onClick={() => setFilter(key)}>{t(key)}</button>)}</div>
      {items.length ? <div className="reservation-list">{items.map(item => { const r = offer(item); return <article data-aos="meal-enter" className="reservation-card" key={r.id}><div className="reservation-top"><span className={`status status-${r.status}`}><span className="tiny-dot" />{t(r.status)}</span><span className="reservation-date">{date(r.created_at)}</span></div><div className="reservation-main"><div className="reservation-info"><span className="business-name">{business ? r.customer_name : r.business_name}</span><h2>{r.title}</h2><p><Icon name="clock" size={16} />{date(r.pickup_start)} – {date(r.pickup_end)}</p><p><Icon name="pin" size={16} />{r.address}</p><strong>{money(r.price)} <span className="text-muted regular-weight">· {t('payAtPickup')}</span></strong></div><div className="pickup-code"><span>{t('code')}</span><strong>{r.code}</strong><small>{t('showCode')}</small></div></div>{r.status === 'reserved' && <div className="reservation-actions"><button className={`button ${business ? '' : 'secondary danger-text'}`} onClick={() => onAction(business ? 'collect' : 'cancel',r)}>{t(business ? 'collect' : 'cancelReservation')}</button></div>}</article>; })}</div> : <EmptyState icon="reservations" title={t('noReservations')} text={t('noReservationsText')}><a className="button secondary" href="#/packages">{t('browse')}</a></EmptyState>}</>}
  </>;
}
