import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  error: string | null;
}

export default function ErrorMessage({ error }: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div className="flex items-center justify-center text-red-500 text-sm">
      <AlertCircle className="h-4 w-4 mr-1" />
      {error}
    </div>
  );
}