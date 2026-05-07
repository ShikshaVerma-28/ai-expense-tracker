// app/api/generate-tips/route.ts
import { NextResponse } from 'next/server';
import { generateBudgetTipsWithAI } from '../../lib/aiUtlis'; // Helper function

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const expenses = body.expenses; // Expecting an array of simplified expense objects

    if (!Array.isArray(expenses)) {
      return NextResponse.json({ error: 'Invalid input: expenses array is required.' }, { status: 400 });
    }

    console.log(`Generating tips for ${expenses.length} expenses...`);
    const tips = await generateBudgetTipsWithAI(expenses); // Use helper

    return NextResponse.json({ tips });

  } catch (error: any) {
    console.error('[API Generate Tips Error]:', error);
    return NextResponse.json({ error: 'Failed to generate budget tips.', details: error.message }, { status: 500 });
  }
}