import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import TagsMenu from './TagsMenu';
import FileUploader from './FileUploader';
import ErrorMessage from './ErrorMessage';
import { useContactUpload } from './useContactUpload';

interface ContactUploadProps {
  onUploadComplete: () => void;
}

export default function ContactUpload({ onUploadComplete }: ContactUploadProps) {
  const {
    uploading,
    error,
    tags,
    selectedTags,
    showTagsMenu,
    setShowTagsMenu,
    toggleTag,
    handleFileUpload
  } = useContactUpload(onUploadComplete);

  return (
    <div className="bg-white shadow rounded-lg p-6 h-[250px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Upload Contacts</h2>
        <TagsMenu
          tags={tags}
          selectedTags={selectedTags}
          showMenu={showTagsMenu}
          onToggleMenu={setShowTagsMenu}
          onToggleTag={toggleTag}
        />
      </div>

      <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center px-4 py-3">
          <FileSpreadsheet className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <div className="space-y-2">
            <FileUploader
              onFileSelect={handleFileUpload}
              uploading={uploading}
            />
            <ErrorMessage error={error} />
          </div>
        </div>
      </div>
    </div>
  );
}