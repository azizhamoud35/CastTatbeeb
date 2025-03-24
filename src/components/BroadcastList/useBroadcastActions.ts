import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import type { Broadcast } from './types';

export function useBroadcastActions(onBroadcastUpdated: () => void) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'name' | 'message' | null>(null);
  const [editingName, setEditingName] = useState('');

  const startEditing = (broadcast: Broadcast, field: 'name' | 'message') => {
    setEditingId(broadcast.id);
    setEditingField(field);
    if (field === 'name') {
      setEditingName(broadcast.name);
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingField(null);
    setEditingName('');
  };

  const updateBroadcast = async (broadcastId: string, updates: { name?: string; message?: string }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('messages')
        .update(updates)
        .eq('id', broadcastId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Broadcast updated successfully');
      onBroadcastUpdated();
      cancelEditing();
    } catch (error: any) {
      console.error('Error updating broadcast:', error);
      toast.error('Error updating broadcast');
    }
  };

  const toggleBroadcastStatus = async (broadcast: Broadcast) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const newStatus = broadcast.status === 'active' ? 'paused' : 'active';
      
      const { error } = await supabase
        .from('messages')
        .update({ status: newStatus })
        .eq('id', broadcast.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(`Broadcast ${newStatus}`);
      onBroadcastUpdated();
    } catch (error: any) {
      console.error('Error updating broadcast status:', error);
      toast.error('Error updating broadcast status');
    }
  };

  const deleteBroadcast = async (broadcast: Broadcast) => {
    if (!window.confirm('Are you sure you want to delete this broadcast?')) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      if (broadcast.image_url) {
        const imagePath = broadcast.image_url.split('/').pop();
        if (imagePath) {
          const { error: storageError } = await supabase.storage
            .from('broadcast-images')
            .remove([imagePath]);
          
          if (storageError) {
            console.error('Error deleting image:', storageError);
          }
        }
      }

      const { error: broadcastsError } = await supabase
        .from('broadcasts')
        .delete()
        .eq('message_id', broadcast.id);

      if (broadcastsError) throw broadcastsError;

      const { error: messageError } = await supabase
        .from('messages')
        .delete()
        .eq('id', broadcast.id)
        .eq('user_id', user.id);

      if (messageError) throw messageError;

      toast.success('Broadcast deleted successfully');
      onBroadcastUpdated();
    } catch (error: any) {
      console.error('Error deleting broadcast:', error);
      toast.error('Error deleting broadcast');
    }
  };

  return {
    editingId,
    editingField,
    editingName,
    startEditing,
    cancelEditing,
    updateBroadcast,
    toggleBroadcastStatus,
    deleteBroadcast
  };
}