"use client";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import useSWR from "swr";
import fetcher from "../../lib/fetcher";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function TopVendorsChart() {
  const { data, error } = useSWR("/vendors/top10", fetcher);

  if (error) return <div className="text-red-500 text-sm">Failed to load vendors</div>;
  if (!data) return (
    <div className="h-full flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
    </div>
  );

  const chartData = {
    labels: data.map((v: any) => v.vendor_name),
    datasets: [
      {
        label: "Total Spend (€)",
        data: data.map((v: any) => v.total_spend),
        backgroundColor: [
          "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe",
          "#dbeafe", "#eff6ff", "#e0e7ff", "#c7d2fe",
          "#a5b4fc", "#818cf8"
        ],
        borderRadius: 6,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return '€' + context.parsed.x.toLocaleString();
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0,0,0,0.05)',
        },
        ticks: {
          callback: function(value: any) {
            return '€' + value.toLocaleString();
          }
        }
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}