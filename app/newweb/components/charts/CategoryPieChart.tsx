"use client";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import useSWR from "swr";
import fetcher from "../../lib/fetcher";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CategoryPieChart() {
  const { data, error } = useSWR("/category-spend", fetcher);

  if (error) return <div className="text-red-500 text-sm">Failed to load categories</div>;
  if (!data) return (
    <div className="h-full flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
    </div>
  );

  const chartData = {
    labels: data.map((c: any) => c.category),
    datasets: [
      {
        data: data.map((c: any) => c.total_spend),
        backgroundColor: [
          "#3b82f6", // blue-500
          "#8b5cf6", // violet-500
          "#ec4899", // pink-500
          "#f59e0b", // amber-500
          "#10b981", // emerald-500
          "#06b6d4", // cyan-500
          "#f97316", // orange-500
          "#14b8a6", // teal-500
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: €${value.toLocaleString()} (${percentage}%)`;
          }
        }
      },
    },
  };

  return <Pie data={chartData} options={options} />;
}