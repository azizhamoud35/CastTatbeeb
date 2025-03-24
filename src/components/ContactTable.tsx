import React from 'react';
import { Trash2, ChevronUp, ChevronDown, CheckSquare, Square, Tag as TagIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Contact {
  id: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
  tags: Tag[];
}

type SortField = 'phone_number' | 'created_at' | 'is_active';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface ContactTableProps {
  contacts: Contact[];
  selectedContacts: Set<string>;
  sort: SortConfig;
  onSort: (field: SortField) => void;
  onToggleSelectAll: () => void;
  onToggleSelectContact: (id: string) => void;
  onToggleActive: (contact: Contact) => void;
  onDeleteContact: (id: string) => void;
  page: number;
  pageSize: number;
  totalContacts: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function ContactTable({
  contacts,
  selectedContacts,
  sort,
  onSort,
  onToggleSelectAll,
  onToggleSelectContact,
  onToggleActive,
  onDeleteContact,
  page,
  pageSize,
  totalContacts,
  onPageChange,
  onPageSizeChange
}: ContactTableProps) {
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sort.field !== field) {
      return <ChevronUp className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100" />;
    }
    return sort.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-500" />
      : <ChevronDown className="h-4 w-4 text-blue-500" />;
  };

  const totalPages = Math.ceil(totalContacts / pageSize);
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalContacts);

  const pageSizeOptions = [10, 25, 50, 100, 250, 500, 1000, -1]; // -1 represents "All"

  const getPageSizeLabel = (size: number) => {
    if (size === -1) return 'All';
    return size.toString();
  };

  const getCurrentPageSize = () => {
    if (pageSize === -1) return totalContacts;
    return pageSize;
  };

  const getTotalPages = () => {
    if (pageSize === -1) return 1;
    return Math.ceil(totalContacts / pageSize);
  };

  const paginatedContacts = contacts.slice(
    (page - 1) * getCurrentPageSize(),
    page * getCurrentPageSize()
  );

  // Desktop view
  const DesktopView = () => (
    <>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">
              <button
                onClick={onToggleSelectAll}
                className="flex items-center space-x-2 hover:text-gray-700"
              >
                {selectedContacts.size === contacts.length ? (
                  <CheckSquare className="h-4 w-4 text-blue-500" />
                ) : (
                  <Square className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
              onClick={() => onSort('phone_number')}
            >
              <div className="flex items-center space-x-1">
                <span>Phone Number</span>
                <SortIcon field="phone_number" />
              </div>
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
              onClick={() => onSort('created_at')}
            >
              <div className="flex items-center space-x-1">
                <span>Created At</span>
                <SortIcon field="created_at" />
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tags
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
              onClick={() => onSort('is_active')}
            >
              <div className="flex items-center space-x-1">
                <span>Status</span>
                <SortIcon field="is_active" />
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {contacts.map((contact) => (
            <tr key={contact.id} className={selectedContacts.has(contact.id) ? 'bg-blue-50' : ''}>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => onToggleSelectContact(contact.id)}
                  className="flex items-center space-x-2 hover:text-gray-700"
                >
                  {selectedContacts.has(contact.id) ? (
                    <CheckSquare className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {contact.phone_number}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(contact.created_at), 'MMM d, yyyy HH:mm')}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: `${tag.color}15`,
                        color: tag.color
                      }}
                    >
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tag.name}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => onToggleActive(contact)}
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    contact.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {contact.is_active ? 'Active' : 'Inactive'}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => onDeleteContact(contact.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-white">
        <div className="flex items-center">
          <span className="text-sm text-gray-700">
            Show
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="mx-2 rounded-md border-gray-300 py-1 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {getPageSizeLabel(size)}
                </option>
              ))}
            </select>
            entries
          </span>
        </div>
        
        <div className="flex items-center">
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalContacts}</span> contacts
          </p>
          
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px ml-4" aria-label="Pagination">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </>
  );

  // Mobile view
  const MobileView = () => (
    <>
      <div className="divide-y divide-gray-200">
        {contacts.map((contact) => (
          <div 
            key={contact.id} 
            className={`p-4 space-y-3 ${selectedContacts.has(contact.id) ? 'bg-blue-50' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <button
                  onClick={() => onToggleSelectContact(contact.id)}
                  className="mt-1"
                >
                  {selectedContacts.has(contact.id) ? (
                    <CheckSquare className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400" />
                  )}
                </button>
                <div className="space-y-1">
                  <div className="font-medium">{contact.phone_number}</div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(contact.created_at), 'MMM d, yyyy HH:mm')}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onToggleActive(contact)}
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    contact.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {contact.is_active ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => onDeleteContact(contact.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {contact.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {contact.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: `${tag.color}15`,
                      color: tag.color
                    }}
                  >
                    <TagIcon className="h-3 w-3 mr-1" />
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile Pagination Controls */}
      <div className="px-4 py-3 flex flex-col space-y-3 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700">
            Show
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="mx-2 rounded-md border-gray-300 py-1 text-base focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {getPageSizeLabel(size)}
                </option>
              ))}
            </select>
            entries
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            {startItem}-{endItem} of {totalContacts}
          </p>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="hidden md:block">
        <DesktopView />
      </div>
      <div className="md:hidden">
        <MobileView />
      </div>
    </>
  );
}