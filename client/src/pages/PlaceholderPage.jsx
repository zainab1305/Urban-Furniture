import { Plus } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export function PlaceholderPage({ title, description }) {
  return <><PageHeader title={title} description={description} action={<button className="primary-button"><Plus size={16} /> New {title.replace('Chart of ', '').replace('Profit & Loss', 'report')}</button>} /><section className="surface"><EmptyState title={`${title} is ready for implementation`} description="The route, layout and module boundary are in place for the next development slice." /></section></>;
}
