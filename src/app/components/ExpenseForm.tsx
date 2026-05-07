"use client";

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Expense } from '../types';

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
}

const CATEGORIES = [
  'Food',
  'Groceries',
  'Travel',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Health',
  'Services',
  'Rent/Mortgage',
  'Education',
  'Gifts/Donations',
  'Other'
];

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense }) => {
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Other');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    
    if (!amount || !date || !description || !category) {
      alert('Please fill in all fields.');
      return;
    }

    onAddExpense({
      amount: parseFloat(amount),
      date,
      description,
      category
    });

    // Reset form fields
    setAmount('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-md">
      <div>
        <label htmlFor="expense-amount" className="block text-sm font-semibold text-gray-700">
          Amount (₹)
        </label>
        <input
          type="number"
          id="expense-amount"
          value={amount}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0.01"
          required
          className="text-[#454244] mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 transition-all"
        />
      </div>

      <div>
        <label htmlFor="expense-date" className="block text-sm font-semibold text-gray-700">
          Date
        </label>
        <input
          type="date"
          id="expense-date"
          value={date}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
          required
          className="text-[#454244] mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 transition-all"
        />
      </div>

      <div>
        <label htmlFor="expense-description" className="block text-sm font-semibold text-gray-700">
          Description
        </label>
        <input
          type="text"
          id="expense-description"
          value={description}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
          placeholder="What did you spend on?"
          required
          className="text-[#454244] mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 transition-all"
        />
      </div>

      <div>
        <label htmlFor="expense-category" className="block text-sm font-semibold text-gray-700">
          Category
        </label>
        <select
          id="expense-category"
          value={category}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
          required
          className="text-[#454244] mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 transition-all"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full inline-flex justify-center rounded-lg border border-transparent bg-indigo-600 py-3 px-4 text-sm font-bold text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all active:scale-95"
      >
        Add Expense
      </button>
    </form>
  );
};

export default ExpenseForm;