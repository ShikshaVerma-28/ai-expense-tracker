// app/components/BudgetTips.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import { Expense } from '../types';

interface BudgetTipsProps {
  expenses: Expense[]; // Pass filtered expenses for the relevant period
}

const BudgetTips: React.FC<BudgetTipsProps> = ({ expenses }) => {
  const [tips, setTips] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTips = async () => {
      if (expenses.length === 0) {
        setTips('Add some expenses to get budget tips.');
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setTips(''); // Clear previous tips

      try {
         // Prepare summary data (optional, can also send raw expenses)
         const summaryData = expenses.map(e => ({
            category: e.category,
            amount: e.amount,
            description: e.description
         }));

        const response = await fetch('/api/generate-tips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // Send only necessary data to the API
          body: JSON.stringify({ expenses: summaryData.slice(0, 50) }), // Limit payload size if needed
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch tips');
        }

        setTips(result.tips || 'No specific tips available right now.');
      } catch (err: any) {
        console.error('Error fetching budget tips:', err);
        setError(`Error: ${err.message}`);
        setTips('');
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce or fetch only when expenses change significantly might be better in real app
    fetchTips();

  }, [expenses]); // Re-fetch tips when the relevant expenses change

  return (
    <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-md min-h-15">
      <h4 className="text-sm font-semibold text-green-800 mb-2">
        <span className="font-bold text-indigo-600">AI</span> Budget Tips:
      </h4>
      {isLoading && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Spinner size="sm" />
          <span>Generating personalized tips...</span>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!isLoading && !error && <p className="text-sm text-green-700">{tips}</p>}
    </div>
  );
};

export default BudgetTips;