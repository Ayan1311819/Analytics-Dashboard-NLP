"use client";
import useSWR from "swr";
import fetcher from "../lib/fetcher";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function OverviewCards() {
  const { data, error } = useSWR("/stats", fetcher);

  if (error) return <div className="text-red-500">Failed to load stats</div>;
  if (!data) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-6 rounded-xl bg-white shadow-sm animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );

  const stats = [
    { 
      title: "Total Spend", 
      value: `€ ${data.total_spend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "+8.2%",
      trend: "up",
      subtitle: "from last month"
    },
    { 
      title: "Total Invoices Processed", 
      value: data.total_invoices,
      change: "+2%",
      trend: "up",
      subtitle: "from last month"
    },
    { 
      title: "Documents Uploaded", 
      value: data.documents_uploaded,
      change: "-6%",
      trend: "down",
      subtitle: "from last month"
    },
    { 
      title: "Average Invoice Value", 
      value: `€ ${data.avg_invoice_value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "+8.2%",
      trend: "up",
      subtitle: "from last month"
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.title} className="p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">{s.title}</h3>
            <span className={`text-xs flex items-center gap-1 ${
              s.trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {s.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {s.change}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{s.value}</p>
          <p className="text-xs text-gray-500">{s.subtitle}</p>
        </div>
      ))}
    </div>
  );
}
