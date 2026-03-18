"use client";

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Dataset { label: string; data: number[]; color?: string }

export default function AdminBarChart({ labels, datasets }: { labels: string[]; datasets: Dataset[] }) {
  return (
    <Bar
      data={{
        labels,
        datasets: datasets.map((d, i) => ({
          label:           d.label,
          data:            d.data,
          backgroundColor: d.color ?? (i === 0 ? "#3b82f6" : "#10b981"),
          borderRadius:    3,
        })),
      }}
      options={{
        responsive: true,
        plugins: { legend: { labels: { color: "#9ca3af", font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: "#6b7280", font: { size: 10 } }, grid: { color: "#27272a" } },
          y: { ticks: { color: "#6b7280", font: { size: 10 } }, grid: { color: "#27272a" } },
        },
      }}
    />
  );
}
