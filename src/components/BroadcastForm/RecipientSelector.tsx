import React from 'react';
import { Tag as TagIcon } from 'lucide-react';
import type { RecipientSelectorProps } from './types';

export default function RecipientSelector({
  filterMode,
  onFilterModeChange,
  tags,
  selectedTags,
  onTagToggle,
  activeContactsCount
}: RecipientSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-4">
        <label className="inline-flex items-center">
          <input
            type="radio"
            value="all"
            checked={filterMode === 'all'}
            onChange={(e) => onFilterModeChange(e.target.value as 'all' | 'tags')}
            className="form-radio h-4 w-4 text-blue-600"
          />
          <span className="ml-2">All active contacts ({activeContactsCount})</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            value="tags"
            checked={filterMode === 'tags'}
            onChange={(e) => onFilterModeChange(e.target.value as 'all' | 'tags')}
            className="form-radio h-4 w-4 text-blue-600"
          />
          <span className="ml-2">Filter by tags</span>
        </label>
      </div>
      
      {filterMode === 'tags' && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onTagToggle(tag.id)}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTags.has(tag.id)
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              <TagIcon className="h-3 w-3 mr-1" style={{ color: tag.color }} />
              <span>{tag.name}</span>
              <span className="ml-1 px-1.5 py-0.5 bg-white bg-opacity-50 rounded-full text-xs">
                {tag.contact_count}
              </span>
            </button>
          ))}
          {tags.length === 0 && (
            <span className="text-sm text-gray-500">No tags available</span>
          )}
        </div>
      )}
    </div>
  );
}