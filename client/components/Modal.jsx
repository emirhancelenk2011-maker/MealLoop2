import { useEffect, useRef } from 'react';
import { usePreferences } from '../preferences';
import Icon from './Icon';

export default function Modal({ title, onClose, children, busy = false }) {
  const ref = useRef(null);
  const { t } = usePreferences();
  useEffect(() => {
    const element = ref.current, previous = document.activeElement;
    element.showModal();
    return () => { element.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} className="modal" aria-labelledby="modal-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}><div className="modal-content"><div className="modal-heading"><h2 id="modal-title">{title}</h2><button disabled={busy} className="icon-button" aria-label={t('close')} onClick={onClose}><Icon name="close" /></button></div>{children}</div></dialog>;
}
