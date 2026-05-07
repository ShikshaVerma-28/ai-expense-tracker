// app/components/ReceiptUpload.tsx
"use client";

import React, {
  useState,
  useRef,
} from 'react';

import Tesseract from 'tesseract.js';

import Spinner from './Spinner';

import { ProcessedExpenseData } from '../types';

interface ReceiptUploadProps {
  onExpenseProcessed: (
    expenseData: ProcessedExpenseData
  ) => void;
}

const ReceiptUpload: React.FC<
  ReceiptUploadProps
> = ({ onExpenseProcessed }) => {

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [isLoading, setIsLoading] =
    useState<boolean>(false);

  const [error, setError] =
    useState<string | null>(null);

  const [status, setStatus] =
    useState<string>('');

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  // FILE SELECT
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file = event.target.files?.[0];

    if (file) {

      setSelectedFile(file);

      setStatus(
        `Selected: ${file.name}`
      );

      setError(null);

    } else {

      setSelectedFile(null);

      setStatus('');
    }
  };

  // PROCESS RECEIPT
  const handleUpload = async () => {

    if (!selectedFile) {

      setError(
        'Please select a receipt image first.'
      );

      return;
    }

    setIsLoading(true);

    setError(null);

    try {

      // OCR STEP
      setStatus(
        'Reading receipt text...'
      );

      const {
        data: { text },
      } = await Tesseract.recognize(
        selectedFile,
        'eng',
        {
          logger: (m) =>
            console.log(m),
        }
      );

      console.log(
        "EXTRACTED OCR TEXT:"
      );

      console.log(text);

      // VALIDATION
      if (
        !text ||
        text.trim().length < 2
      ) {

        console.log(
          "OCR FAILED TEXT:",
          text
        );

        throw new Error(
          'Receipt text not detected clearly. Try a clearer receipt image.'
        );
      }

      // SEND OCR TEXT TO BACKEND
      setStatus(
        'Analyzing expense...'
      );

      const response =
        await fetch(
          '/api/process-receipt',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              extractedText: text,
            }),
          }
        );

      // RAW RESPONSE
      const rawText =
        await response.text();

      console.log(
        'RAW RESPONSE:',
        rawText
      );

      let result;

      try {

        result =
          JSON.parse(rawText);

      } catch {

        throw new Error(
          'Server returned invalid JSON'
        );
      }

      // ERROR RESPONSE
      if (!response.ok) {

        throw new Error(
          result.error ||
          'Processing failed'
        );
      }

      // SUCCESS
      setStatus(
        'Processing complete!'
      );

      onExpenseProcessed(
        result.data as ProcessedExpenseData
      );

      // RESET
      setSelectedFile(null);

      if (
        fileInputRef.current
      ) {

        fileInputRef.current.value =
          '';
      }

      setTimeout(() => {

        setStatus('');

      }, 3000);

    } catch (err: any) {

      console.error(
        'Receipt processing error:',
        err
      );

      setError(
        `Error: ${err.message}`
      );

      setStatus(
        'Processing failed.'
      );

    } finally {

      setIsLoading(false);
    }
  };

  return (

    <div className="space-y-3">

      <div className="flex items-center space-x-3">

        {/* Upload Button */}
        <label
          htmlFor="receipt-upload"
          className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
            isLoading
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
        >
          Choose Receipt
        </label>

        {/* Hidden File Input */}
        <input
          id="receipt-upload"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={
            handleFileChange
          }
          className="sr-only"
          disabled={isLoading}
        />

        {/* Process Button */}
        {selectedFile &&
          !isLoading && (

          <button
            onClick={
              handleUpload
            }
            disabled={
              isLoading
            }
            className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Process Receipt
          </button>
        )}

        {/* Spinner */}
        {isLoading && (
          <Spinner size="sm" />
        )}

      </div>

      {/* Status */}
      <p className="text-sm text-gray-600 min-h-5">
        {status}
      </p>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

    </div>
  );
};

export default ReceiptUpload;