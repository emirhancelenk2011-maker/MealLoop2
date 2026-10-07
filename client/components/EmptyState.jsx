import Icon from './Icon';
export default function EmptyState({ title, text, children, icon = 'packages' }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} size={30} /></span><h2>{title}</h2><p>{text}</p>{children}</div>;
}
