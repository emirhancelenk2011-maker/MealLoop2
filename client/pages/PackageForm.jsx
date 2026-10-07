import { useState } from 'react';
import { usePreferences } from '../preferences';
import { categoryKeys } from '../i18n';
import Icon from '../components/Icon';
import PackageImage from '../components/PackageImage';
import { tashkentInput, pickupInstant } from '../format';
import images from '../../shared/package-images.json';

export default function PackageForm({ item, onSave, busy }) {
  const { t, offer } = usePreferences();
  const [version] = useState(item?.version);
  const [form, setForm] = useState(() => ({ image_key:item?.image_key || '', title:item?.title || '', description:item?.description || '', category:item?.category || 'Fırın', address:item?.address || '', price:item?.price || '', original_price:item?.original_price || '', quantity:item?.quantity ?? 1, pickup_start:tashkentInput(item?.pickup_start || Date.now()+3600000), pickup_end:tashkentInput(item?.pickup_end || Date.now()+10800000) }));
  const display = offer({ ...item, ...form });
  const [error, setError] = useState('');
  const set = e => { setError(''); setForm({...form,[e.target.name]:e.target.value}); };
  const submit = async e => {
    e.preventDefault();
    if (form.title.trim().length < 3 || form.title.length > 100 || form.description.trim().length < 5 || form.description.length > 600 || form.address.trim().length < 5 || form.address.length > 240) return setError('invalid_text');
    for (const key of ['price','original_price']) if (!form[key] || !Number.isFinite(Number(form[key])) || Number(form[key]) <= 0 || Number(form[key]) > 99999999.99 || Math.abs(Number(form[key])*100-Math.round(Number(form[key])*100)) > .00001) return setError('invalid_price');
    if (Number(form.price) > Number(form.original_price)) return setError('price_order');
    if (form.quantity === '' || !Number.isInteger(Number(form.quantity)) || Number(form.quantity) < 0 || Number(form.quantity) > 10000) return setError('invalid_quantity');
    if (!Number.isFinite(pickupInstant(form.pickup_start)) || !Number.isFinite(pickupInstant(form.pickup_end))) return setError('invalid_time');
    if (pickupInstant(form.pickup_end) <= pickupInstant(form.pickup_start) || pickupInstant(form.pickup_end) <= Date.now()) return setError('time_order');
    await onSave({ ...form, price:Number(form.price), original_price:Number(form.original_price), quantity:Number(form.quantity), pickup_start:new Date(pickupInstant(form.pickup_start)).toISOString(), pickup_end:new Date(pickupInstant(form.pickup_end)).toISOString(), ...(item ? { version } : {}) }, item?.id);
  };
  return <><div className="page-heading"><div><h1>{t(item ? 'editPackage' : 'addPackage')}</h1><p>{t('formHint')}</p></div></div><form className="package-form" noValidate onSubmit={submit}><fieldset disabled={busy}>
    <label className="field">{t('title')}<input name="title" value={display.title} onChange={set} maxLength={100} autoComplete="off" required /></label>
    <label className="field">{t('description')}<textarea name="description" value={display.description} onChange={set} rows={4} maxLength={600} required /></label>
    <label className="field">{t('category')}<select name="category" value={form.category} onChange={set}>{Object.entries(categoryKeys).map(([key,label]) => <option key={key} value={key}>{t(label)}</option>)}</select></label>
    <label className="field">{t('address')}<input name="address" value={display.address} onChange={set} maxLength={240} required /></label>
    <label className="field">{t('photo')}<select name="image_key" value={form.image_key} onChange={set}>{['',...Object.keys(images)].map(key => <option key={key} value={key}>{t(key ? key + 'Photo' : 'noPhoto')}</option>)}</select><small>{t('photoHint')}</small></label>
    {form.image_key && <div className="form-photo"><PackageImage item={form} eager /></div>}
    <div className="form-grid"><label className="field">{t('price')}<input type="number" name="price" min="0.01" max="99999999.99" step="0.01" value={form.price} onChange={set} required /></label><label className="field">{t('originalPrice')}<input type="number" name="original_price" min="0.01" max="99999999.99" step="0.01" value={form.original_price} onChange={set} required /></label></div>
    <label className="field">{t('quantity')}<input type="number" name="quantity" min="0" max="10000" step="1" value={form.quantity} onChange={set} required /><small>{t('quantityHint')}</small></label>
    <div className="form-grid"><label className="field">{t('start')}<input type="datetime-local" name="pickup_start" value={form.pickup_start} onChange={set} required /></label><label className="field">{t('end')}<input type="datetime-local" name="pickup_end" value={form.pickup_end} onChange={set} required /></label></div>
    {error && <div className="alert error" role="alert">{t(error)}</div>}
    <div className="form-actions"><a className="button secondary" href="#/my-packages">{t('cancel')}</a><button className="button" type="submit" disabled={busy}><Icon name="check" size={18} />{t(busy ? 'saving' : 'save')}</button></div>
  </fieldset></form></>;
}
