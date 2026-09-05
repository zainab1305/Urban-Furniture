import { EmptyState } from './EmptyState.jsx';

export function DataTable({ columns = [], rows = [] }) {
  if (!rows.length) return <EmptyState title="No records yet" description="Create the first record when this module is implemented." />;
  return <div className="table-wrap"><table><thead><tr>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
