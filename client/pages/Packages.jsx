import { useState } from 'react';
import { usePreferences } from '../preferences';
import { categoryKeys, locales } from '../i18n';
import Icon from '../components/Icon';
import PackageCard from '../components/PackageCard';
import EmptyState from '../components/EmptyState';

export default function Packages({ packages, onDetails, manage = false, onEdit, onDelete }) {
  const { t, language, offer } = usePreferences();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const filtered = packages.filter(p => {
    const display = offer(p);
    const text = `${display.title} ${display.business_name} ${display.description} ${p.title} ${p.business_name}`;
    return (category === 'all' || p.category === category) && text.toLocaleLowerCase(locales[language]).includes(search.toLocaleLowerCase(locales[language]));
  });
  if (sort === 'cheapest') filtered.sort((a,b) => Number(a.price) - Number(b.price));
  return <>
    <div className="page-heading"><div><h1>{t(manage ? 'myPackages' : 'packages')}</h1><p>{t(manage ? 'businessHint' : 'availableText')}</p></div>{manage && <a className="button" href="#/add-package"><Icon name="plus" size={18} />{t('addPackage')}</a>}</div>
    <div className="filters"><label className="search-field"><Icon name="search" /><input type="search" aria-label={t('search')} placeholder={t('search')} value={search} onChange={e => setSearch(e.target.value)} /></label><label className="sort-field"><span>{t('sort')}</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="newest">{t('newest')}</option><option value="cheapest">{t('cheapest')}</option></select></label></div>
    <div className="filter-bottom"><div className="category-tabs" aria-label={t('category')}>{[['all','all'],...Object.entries(categoryKeys)].map(([key,label]) => <button key={key} className={category === key ? 'selected' : ''} aria-pressed={category === key} onClick={() => setCategory(key)}>{t(label)}</button>)}</div><span className="result-count">{t('results',{count:filtered.length})}</span></div>
    {filtered.length ? <div className="package-grid">{filtered.map(item => <PackageCard key={item.id} item={item} manage={manage} onDetails={onDetails} onEdit={onEdit} onDelete={onDelete} />)}</div> : <EmptyState title={t(manage && !packages.length ? 'noOwnPackages' : 'noPackages')} text={t(manage && !packages.length ? 'noOwnPackagesText' : 'noPackagesText')} />}
  </>;
}
