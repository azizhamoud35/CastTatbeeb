import { EmojiClickData } from 'emoji-picker-react';

export interface Tag {
  id: string;
  name: string;
  color: string;
  contact_count: number;
}

export interface Contact {
  id: string;
  phone_number: string;
  is_active: boolean;
}

export interface BroadcastFormProps {
  contacts: Array<Contact>;
  onBroadcastCreated: () => void;
}

export interface ImageUploadProps {
  image: File | null;
  imagePreview: string | null;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
}

export interface MessageInputProps {
  message: string;
  onMessageChange: (value: string) => void;
  onEmojiClick: (emojiData: EmojiClickData) => void;
}

export interface RecipientSelectorProps {
  filterMode: 'all' | 'tags';
  onFilterModeChange: (mode: 'all' | 'tags') => void;
  tags: Tag[];
  selectedTags: Set<string>;
  onTagToggle: (tagId: string) => void;
  activeContactsCount: number;
}