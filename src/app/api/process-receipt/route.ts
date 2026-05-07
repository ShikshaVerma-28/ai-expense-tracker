// app/api/process-receipt/route.ts

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const extractedText = body.extractedText;

    if (!extractedText || typeof extractedText !== 'string') {
      return NextResponse.json(
        {
          error: 'Receipt text is required',
        },
        {
          status: 400,
        }
      );
    }

    console.log('OCR TEXT:', extractedText);

    // ---------- AMOUNT ----------
    let amount = 0;

    const amountMatch =
      extractedText.match(
        /(total|amount|grand total|balance)\D*([\d,.]+)/i
      );

    if (amountMatch?.[2]) {
      amount = parseFloat(
        amountMatch[2].replace(/,/g, '')
      );
    }

    // ---------- DATE ----------
    let date =
      new Date()
        .toISOString()
        .split('T')[0];

    const dateMatch =
      extractedText.match(
        /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/
      );

    if (dateMatch?.[0]) {
      date = dateMatch[0];
    }

    // ---------- DESCRIPTION ----------
    const lines =
      extractedText
        .split('\n')
        .filter(line => line.trim() !== '');

    let merchant =
      lines[0] || 'Receipt Expense';

    // ---------- CATEGORY ----------
    let category = 'Other';

    const lowerText =
      extractedText.toLowerCase();

    if (
      lowerText.includes('restaurant') ||
      lowerText.includes('cafe') ||
      lowerText.includes('food')
    ) {
      category = 'Food';
    }
    else if (
      lowerText.includes('uber') ||
      lowerText.includes('ola') ||
      lowerText.includes('fuel')
    ) {
      category = 'Travel';
    }
    else if (
      lowerText.includes('medical') ||
      lowerText.includes('pharmacy')
    ) {
      category = 'Health';
    }
    else if (
      lowerText.includes('mall') ||
      lowerText.includes('shopping')
    ) {
      category = 'Shopping';
    }

    return NextResponse.json({
      success: true,

      data: {
        amount,
        date,
        merchant,
        category,
        rawText: extractedText,
      },
    });

  } catch (error: any) {

    console.error(
      'Receipt processing failed:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          'Something went wrong',
      },
      {
        status: 500,
      }
    );
  }
}