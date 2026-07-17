"use client";

import { Radar } from "react-chartjs-2";
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

type RadarChartProps<T extends Record<string, number>> = {
  data: T[];
  keys: Array<keyof T>;
};

export default function RadarChart<T extends Record<string, number>>({
  data,
  keys,
}: RadarChartProps<T>) {
  const chartData = {
    labels: keys.map((key) => key.toString()),
    datasets: [
      {
        label: "Performance",
        data: keys.map((key) => data[0][key]),
        backgroundColor: "rgba(59, 130, 246, 0.2)",
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
      r: {
        angleLines: { display: true },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  };

  return <Radar data={chartData} options={options} />;
}