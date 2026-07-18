"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type TooltipItem,
} from "chart.js";
import { useSyncExternalStore } from "react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function isDark() {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}

const subscribe = (cb: () => void) => {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
};

type BarChartProps<T extends Record<string, number>> = {
  data: T[];
  keys: Array<keyof T>;
};

const labels: Record<string, string> = {
  correctness: "Problem Solving",
  complexity: "Complexity",
  communication: "Communication",
};

const barColors = ["#6366f1", "#f59e0b", "#8b5cf6"];

export default function BarChart<T extends Record<string, number>>({
  data,
  keys,
}: BarChartProps<T>) {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  const gridColor = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const labelColor = dark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)";

  const chartData = {
    labels: keys.map((k) => labels[k as string] ?? k.toString()),
    datasets: [
      {
        label: "Score",
        data: keys.map((key) => data[0][key]),
        backgroundColor: keys.map((_, i) => {
          const c = barColors[i % barColors.length];
          return dark ? c + "cc" : c + "b3";
        }),
        borderColor: keys.map((_, i) => barColors[i % barColors.length]),
        borderWidth: 1,
        borderRadius: 6,
        barPercentage: 0.65,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<"bar">) => `${Number(context.raw)}/100`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 25,
          color: labelColor,
          font: { size: 10 },
        },
        grid: {
          color: gridColor,
        },
      },
      x: {
        ticks: {
          color: labelColor,
          font: { size: 11, weight: 500 },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="size-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
