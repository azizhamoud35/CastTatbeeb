import React, { useState } from 'react';
import { Search, AlertTriangle, Tag as TagIcon, MoreVertical, CheckCircle, XCircle, Trash2, Plus, Minus, ChevronDown, Filter } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  color: string;
  contact_count: number;
}

interface ContactToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (value: 'all' | 'active' | 'inactive') => void;
  selectedCount: number;
  onShowTags: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  onCheckDuplicates: () => void;
  removingDuplicates: boolean;
  tags: Tag[];
  includedTags: Set<string>;
  excludedTags: Set<string>;
  onTagInclude: (tagId: string) => void;
  onTagExclude: (tagId: string) => void;
  filteredContactsCount: number;
  totalContactsCount: number;
}

export default function ContactToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedCount,
  onShowTags,
  onActivate,
  onDeactivate,
  onDelete,
  onCheckDuplicates,
  removingDuplicates,
  tags,
  includedTags,
  excludedTags,
  onTagInclude,
  onTagExclude,
  filteredContactsCount,
  totalContactsCount
}: ContactToolbarProps) {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const getTagStatus = (tagId: string) => {
    if (includedTags.has(tagId)) return 'included';
    if (excludedTags.has(tagId)) return 'excluded';
    return 'none';
  };

  const handleTagClick = (tagId: string) => {
    const status = getTagStatus(tagId);
    switch (status) {
      case 'none':
        onTagInclude(tagId);
        break;
      case 'included':
        onTagExclude(tagId);
        break;
      case 'excluded':
        // Reset to neutral state
        onTagExclude(tagId); // This will remove from excluded set
        break;
    }
  };

  const getTagStyles = (tagId: string) => {
    const status = getTagStatus(tagId);
    switch (status) {
      case 'included':
        return {
          container: 'bg-green-50 text-green-700 hover:bg-green-100',
          icon: <Plus className="h-4 w-4 mr-2 text-green-600" />,
          count: 'bg-green-100 text-green-800'
        };
      case 'excluded':
        return {
          container: 'bg-red-50 text-red-700 hover:bg-red-100',
          icon: <Minus className="h-4 w-4 mr-2 text-red-600" />,
          count: 'bg-red-100 text-red-800'
        };
      default:
        return {
          container: 'text-gray-700 hover:bg-gray-50',
          icon: <TagIcon className="h-4 w-4 mr-2" style={{ color: tags.find(t => t.id === tagId)?.color }} />,
          count: 'bg-gray-100 text-gray-600'
        };
    }
  };

  const getActiveFiltersCount = () => {
    return includedTags.size + excludedTags.size;
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
          {/* Search input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search phone numbers..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className={`inline-flex items-center justify-between w-full md:w-48 px-3 py-2 text-sm border rounded-md ${
                statusFilter !== 'all'
                  ? 'border-blue-500 text-blue-700 bg-blue-50'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>{statusFilter === 'all' ? 'All Status' : statusFilter === 'active' ? 'Active Only' : 'Inactive Only'}</span>
              </div>
              <ChevronDown className="h-4 w-4 ml-2" />
            </button>

            {showStatusDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowStatusDropdown(false)}
                />
                <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onStatusFilterChange('all');
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        statusFilter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      All Status
                    </button>
                    <button
                      onClick={() => {
                        onStatusFilterChange('active');
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        statusFilter === 'active' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Active Only
                    </button>
                    <button
                      onClick={() => {
                        onStatusFilterChange('inactive');
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        statusFilter === 'inactive' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Inactive Only
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Tags Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowTagsDropdown(!showTagsDropdown)}
              className={`inline-flex items-center justify-between w-full md:w-48 px-3 py-2 text-sm border rounded-md ${
                getActiveFiltersCount() > 0
                  ? 'border-blue-500 text-blue-700 bg-blue-50'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <TagIcon className="h-4 w-4 mr-2" />
                <span>
                  {getActiveFiltersCount() === 0
                    ? 'Filter by Tags'
                    : `${getActiveFiltersCount()} tag filter${getActiveFiltersCount() > 1 ? 's' : ''}`}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 ml-2" />
            </button>

            {showTagsDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowTagsDropdown(false)}
                />
                <div className="absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                  {/* Filtered Contacts Count */}
                  <div className="p-2 border-b border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center text-gray-600">
                        <Filter className="h-4 w-4 mr-1" />
                        <span>Filtered Contacts:</span>
                      </div>
                      <span className="font-medium">
                        {filteredContactsCount.toLocaleString()} of {totalContactsCount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="py-1 max-h-96 overflow-y-auto">
                    {tags.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No tags available
                      </div>
                    ) : (
                      <div className="p-2 text-xs text-gray-500 border-b border-gray-100">
                        Click to include, click again to exclude, click once more to clear
                      </div>
                    )}
                    {tags.map((tag) => {
                      const styles = getTagStyles(tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => handleTagClick(tag.id)}
                          className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between group ${styles.container}`}
                        >
                          <div className="flex items-center">
                            {styles.icon}
                            <span>{tag.name}</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${styles.count}`}>
                            {tag.contact_count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {selectedCount > 0 ? (
            <div className="relative">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="mr-1">{selectedCount} selected</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {showActionsMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10"
                    onClick={() => setShowActionsMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          onShowTags();
                          setShowActionsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <TagIcon className="h-4 w-4 mr-3 text-blue-500" />
                        Manage Tags
                      </button>
                      <button
                        onClick={() => {
                          onActivate();
                          setShowActionsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <CheckCircle className="h-4 w-4 mr-3 text-green-500" />
                        Activate
                      </button>
                      <button
                        onClick={() => {
                          onDeactivate();
                          setShowActionsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <XCircle className="h-4 w-4 mr-3 text-orange-500" />
                        Deactivate
                      </button>
                      <button
                        onClick={() => {
                          onDelete();
                          setShowActionsMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center border-t border-gray-100"
                      >
                        <Trash2 className="h-4 w-4 mr-3 text-red-500" />
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Only show Deduplicate Button when no contacts are selected */
            <button
              onClick={onCheckDuplicates}
              disabled={removingDuplicates}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              <AlertTriangle className="h-4 w-4 mr-1.5 md:mr-2" />
              <span className="hidden md:inline">Deduplicate</span>
              <span className="md:hidden">Dedup</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}