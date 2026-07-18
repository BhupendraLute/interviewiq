"use client";

import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { useSyncExternalStore } from "react";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function isDark() {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}

const subscribe = (cb: () => void) => {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
};

type RadarChartProps<T extends Record<string, number>> = {
  data: T[];
  keys: Array<keyof T>;
};

const labels: Record<string, string> = {
  correctness: "Problem Solving",
  complexity: "Complexity",
  communication: "Communication",
};

export default function RadarChart<T extends Record<string, number>>({
  data,
  keys,
}: RadarChartProps<T>) {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  const gridColor = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const labelColor = dark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.55)";
  const fillColor = dark ? "rgba(99,102,241,0.25)" : "rgba(59,130,246,0.2)";
  const borderColor = dark ? "rgba(99,102,241,0.9)" : "rgba(59,130,246,1)";
  const pointColor = dark ? "rgba(99,102,241,1)" : "rgba(59,130,246,1)";

  const chartData = {
    labels: keys.map((k) => labels[k as string] ?? k.toString()),
    datasets: [
      {
        label: "Score",
        data: keys.map((key) => data[0][key]),
        backgroundColor: fillColor,
        borderColor,
        borderWidth: 2,
        pointBackgroundColor: pointColor,
        pointBorderColor: dark ? "rgba(30,30,40,1)" : "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
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
          label: (context: { raw: number }) => `${context.raw}/100`,
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          color: labelColor,
          backdropColor: "transparent",
          font: { size: 10 },
        },
        grid: {
          color: gridColor,
        },
        angleLines: {
          color: gridColor,
        },
        pointLabels: {
          color: labelColor,
          font: { size: 11, weight: "500" as const },
        },
      },
    },
  };

  return (
    <div className="size-full">
      <Radar data={chartData} options={options} />
    </div>
  );
}
