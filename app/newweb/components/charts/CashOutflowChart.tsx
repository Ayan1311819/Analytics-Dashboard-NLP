"use client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import useSWR from "swr";
import fetcher from "../../lib/fetcher";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

export default function CashOutflowChart() {
  const { data, error } = useSWR("/cash-outflow", fetcher);

  if (error) return <div className="text-red-500 text-sm">Failed to load cash outflow</div>;
  if (!data) return (
    <div className="h-full flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
    </div>
  );

  const chartData = {
    labels: data.map((i: any) => new Date(i.month).toLocaleDateString("en-US", { month: "short", year: "numeric" })),
    datasets: [
      {
        label: "Cash Outflow (€)",
        data: data.map((i: any) => i.total_outflow ?? 0),
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.2)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#10b981",
      },
    ],
  };

  const options = {
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
            return 'Outflow: €' + context.parsed.y.toLocaleString();
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)',
        },
        ticks: {
          callback: function(value: any) {
            return '€' + value.toLocaleString();
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}