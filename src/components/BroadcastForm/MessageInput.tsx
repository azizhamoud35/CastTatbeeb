import React, { useState } from 'react';
import { Smile, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import type { MessageInputProps } from './types';

export default function MessageInput({ message, onMessageChange, onEmojiClick }: MessageInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  return (
    <div className="relative">
      <textarea
        id="message-input"
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        rows={4}
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        required
      />
      <button
        type="button"
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
      >
        <Smile className="h-5 w-5" />
      </button>
      {showEmojiPicker && (
        <div className="absolute right-0 top-12 z-10">
          <div className="relative">
            <button
              type="button"
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
  );
}