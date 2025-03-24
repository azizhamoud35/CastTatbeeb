import React from 'react';
import { Send, Users } from 'lucide-react';
import { useBroadcastForm } from './useBroadcastForm';
import ImageUpload from './ImageUpload';
import MessageInput from './MessageInput';
import RecipientSelector from './RecipientSelector';
import type { BroadcastFormProps } from './types';

export default function BroadcastForm({ contacts, onBroadcastCreated }: BroadcastFormProps) {
  const {
    name,
    setName,
    message,
    setMessage,
    image,
    imagePreview,
    uploading,
    tags,
    selectedTags,
    filterMode,
    setFilterMode,
    handleImageChange,
    handleSubmit,
    toggleTag,
    onImageRemove
  } = useBroadcastForm(contacts, onBroadcastCreated);

  const onEmojiClick = (emojiData: any) => {
    const textarea = document.getElementById('message-input') as HTMLTextAreaElement;
    const cursor = textarea.selectionStart || message.length;
    const newMessage = 
      message.slice(0, cursor) + 
      emojiData.emoji + 
      message.slice(cursor);
    setMessage(newMessage);
    
    setTimeout(() => {
      textarea.focus();
      const newCursor = cursor + emojiData.emoji.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Create New Broadcast</h2>
        <div className="flex items-center space-x-2 text-sm">
          <Users className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-900">{contacts.filter(c => c.is_active).length}</span>
          <span className="text-gray-500">active contacts</span>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Broadcast Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter broadcast name"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipients
          </label>
          <RecipientSelector
            filterMode={filterMode}
            onFilterModeChange={setFilterMode}
            tags={tags}
            selectedTags={selectedTags}
            onTagToggle={toggleTag}
            activeContactsCount={contacts.filter(c => c.is_active).length}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <MessageInput
            message={message}
            onMessageChange={setMessage}
            onEmojiClick={onEmojiClick}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image (optional)
          </label>
          <ImageUpload
            image={image}
            imagePreview={imagePreview}
            onImageChange={handleImageChange}
            onImageRemove={onImageRemove}
          />
        </div>

        <button
          type="submit"
          disabled={uploading || (filterMode === 'tags' && selectedTags.size === 0)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Send className="h-5 w-5 mr-2" />
          {uploading ? 'Creating...' : 'Create Broadcast'}
        </button>
      </form>
    </div>
  );
}