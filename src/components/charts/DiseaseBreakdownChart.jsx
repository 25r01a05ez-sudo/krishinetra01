import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { breakdownByDisease } from '../../utils/format';

const COLORS = ['#166534', '#22C55E', '#FACC15', '#064E3B', '#86EFAC', '#CA8A04', '#4D7C0F', '#94A3B8'];

export default function DiseaseBreakdownChart({ scans }) {
  const data = breakdownByDisease(scans);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div role="img" aria-label="Donut chart of scans by predicted label" className="h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={2} animationDuration={700}>
              {data.map((d, i) => (
                <Cell key={d.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #bbf7d0', fontSize: 13 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full min-w-0 space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} aria-hidden="true" />
              <span className="truncate font-medium">{d.name}</span>
            </span>
            <span className="font-bold">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
