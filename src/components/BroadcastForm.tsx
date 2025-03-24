import React, { useState, useEffect } from 'react';
import { Send, Image as ImageIcon, Smile, X, Users, Tag as TagIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface Tag {
  id: string;
  name: string;
  color: string;
  contact_count: number;
}

interface Contact {
  id: string;
  phone_number: string;
  is_active: boolean;
}

interface BroadcastFormProps {
  contacts: Array<Contact>;
  onBroadcastCreated: () => void;
}

const BATCH_SIZE = 500;

export default function BroadcastForm({ contacts, onBroadcastCreated }: BroadcastFormProps) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<'all' | 'tags'>('all');

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      // Get tags with contact counts using a subquery
      const { data, error } = await supabase
        .from('tags')
        .select(`
          id,
          name,
          color,
          contact_count:contact_tags(count)
        `)
        .order('name');

      if (error) throw error;

      // Transform the data to include contact count
      const tagsWithCounts = data.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        contact_count: tag.contact_count[0]?.count || 0
      }));

      setTags(tagsWithCounts);
    } catch (error: any) {
      console.error('Error loading tags:', error);
      toast.error('Error loading tags');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setImage(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
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

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${Date.now()}_${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('broadcast-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('broadcast-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const getFilteredContacts = async (): Promise<Contact[]> => {
    // Start with active contacts
    let filteredContacts = contacts.filter(contact => contact.is_active);

    if (filterMode === 'tags' && selectedTags.size > 0) {
      // Get contacts that have ALL selected tags with pagination
      let allContactTags: any[] = [];
      let page = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data: contactTags, error } = await supabase
          .from('contact_tags')
          .select('contact_id, tag_id')
          .in('tag_id', Array.from(selectedTags))
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        
        if (!contactTags || contactTags.length === 0) break;
        
        allContactTags = [...allContactTags, ...contactTags];
        
        if (contactTags.length < pageSize) break;
        
        page++;
      }

      // Group contacts by their ID and count their tags
      const contactTagCounts = new Map<string, number>();
      allContactTags.forEach(ct => {
        contactTagCounts.set(ct.contact_id, (contactTagCounts.get(ct.contact_id) || 0) + 1);
      });

      // Only keep contacts that have all selected tags
      filteredContacts = filteredContacts.filter(contact => 
        contactTagCounts.get(contact.id) === selectedTags.size
      );
    }

    return filteredContacts;
  };

  const createBroadcastBatch = async (messageId: string, contacts: Array<Contact>) => {
    const broadcasts = contacts.map(contact => ({
      message_id: messageId,
      contact_id: contact.id,
      status: 'pending'
    }));

    const { error } = await supabase
      .from('broadcasts')
      .insert(broadcasts);

    if (error) throw error;
  };

  const createBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Get filtered contacts
      const targetContacts = await getFilteredContacts();
      
      if (targetContacts.length === 0) {
        toast.error(filterMode === 'all' 
          ? 'No active contacts available'
          : 'No contacts found with the selected tags'
        );
        return;
      }

      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }

      // Create message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert([{ 
          name: name || 'Untitled Broadcast',
          message,
          image_url: imageUrl,
          user_id: user.id,
          status: 'active'
        }])
        .select()
        .single();

      if (messageError) throw messageError;

      // Create broadcasts in batches
      const totalBatches = Math.ceil(targetContacts.length / BATCH_SIZE);
      for (let i = 0; i < totalBatches; i++) {
        const start = i * BATCH_SIZE;
        const end = start + BATCH_SIZE;
        const batch = targetContacts.slice(start, end);
        await createBroadcastBatch(messageData.id, batch);
        
        // Update progress
        const progress = Math.round(((i + 1) / totalBatches) * 100);
        toast.success(`Processing: ${progress}%`, { id: 'broadcast-progress' });
      }

      setName('');
      setMessage('');
      setImage(null);
      setImagePreview(null);
      setShowEmojiPicker(false);
      setSelectedTags(new Set());
      setFilterMode('all');
      toast.success('Broadcast created successfully');
      onBroadcastCreated();
    } catch (error: any) {
      console.error('Error creating broadcast:', error);
      toast.error(error.message || 'Error creating broadcast');
    } finally {
      setUploading(false);
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

  // Filter active contacts based on selected tags
  const getContactCount = async () => {
    try {
      const filteredContacts = await getFilteredContacts();
      return filteredContacts.length;
    } catch (error) {
      console.error('Error counting contacts:', error);
      return 0;
    }
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
      <form onSubmit={createBroadcast} className="space-y-4">
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
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="all"
                  checked={filterMode === 'all'}
                  onChange={(e) => setFilterMode(e.target.value as 'all' | 'tags')}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2">All active contacts</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="tags"
                  checked={filterMode === 'tags'}
                  onChange={(e) => setFilterMode(e.target.value as 'all' | 'tags')}
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
                    onClick={() => toggleTag(tag.id)}
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <div className="relative">
            <textarea
              id="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image (optional)
          </label>
          <div className="space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
            >
              <ImageIcon className="h-5 w-5 mr-2" />
              Choose Image
            </label>
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-xs rounded-lg shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                  }}
                  className="mt-2 text-sm text-red-600 hover:text-red-500"
                >
                  Remove image
                </button>
              </div>
            )}
          </div>
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