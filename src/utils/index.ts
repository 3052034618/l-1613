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

export const downloadCSV = (csvContent: string, filename: string) => {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${todayStr()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const classNames = (...args: (string | undefined | null | false)[]) => {
  return args.filter(Boolean).join(' ');
};
