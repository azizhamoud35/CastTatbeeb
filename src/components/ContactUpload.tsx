import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Tag as TagIcon, ChevronDown } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { validateSaudiNumber, formatPhoneNumber } from '../utils/phoneValidation';

interface Contact {
  [key: string]: any;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface ProcessResult {
  valid: number;
  invalid: number;
  empty: number;
  duplicates: number;
  errors: string[];
}

export default function ContactUpload({ onUploadComplete }: { onUploadComplete: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showTagsMenu, setShowTagsMenu] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error: any) {
      console.error('Error loading tags:', error);
      toast.error('Error loading tags');
    }
  };

  const findPhoneNumberColumn = (contacts: Contact[]): string | null => {
    if (!contacts || contacts.length === 0) return null;

    const columns = Object.keys(contacts[0]);
    const commonNames = ['phone', 'mobile', 'cell', 'contact', 'number', 'tel', 'telephone'];
    const phoneColumn = columns.find(column => {
      const columnLower = column.toLowerCase().trim();
      return commonNames.some(name => columnLower.includes(name));
    });

    if (phoneColumn) return phoneColumn;

    // If no obvious phone column found, try to detect by content
    for (const column of columns) {
      let validNumbers = 0;
      let checkedRows = 0;
      
      for (const contact of contacts) {
        const value = contact[column];
        if (value) {
          checkedRows++;
          const cleaned = String(value).trim().replace(/[^0-9]/g, '');
          
          if (cleaned.startsWith('966') || 
              cleaned.startsWith('05') || 
              (cleaned.startsWith('5') && cleaned.length === 9)) {
            validNumbers++;
          }

          if (checkedRows >= 5) break;
        }
      }

      if (validNumbers >= Math.min(2, Math.ceil(checkedRows * 0.5))) {
        return column;
      }
    }

    return null;
  };

  const processContacts = async (contacts: Contact[]): Promise<ProcessResult> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found - please log in again');

      if (!Array.isArray(contacts) || contacts.length === 0) {
        throw new Error('No contacts found in file');
      }

      const phoneColumn = findPhoneNumberColumn(contacts);
      if (!phoneColumn) {
        throw new Error('No column containing phone numbers was found');
      }

      const validContacts: { phone_number: string; user_id: string }[] = [];
      const invalidNumbers: string[] = [];
      const emptyNumbers: number[] = [];
      const duplicates = new Set<string>();
      const errors: string[] = [];

      contacts.forEach((contact, index) => {
        try {
          if (!contact || 
              !contact[phoneColumn] || 
              contact[phoneColumn] === '' || 
              contact[phoneColumn] === undefined || 
              contact[phoneColumn] === null) {
            emptyNumbers.push(index + 1);
            return;
          }

          const phoneNumber = String(contact[phoneColumn]).trim().replace(/[^0-9]/g, '');
          if (!phoneNumber) {
            emptyNumbers.push(index + 1);
            return;
          }

          const formattedNumber = formatPhoneNumber(phoneNumber);
          if (formattedNumber && validateSaudiNumber(formattedNumber)) {
            if (!validContacts.some(c => c.phone_number === formattedNumber)) {
              validContacts.push({
                phone_number: formattedNumber,
                user_id: user.id
              });
            } else {
              duplicates.add(formattedNumber);
            }
          } else {
            invalidNumbers.push(phoneNumber || 'empty');
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Error processing contact';
          errors.push(`Row ${index + 1}: ${errorMessage}`);
        }
      });

      if (emptyNumbers.length > 0) {
        const rowList = emptyNumbers.length > 3 
          ? `rows ${emptyNumbers.slice(0, 3).join(', ')} and ${emptyNumbers.length - 3} more`
          : `row(s) ${emptyNumbers.join(', ')}`;
        errors.push(`Skipped ${emptyNumbers.length} empty number(s) in ${rowList}`);
      }

      if (invalidNumbers.length > 0) {
        console.warn('Invalid numbers found:', invalidNumbers);
        errors.push(`${invalidNumbers.length} invalid number(s) found`);
      }

      if (duplicates.size > 0) {
        errors.push(`${duplicates.size} duplicate number(s) in file were skipped`);
      }

      if (validContacts.length === 0) {
        throw new Error(
          emptyNumbers.length > 0
            ? `No valid contacts found. ${emptyNumbers.length} empty number(s) were skipped.`
            : 'No valid contacts found in the file'
        );
      }

      const BATCH_SIZE = 100;
      let successCount = 0;
      let duplicateCount = 0;

      for (let i = 0; i < validContacts.length; i += BATCH_SIZE) {
        const batch = validContacts.slice(i, i + BATCH_SIZE);
        const { data: insertedContacts, error: supabaseError } = await supabase
          .from('contacts')
          .upsert(
            batch,
            { 
              onConflict: 'phone_number',
              ignoreDuplicates: true 
            }
          )
          .select();

        if (supabaseError) {
          console.error('Supabase error:', supabaseError);
          throw supabaseError;
        }

        // Add tags to newly inserted contacts
        if (selectedTags.size > 0 && insertedContacts) {
          const contactTags = [];
          for (const contact of insertedContacts) {
            for (const tagId of selectedTags) {
              contactTags.push({
                contact_id: contact.id,
                tag_id: tagId
              });
            }
          }

          if (contactTags.length > 0) {
            const { error: tagError } = await supabase
              .from('contact_tags')
              .upsert(contactTags);

            if (tagError) {
              console.error('Error adding tags:', tagError);
              errors.push('Some tags could not be added to contacts');
            }
          }
        }

        successCount += batch.length;
        if (validContacts.length > BATCH_SIZE) {
          const progress = Math.round(((i + BATCH_SIZE) / validContacts.length) * 100);
          toast.success(`Processing: ${progress}%`, { id: 'upload-progress' });
        }
      }

      return {
        valid: successCount,
        invalid: invalidNumbers.length,
        empty: emptyNumbers.length,
        duplicates: duplicateCount,
        errors
      };
    } catch (error: any) {
      console.error('Process contacts error:', error);
      throw error;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setUploading(true);
      let contacts: Contact[] = [];

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size should be less than 5MB');
      }

      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const result = Papa.parse(text, { 
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.toLowerCase().trim()
        });
        
        if (result.errors && result.errors.length > 0) {
          console.error('CSV parsing errors:', result.errors);
          throw new Error('Error parsing CSV file - please check the file format');
        }
        
        contacts = result.data as Contact[];
      } else if (file.name.match(/\.xlsx?$/)) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('No sheets found in Excel file');
        }
        
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        contacts = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      } else {
        throw new Error('Unsupported file format. Please use CSV or Excel files.');
      }

      const result = await processContacts(contacts);
      
      let message = `Successfully added ${result.valid} contact(s)`;
      if (result.invalid > 0) message += ` (${result.invalid} invalid)`;
      if (result.empty > 0) message += ` (${result.empty} empty)`;
      if (result.duplicates > 0) message += ` (${result.duplicates} duplicates skipped)`;
      
      toast.success(message);

      // Show warnings for any errors
      result.errors.forEach(error => {
        toast.warning(error);
      });

      onUploadComplete();
    } catch (error: any) {
      console.error('Error uploading contacts:', error);
      const errorMessage = error.message || 'Error uploading contacts';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const toggleTag = (tagId: string) => {
    const newSelectedTags = new Set(selectedTags);
    if (newSelectedTags.has(tagId)) {
      newSelectedTags.delete(tagId);
    } else {
      newSelectedTags.add(tagId);
    }
    setSelectedTags(newSelectedTags);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 h-[250px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Upload Contacts</h2>
        <div className="relative">
          <button
            onClick={() => setShowTagsMenu(!showTagsMenu)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <TagIcon className="h-4 w-4 mr-1.5" />
            Tags
            <ChevronDown className="h-4 w-4 ml-1" />
          </button>

          {showTagsMenu && (
            <>
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setShowTagsMenu(false)}
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
                        onClick={() => toggleTag(tag.id)}
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
      </div>

      <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center px-4 py-3">
          <FileSpreadsheet className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <div className="space-y-2">
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <div>
              <span className="text-sm text-gray-500">
                Upload your contacts file (CSV or Excel)
              </span>
            </div>
            {error && (
              <div className="flex items-center justify-center text-red-500 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </div>
            )}
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
          </div>
        </div>
      </div>
    </div>
  );
}