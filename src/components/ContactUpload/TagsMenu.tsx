import React from 'react';
import { Tag as TagIcon, ChevronDown } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagsMenuProps {
  tags: Tag[];
  selectedTags: Set<string>;
  showMenu: boolean;
  onToggleMenu: (show: boolean) => void;
  onToggleTag: (tagId: string) => void;
}

export default function TagsMenu({
  tags,
  selectedTags,
  showMenu,
  onToggleMenu,
  onToggleTag
}: TagsMenuProps) {
  return (
    <div className="relative">
      <button
        onClick={() => onToggleMenu(!showMenu)}
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <TagIcon className="h-4 w-4 mr-1.5" />
        Tags
        <ChevronDown className="h-4 w-4 ml-1" />
      </button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => onToggleMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1" role="menu">
              {tags.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500">
                  No tags available
                </div>
              ) : (
                tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => onToggleTag(tag.id)}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-2 ${
                      selectedTags.has(tag.id)
                        ? 'bg-blue-50 text-blue-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <TagIcon 
                      className="h-4 w-4" 
                      style={{ color: tag.color }} 
                    />
                    <span>{tag.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}