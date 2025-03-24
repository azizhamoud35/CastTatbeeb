import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import type { ImageUploadProps } from './types';

export default function ImageUpload({ image, imagePreview, onImageChange, onImageRemove }: ImageUploadProps) {
  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        onChange={onImageChange}
        className="hidden"
        id="image-upload"
      />
      <label
        htmlFor="image-upload"
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
      >
        <ImageIcon className="h-5 w-5 mr-2" />
        Choose Image
      </label>
      {imagePreview && (
        <div className="mt-2">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-w-xs rounded-lg shadow-sm"
          />
          <button
            type="button"
            onClick={onImageRemove}
            className="mt-2 text-sm text-red-600 hover:text-red-500"
          >
            Remove image
          </button>
        </div>
      )}
    </div>
  );
}