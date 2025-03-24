import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import type { Tag, Contact } from './types';

const BATCH_SIZE = 500;

export function useBroadcastForm(contacts: Contact[], onBroadcastCreated: () => void) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<'all' | 'tags'>('all');

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_tag_counts');

      if (error) throw error;
      setTags(data || []);
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
    let filteredContacts = contacts.filter(contact => contact.is_active);

    if (filterMode === 'tags' && selectedTags.size > 0) {
      const { data: contactTags, error } = await supabase
        .from('contact_tags')
        .select('contact_id, tag_id')
        .in('tag_id', Array.from(selectedTags));

      if (error) throw error;

      const contactTagCounts = new Map<string, number>();
      contactTags.forEach(ct => {
        contactTagCounts.set(ct.contact_id, (contactTagCounts.get(ct.contact_id) || 0) + 1);
      });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

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

      const totalBatches = Math.ceil(targetContacts.length / BATCH_SIZE);
      for (let i = 0; i < totalBatches; i++) {
        const start = i * BATCH_SIZE;
        const end = start + BATCH_SIZE;
        const batch = targetContacts.slice(start, end);
        await createBroadcastBatch(messageData.id, batch);
        
        const progress = Math.round(((i + 1) / totalBatches) * 100);
        toast.success(`Processing: ${progress}%`, { id: 'broadcast-progress' });
      }

      setName('');
      setMessage('');
      setImage(null);
      setImagePreview(null);
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

  return {
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
    onImageRemove: () => {
      setImage(null);
      setImagePreview(null);
    }
  };
}