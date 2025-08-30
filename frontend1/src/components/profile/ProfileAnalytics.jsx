import React, { useMemo, useState } from "react";

const Stat = ({ label, value }) => (
  <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    <div className="text-sm text-gray-500">{label}</div>
  </div>
);

const BarChart = ({ data = [], color = "#6366F1", height = 220 }) => {
  if (!data.length) {
    return <div className="text-sm text-gray-500">No category data yet.</div>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 600;
  const H = height;
  const pad = { t: 20, r: 16, b: 52, l: 30 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const bw = Math.max(16, Math.min(60, iw / data.length - 10));
  const gap = (iw - bw * data.length) / Math.max(data.length - 1, 1);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      aria-label="Notes by category"
    >
      <rect x="0" y="0" width={W} height={H} fill="white" rx="12" />
      {/* X-axis line */}
      <line
        x1={pad.l}
        y1={pad.t + ih}
        x2={pad.l + iw}
        y2={pad.t + ih}
        stroke="#E5E7EB"
      />
      {data.map((d, i) => {
        const h = (d.value / max) * ih;
        const x = pad.l + i * (bw + gap);
        const y = pad.t + ih - h;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={bw} height={h} fill={color} rx="6" />
            <text
              x={x + bw / 2}
              y={pad.t + ih + 16}
              fontSize="12"
              textAnchor="middle"
              fill="#6B7280"
            >
              {d.label.length > 10 ? `${d.label.slice(0, 10)}…` : d.label}
            </text>
            <text
              x={x + bw / 2}
              y={y - 6}
              fontSize="12"
              textAnchor="middle"
              fill="#111827"
              fontWeight="600"
            >
              {d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const LineChart = ({ data = [], color = "#F59E0B", height = 220 }) => {
  if (!data.length) {
    return <div className="text-sm text-gray-500">No timeline data yet.</div>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 600;
  const H = height;
  const pad = { t: 20, r: 16, b: 36, l: 30 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const step = data.length <= 1 ? iw : iw / (data.length - 1);
  const points = data.map((d, i) => {
    const x = pad.l + i * step;
    const y = pad.t + ih - (d.value / max) * ih;
    return `${x},${y}`;
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      aria-label="Notes over time"
    >
      <rect x="0" y="0" width={W} height={H} fill="white" rx="12" />
      {/* X-axis labels */}
      {data.map((d, i) => (
        <text
          key={d.label}
          x={pad.l + i * step}
          y={pad.t + ih + 16}
          fontSize="12"
          textAnchor="middle"
          fill="#6B7280"
        >
          {d.label}
        </text>
      ))}
      {/* Line */}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        points={points.join(" ")}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Points */}
      {data.map((d, i) => {
        const x = pad.l + i * step;
        const y = pad.t + ih - (d.value / max) * ih;
        return (
          <g key={`${d.label}-pt`}>
            <circle cx={x} cy={y} r="4" fill={color} />
            <text
              x={x}
              y={y - 10}
              fontSize="12"
              textAnchor="middle"
              fill="#111827"
              fontWeight="600"
            >
              {d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const monthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
// (monthLabel removed; use monthLabelFull)

// --- Time bucketing helpers ---
const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const dayKey = (d) => {
  const x = startOfDay(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const da = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
};
const dayLabel = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const startOfWeekMonday = (d) => {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // Mon=0..Sun=6
  const monday = new Date(x);
  monday.setDate(x.getDate() - day);
  return monday;
};
const weekKey = (d) => dayKey(startOfWeekMonday(d)); // key by Monday date
const weekLabel = (key) => dayLabel(key);

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const monthKeyFromDate = (d) => monthKey(startOfMonth(d));
const monthLabelFull = (key) => {
  const [y, m] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, 1);
  return dt.toLocaleString("en-GB", { month: "short" });
};

const startOfYear = (d) => new Date(d.getFullYear(), 0, 1);
const yearKey = (d) => String(startOfYear(d).getFullYear());
const yearLabel = (key) => key;

const generateRecentKeys = (scale, maxPoints) => {
  const keys = [];
  const today = new Date();
  if (scale === "day") {
    for (let i = maxPoints - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      keys.push(dayKey(d));
    }
  } else if (scale === "week") {
    const thisMon = startOfWeekMonday(today);
    for (let i = maxPoints - 1; i >= 0; i--) {
      const d = new Date(thisMon);
      d.setDate(thisMon.getDate() - i * 7);
      keys.push(weekKey(d));
    }
  } else if (scale === "month") {
    const first = startOfMonth(today);
    for (let i = maxPoints - 1; i >= 0; i--) {
      const d = new Date(first);
      d.setMonth(first.getMonth() - i);
      keys.push(monthKeyFromDate(d));
    }
  } else if (scale === "year") {
    const first = startOfYear(today);
    for (let i = maxPoints - 1; i >= 0; i--) {
      const d = new Date(first);
      d.setFullYear(first.getFullYear() - i);
      keys.push(yearKey(d));
    }
  }
  return keys;
};

const buildTimelineByScale = (notes, scale) => {
  const counts = new Map();
  for (const n of notes || []) {
    const raw = n.created_at || n.createdAt;
    if (!raw) continue;
    const dt = new Date(raw);
    if (isNaN(dt.getTime())) continue;
    let key;
    if (scale === "day") key = dayKey(dt);
    else if (scale === "week") key = weekKey(dt);
    else if (scale === "month") key = monthKeyFromDate(dt);
    else key = yearKey(dt);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  // fixed window with zero-filled buckets
  const maxPoints =
    scale === "day" ? 14 : scale === "week" ? 12 : scale === "month" ? 6 : 4;
  const keys = generateRecentKeys(scale, maxPoints);
  const labeller =
    scale === "day"
      ? dayLabel
      : scale === "week"
      ? weekLabel
      : scale === "month"
      ? monthLabelFull
      : yearLabel;
  return keys.map((k) => ({ label: labeller(k), value: counts.get(k) || 0 }));
};

const ProfileAnalytics = ({ notes = [] }) => {
  const [scale, setScale] = useState("month"); // 'day' | 'week' | 'month' | 'year'
  const total = notes.length;
  const categoriesMap = notes.reduce((acc, n) => {
    const c = n.category || "OTHER";
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  const categories = Object.entries(categoriesMap)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
  const timeline = useMemo(
    () => buildTimelineByScale(notes, scale),
    [notes, scale]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Total Notes" value={total} />
        {categories.slice(0, 3).map((d) => (
          <Stat key={d.label} label={d.label.toLowerCase()} value={d.value} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="mb-2 text-sm font-medium text-gray-900">
            Notes by Category
          </div>
          <BarChart data={categories} color="#6366F1" />
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-900">
              Notes over time ({scale})
            </div>
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm">
              {["day", "week", "month", "year"].map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={`px-3 py-1.5 transition-colors ${
                    scale === s
                      ? "bg-amber-100 text-amber-800"
                      : "bg-white hover:bg-gray-50 text-gray-700"
                  } ${s !== "year" ? "border-r border-gray-200" : ""}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <LineChart data={timeline} color="#F59E0B" />
        </div>
      </div>
    </div>
  );
};

export default ProfileAnalytics;
