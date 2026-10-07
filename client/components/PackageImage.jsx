import { useState } from 'react';
import { usePreferences } from '../preferences';
import Icon from './Icon';
import images from '../../shared/package-images.json';

export default function PackageImage({ item, eager = false }) {
  const { t } = usePreferences();
  const [failed, setFailed] = useState(null);
  const photo = images[item.image_key];
  const src = photo?.src;
  if (!src || failed === src) return <div className="photo-placeholder"><Icon name="packages" size={32} /><span>{t('noPhoto')}</span></div>;
  return <img className="package-photo" src={src} alt={t(`${item.image_key}Alt`)} loading={eager ? 'eager' : 'lazy'} decoding="async" width={photo.width} height={photo.height} onError={() => setFailed(src)} />;
}
