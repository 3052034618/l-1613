export const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatDate = (iso: string) => iso.slice(0, 10);

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const daysBetween = (a: string, b: string) => {
  return Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
};

const escapeCSV = (v: unknown) => {
  const s = v === undefined || v === null ? '' : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export function downloadCSV(filename: string, headers: (string | number)[], rows: (string | number)[][]): void;
export function downloadCSV(csvContent: string, filename: string): void;
export function downloadCSV(a: string, b: string | (string | number)[], c?: (string | number)[][]): void {
  const BOM = '\uFEFF';
  let csvContent: string;
  let filename: string;
  if (Array.isArray(b)) {
    filename = a;
    const headerLine = (b as (string | number)[]).map(escapeCSV).join(',');
    const rowsLine = (c || []).map(row => row.map(escapeCSV).join(',')).join('\n');
    csvContent = headerLine + (rowsLine ? '\n' + rowsLine : '');
  } else {
    csvContent = a;
    filename = b;
  }
  if (!/\.csv$/i.test(filename)) filename = filename + '.csv';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const classNames = (...args: (string | undefined | null | false)[]) => {
  return args.filter(Boolean).join(' ');
};
