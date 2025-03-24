import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X, Smile } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface CollapsibleMessageProps {
  message: string;
  isEditing: boolean;
  onEdit: (newMessage: string) => void;
  onCancel: () => void;
}

export default function CollapsibleMessage({ message, isEditing, onEdit, onCancel }: CollapsibleMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const shouldCollapse = message.length > 100;

  const onEmojiClick = (emojiData: EmojiClickData) => {
    const cursor = (document.activeElement as HTMLTextAreaElement)?.selectionStart || editedMessage.length;
    const newMessage = 
      editedMessage.slice(0, cursor) + 
      emojiData.emoji + 
      editedMessage.slice(cursor);
    setEditedMessage(newMessage);
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="relative">
          <textarea
            value={editedMessage}
            onChange={(e) => setEditedMessage(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            rows={4}
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-2 bottom-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <Smile className="h-5 w-5" />
          </button>
          {showEmojiPicker && (
            <div className="absolute right-0 bottom-12 z-10">
              <div className="relative">
                <button
                  className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-lg text-gray-400 hover:text-gray-600"
                  onClick={() => setShowEmojiPicker(false)}
                >
                  <X className="h-4 w-4" />
                </button>
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  autoFocusSearch={false}
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(editedMessage)}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={() => {
              setEditedMessage(message);
              setShowEmojiPicker(false);
              onCancel();
            }}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (!shouldCollapse) {
    return <div className="text-sm text-gray-900 whitespace-pre-wrap">{message}</div>;
  }

  const preview = isExpanded ? message : message.slice(0, 100);

  return (
    <div className="space-y-1">
      <div className="text-sm text-gray-900 whitespace-pre-wrap">
        {preview}
        {!isExpanded && message.length > 100 && '...'}
      </div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
      >
        {isExpanded ? (
          <>
            Show less <ChevronUp className="h-3 w-3 ml-1" />
          </>
        ) : (
          <>
            Show more <ChevronDown className="h-3 w-3 ml-1" />
          </>
        )}
      </button>
    </div>
  );
}