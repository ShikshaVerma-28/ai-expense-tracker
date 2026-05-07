// app/page.tsx
"use client"; // This page manages state, so it's a Client Component

import React, { useState, useMemo, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import ExpenseForm from './components/ExpenseForm';
import ReceiptUpload from './components/ReceiptUpload';
import ExpenseList from './components/ExpenseList';
import SummaryChart from './components/SummaryChart';
import BudgetTips from './components/BudgetTips';
import { Expense, ProcessedExpenseData } from './types';

export default function HomePage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or 1-12
  
  // Load expenses from localStorage on initial mount (simple persistence)
  useEffect(() => {
      const storedExpenses = localStorage.getItem('expenses_nextjs');
      if (storedExpenses) {
          try {
            const parsedExpenses: Expense[] = JSON.parse(storedExpenses);
             // Basic validation after parsing
             if (Array.isArray(parsedExpenses)) {
                 setExpenses(parsedExpenses.map(exp => ({
                    ...exp,
                    amount: Number(exp.amount) || 0, // Ensure amount is number
                    id: Number(exp.id) || Date.now() // Ensure id is number
                 })));
             }
          } catch (error) {
             console.error("Failed to parse expenses from localStorage", error);
             localStorage.removeItem('expenses_nextjs'); // Clear corrupted data
          }
      }
  }, []);

  // Save expenses to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('expenses_nextjs', JSON.stringify(expenses));
  }, [expenses]);

  const handleAddManualExpense = (newExpenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...newExpenseData,
      id: Date.now(), // Simple unique ID
      // Now it will keep the category from the form
    };
    setExpenses(prevExpenses => [newExpense, ...prevExpenses].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ));
  };

  const handleAddProcessedExpense = (processedData: ProcessedExpenseData) => {
    console.log(processedData.amount,'process ')
     // Use defaults if AI couldn't determine values
     const newExpense: Expense = {
        id: Date.now(),
        amount: processedData.amount ?? 0, // Use ?? for nullish coalescing
        date: processedData.date ?? new Date().toISOString().split('T')[0],
        description: processedData.merchant ?? 'Processed Receipt',
        category: processedData.category ?? 'Uncategorized',
     };
      if (newExpense.amount <= 0 && !processedData.amount) {
         alert("AI could not determine the expense amount. Please add manually or check the receipt.");
         return; // Don't add expense with 0 amount if AI failed
      }
      setExpenses(prevExpenses => [newExpense, ...prevExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      console.log(expenses,'expensed')
  };

  const handleDeleteExpense = (idToDelete: number) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== idToDelete));
    }
  };

  // Filter expenses based on the selected month
  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const expenseYear = expense.date.substring(0, 4);
      if (expenseYear !== selectedYear) {
        return false;
      }
      if (selectedMonth === 'all') {
        return true; // Year matches, and we want all months
      }
      const expenseMonth = expense.date.substring(5, 7);
      // `selectedMonth` is 1-12, `expenseMonth` is 01-12
      return parseInt(expenseMonth, 10).toString() === selectedMonth;
    });
  }, [expenses, selectedYear, selectedMonth]);

  const totalForPeriod = useMemo(() => {
      return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

  const availableYears = useMemo(() => {
    const years = new Set(expenses.map((exp) => exp.date.substring(0, 4)));
    const currentYear = new Date().getFullYear().toString();
    years.add(currentYear); // Always include the current year
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [expenses]);

  const formattedPeriod = useMemo(() => {
    if (selectedMonth === 'all') {
      return selectedYear;
    }
    try {
      const date = parseISO(`${selectedYear}-${selectedMonth.padStart(2, '0')}-01`);
      // Check if the parsed date is valid before formatting.
      if (isNaN(date.getTime())) {
        return `Invalid period`;
      }
      return format(date, 'MMMM yyyy');
    } catch (e) {
      return `Invalid period`;
    }
  }, [selectedYear, selectedMonth]);

   const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (event: React.ChangeEvent<HTMLSelectElement>) => {
        setter(event.target.value);
   };

    // Function to clear all expenses
    const clearAllExpenses = () => {
        if (confirm('Are you sure you want to delete ALL expenses? This cannot be undone.')) {
            setExpenses([]);
            localStorage.removeItem('expenses_nextjs'); // Clear storage too
        }
    };


  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl">
      <header className="text-center mb-8 border-b pb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
           <span className="text-indigo-600">AI</span>-Powered Expense Tracker 
        </h1>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Entry */}
        <section className="lg:col-span-1 space-y-6 p-6 bg-white rounded-lg shadow-md border border-gray-200">
          <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Add New Expense</h2>
              <ExpenseForm onAddExpense={handleAddManualExpense} />
          </div>
          <hr className="my-6 border-gray-200" />
          <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Or Upload Receipt</h3>
              <ReceiptUpload onExpenseProcessed={handleAddProcessedExpense} />
          </div>
        </section>

        {/* Right Column: List and Summary */}
        <section className="lg:col-span-2 space-y-6">
            {/* Month Selector and List */}
            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                     <h2 className="text-xl font-semibold text-gray-700">Your Expenses</h2>
                     <div className="flex items-center gap-2">
                        <div>
                            <label htmlFor="year-select" className="sr-only">Select Year:</label>
                            <select
                                id="year-select"
                                value={selectedYear}
                                onChange={handleFilterChange(setSelectedYear)}
                                className=" text-[#2c2a2b] rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            >
                                {availableYears.map((year) => (
                                <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="month-select" className="sr-only">Select Month:</label>
                            <select
                                id="month-select"
                                value={selectedMonth}
                                onChange={handleFilterChange(setSelectedMonth)}
                                className=" text-[#2c2a2b] rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            >
                                <option value="all">All Months</option>
                                {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{format(new Date(2000, i, 1), 'MMMM')}</option>
                                ))}
                            </select>
                        </div>
                     </div>
                </div>
                <ExpenseList expenses={filteredExpenses} onDeleteExpense={handleDeleteExpense} />
                 {expenses.length > 0 && (
                     <button
                        onClick={clearAllExpenses}
                        className="mt-4 inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        Clear All Expenses
                    </button>
                 )}
            </div>

            {/* Summary and Insights */}
            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Monthly Summary & Insights</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                     {/* Chart */}
                     <div className="w-full">
                        <SummaryChart expenses={filteredExpenses} />
                     </div>
                      {/* Details & Tips */}
                     <div className="space-y-3">
                          <h3 className="text-lg font-medium text-gray-800">
                             Total Expenses ({formattedPeriod}):
                             <span className="font-bold ml-2">₹{totalForPeriod.toFixed(2)}</span>
                          </h3>
                          <BudgetTips expenses={filteredExpenses} />
                     </div>
                 </div>
            </div>
        </section>
      </main>

       <footer className="text-center mt-12 pt-6 border-t text-gray-500 text-sm">
          Built with Next.js, TypeScript, Tailwind CSS & AI ✨
       </footer>
    </div>
  );
}