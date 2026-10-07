import { categoryKeys } from '../i18n';
import { usePreferences } from '../preferences';
import PackageImage from './PackageImage';
import Icon from './Icon';

export default function PackageCard({ item, onDetails, onEdit, onDelete, manage = false }) {
  const { t, money, date, offer } = usePreferences();
  const display = offer(item);
  const expired = new Date(item.pickup_end) <= new Date();
  const unavailable = expired || item.quantity === 0;
  return <article data-aos="meal-enter" className={`package-card ${unavailable ? 'unavailable' : ''}`}>
    <div className={`package-visual category-${categoryKeys[item.category]}`}><PackageImage item={item} /><span className={`stock-badge ${unavailable ? 'muted-badge' : ''}`}>{expired ? t('expired') : item.quantity === 0 ? t('soldOut') : t('remaining', { count: item.quantity })}</span><span className="category-label">{t(categoryKeys[item.category])}</span></div>
    <div className="package-body"><div className="business-name"><Icon name="store" size={14} />{display.business_name}</div><h3>{display.title}</h3><p className="package-description">{display.description}</p><div className="pickup-line"><Icon name="clock" size={15} /><span>{date(item.pickup_start)} – {date(item.pickup_end)}</span></div><div className="card-bottom"><div className="price"><strong>{money(item.price)}</strong><del>{money(item.original_price)}</del></div>{!manage && <button className="button small" disabled={unavailable} onClick={() => onDetails(item)}>{t(expired ? 'expired' : unavailable ? 'soldOut' : 'details')}<Icon name="arrow" size={16} /></button>}</div>
      {manage && <div className="manage-actions"><button className="button secondary small" onClick={() => onEdit(item)}><Icon name="edit" size={16} />{t('edit')}</button><button className="icon-button danger-text" aria-label={`${t('delete')}: ${display.title}`} onClick={() => onDelete(item)}><Icon name="trash" size={18} /></button></div>}
    </div>
  </article>;
}
