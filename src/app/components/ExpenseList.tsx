// app/components/ExpenseList.tsx
import React from 'react';
import { Expense } from '../types';
import { format } from 'date-fns'; // For formatting date

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: number) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDeleteExpense }) => {
  if (expenses.length === 0) {
    return <p className="text-gray-500 italic">No expenses recorded for this period.</p>;
  }

  return (
    <ul className="space-y-3">
      {expenses.map((expense) => (
        <li
          key={expense.id}
          className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-md bg-white p-4 shadow-sm border border-gray-200 hover:bg-gray-50"
        >
          <div className="grow space-y-1">
            <p className="text-sm font-semibold leading-6 text-gray-900">{expense.description}</p>
            <div className="flex items-center gap-x-4 text-xs text-gray-500">
              <p>
                 {/* Add time offset correction if needed, otherwise just parse */}
                 {format(new Date(expense.date + 'T00:00:00'), 'MMM dd, yyyy')}
              </p>
              <p className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{expense.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-x-4">
             <p className="text-sm font-medium text-gray-900">₹{expense.amount.toFixed(2)}</p>
             <button
                onClick={() => onDeleteExpense(expense.id)}
                className="text-red-500 hover:text-red-700 text-xl font-bold"
                aria-label={`Delete expense: ${expense.description}`}
                title="Delete expense"
             >
               &times;
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default ExpenseList;