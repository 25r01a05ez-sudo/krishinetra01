import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { scansPerDay } from '../../utils/format';

export default function ScanActivityChart({ scans, days = 14 }) {
  const data = scansPerDay(scans, days);
  const total = data.reduce((n, d) => n + d.scans, 0);
  return (
    <div role="img" aria-label={`Bar chart: ${total} scans in the last ${days} days`} className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#166534" strokeOpacity={0.1} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#172B20' }} interval="preserveStartEnd" minTickGap={16} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#172B20' }} />
          <Tooltip
            cursor={{ fill: '#F0FDF4' }}
            contentStyle={{ borderRadius: 12, border: '1px solid #bbf7d0', fontSize: 13 }}
            formatter={(v) => [v, 'Scans']}
          />
          <Bar dataKey="scans" fill="#22C55E" radius={[6, 6, 0, 0]} animationDuration={700} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
