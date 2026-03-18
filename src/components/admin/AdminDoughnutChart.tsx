"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AdminDoughnutChart({ labels, data, colors }: {
  labels: string[]; data: number[]; colors?: string[];
}) {
  return (
    <Doughnut
      data={{
        labels,
        datasets: [{
          data,
          backgroundColor: colors ?? ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
          borderWidth: 0,
        }],
      }}
      options={{
        responsive: true,
        plugins: { legend: { position: "bottom", labels: { color: "#9ca3af", font: { size: 11 }, padding: 12 } } },
      }}
    />
  );
}
