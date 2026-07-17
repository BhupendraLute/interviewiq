"use client";

import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type BarChartProps<T extends Record<string, number>> = {
  data: T[];
  keys: Array<keyof T>;
};

export default function BarChart<T extends Record<string, number>>({
  data,
  keys,
}: BarChartProps<T>) {
  const chartData = {
    labels: keys.map((key) => key.toString()),
    datasets: [
      {
        label: "Score",
        data: keys.map((key) => data[0][key]),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.raw}%`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}