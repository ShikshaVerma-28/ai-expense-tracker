"use client";

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PieController
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { Expense } from '../types';

// Register Chart.js components - using ChartJS alias to avoid naming conflicts
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PieController
);

interface SummaryChartProps {
  expenses: Expense[];
}

// ... rest of your code stays the same ...
const backgroundColors = [
    'rgba(54, 162, 235, 0.7)', // Blue
    'rgba(255, 99, 132, 0.7)',  // Red
    'rgba(75, 192, 192, 0.7)', // Green
    'rgba(255, 206, 86, 0.7)', // Yellow
    'rgba(153, 102, 255, 0.7)',// Purple
    'rgba(255, 159, 64, 0.7)', // Orange
    'rgba(201, 203, 207, 0.7)', // Grey
    'rgba(140, 180, 120, 0.7)', // Olive
];
const borderColors = backgroundColors.map(color => color.replace('0.7', '1'));

const SummaryChart: React.FC<SummaryChartProps> = ({ expenses }) => {
  // Aggregate data by category
  const categoryData = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + expense.amount;
    return acc;
  }, {} as { [key: string]: number });

  const chartData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        label: 'Expenses by Category',
        data: Object.values(categoryData),
        backgroundColor: backgroundColors.slice(0, Object.keys(categoryData).length),
        borderColor: borderColors.slice(0, Object.keys(categoryData).length),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Expense Distribution',
      },
       tooltip: {
           callbacks: {
              label: function(context: any) { // Use any for context or define a stricter type
                  let label = context.label || '';
                  if (label) {
                      label += ': ';
                  }
                  if (context.parsed !== null && context.parsed !== undefined) {
                      label += `₹${context.parsed.toFixed(2)}`;
                  }
                  return label;
              }
          }
      }
    },
  };

  if (expenses.length === 0 || Object.keys(categoryData).length === 0) {
      return <div className="text-center text-gray-500 py-10">No expense data for this period to display chart.</div>;
  }

  return (
    <div className="relative h-64 md:h-80"> {/* Adjust height as needed */}
      <Pie data={chartData} options={chartOptions} />
    </div>
  );
};

export default SummaryChart;