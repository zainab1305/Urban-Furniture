import { Inbox } from 'lucide-react';

export function EmptyState({ title = 'No records yet', description = 'This module is ready for the team to build on.' }) {
  return <div className="empty-state"><Inbox size={28} /><h3>{title}</h3><p>{description}</p></div>;
}
