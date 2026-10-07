import { usePreferences } from '../preferences';
import Icon from '../components/Icon';
import PackageImage from '../components/PackageImage';
import PackageCard from '../components/PackageCard';
import EmptyState from '../components/EmptyState';

export default function Home({ packages, user, reservations, ownPackages, onDetails }) {
  const { t, accountName } = usePreferences();
  const business = user?.role === 'business';
  const available = packages.filter(p => p.quantity > 0);
  return <>
    <section data-aos="meal-enter" className="hero"><div className="hero-copy"><span className="eyebrow"><span className="tiny-dot" /> {t('city')}</span><h1>{business ? accountName(user) : t('welcome')}</h1><p>{t(business ? 'businessHint' : 'intro')}</p><a className="button" href={business ? '#/my-packages' : '#/packages'}>{t(business ? 'manage' : 'browse')}<Icon name="arrow" size={18} /></a></div><div className="hero-picture"><PackageImage item={{ image_key: 'bread' }} eager /><div className="hero-caption"><Icon name="store" size={17} /><span>{t('payAtPickup')}</span></div></div></section>
    {business ? <section data-aos="meal-enter" className="business-stats">{[['livePackages', ownPackages.filter(p => p.quantity > 0 && new Date(p.pickup_end) > new Date()).length], ['stock', ownPackages.filter(p => new Date(p.pickup_end) > new Date()).reduce((sum,p) => sum+p.quantity,0)], ['activeOrders', reservations.filter(r => r.status === 'reserved').length]].map(([key,count]) => <div className="stat" key={key}><span>{t(key)}</span><strong>{count}</strong></div>)}</section> : <section data-aos="meal-enter" className="steps" aria-label={t('how')}>{[1,2,3].map((n) => <div className="step" key={n}><span className="step-number">0{n}</span><div><h3>{t(`step${n}`)}</h3><p>{t(`step${n}Text`)}</p></div></div>)}</section>}
    <section data-aos="meal-enter"><div className="section-heading"><div><span className="eyebrow">{t('packages')}</span><h2>{t('available')}</h2></div><a className="text-link" href="#/packages">{t('viewAll')}<Icon name="arrow" size={17} /></a></div>{available.length ? <div className="package-grid">{available.slice(0,3).map(item => <PackageCard key={item.id} item={item} onDetails={onDetails} />)}</div> : <EmptyState title={t('noPackages')} text={t('noPackagesText')} />}</section>
  </>;
}
