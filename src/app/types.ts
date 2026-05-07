// app/types.ts

export interface Expense {
    id: number; // Use number (e.g., timestamp) or string (e.g., UUID)
    amount: number;
    date: string; // YYYY-MM-DD format
    description: string;
    category: string; // e.g., 'Food', 'Travel', 'Uncategorized'
  }
   
  
  // Type for data expected from the /api/process-receipt endpoint
  export interface ProcessedExpenseData {
      amount: number | null;
      date: string | null; // Should be YYYY-MM-DD
      merchant: string | null;
      category: string | null;
  }