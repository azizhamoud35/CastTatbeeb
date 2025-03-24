import React from 'react';
import { Upload } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}

export default function FileUploader({ onFileSelect, uploading }: FileUploaderProps) {
  return (
    <>
      <input
        id="file-upload"
        name="file-upload"
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={onFileSelect}
        disabled={uploading}
      />
      <div>
        <span className="text-sm text-gray-500">
          Upload your contacts file (CSV or Excel)
        </span>
      </div>
      <button
        type="button"
        onClick={() => document.getElementById('file-upload')?.click()}
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50"
        disabled={uploading}
      >
        <Upload className="h-4 w-4 mr-1.5" />
        {uploading ? 'Processing...' : 'Select File'}
      </button>
      {uploading && (
        <div className="mt-1 text-sm text-gray-500 animate-pulse">
          Processing contacts...
        </div>
      )}
    </>
  );
}