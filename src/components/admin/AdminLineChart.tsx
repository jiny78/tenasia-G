"use client";

import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Dataset { label: string; data: number[]; color?: string; fill?: boolean }

export default function AdminLineChart({ labels, datasets }: { labels: string[]; datasets: Dataset[] }) {
  return (
    <Line
      data={{
        labels,
        datasets: datasets.map((d, i) => ({
          label:           d.label,
          data:            d.data,
          borderColor:     d.color ?? (i === 0 ? "#60a5fa" : "#34d399"),
          backgroundColor: d.fill ? (i === 0 ? "#60a5fa30" : "#34d39930") : "transparent",
          fill:            d.fill ?? false,
          tension:         0.3,
          pointRadius:     2,
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
