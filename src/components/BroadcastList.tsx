import React, { useState } from 'react';
import { Pause, Play, Trash2, ChevronDown, ChevronUp, Pencil, Check, X, Smile } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Broadcast {
  id: string;
  name: string;
  message: string;
  image_url?: string;
  created_at: string;
  status: 'active' | 'paused' | 'finished';
  _count: {
    pending: number;
    sent: number;
    failed: number;
  };
}

interface BroadcastListProps {
  broadcasts: Broadcast[];
  onBroadcastUpdated: () => void;
}

interface CollapsibleMessageProps {
  message: string;
  isEditing: boolean;
  onEdit: (newMessage: string) => void;
  onCancel: () => void;
}

function CollapsibleMessage({ message, isEditing, onEdit, onCancel }: CollapsibleMessageProps) {
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
            <Check className="h-3 w-3 mr-1" />
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
            <X className="h-3 w-3 mr-1" />
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

export default function BroadcastList({ broadcasts, onBroadcastUpdated }: BroadcastListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'name' | 'message' | null>(null);
  const [editingName, setEditingName] = useState('');

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

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="hidden md:block"> {/* Desktop view */}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Message
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {broadcasts.map((broadcast) => (
              <tr key={broadcast.id}>
                <td className="px-6 py-4">
                  {editingId === broadcast.id && editingField === 'name' ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateBroadcast(broadcast.id, { name: editingName })}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {broadcast.name}
                      </div>
                      <button
                        onClick={() => startEditing(broadcast, 'name')}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-2xl">
                    <CollapsibleMessage
                      message={broadcast.message}
                      isEditing={editingId === broadcast.id && editingField === 'message'}
                      onEdit={(newMessage) => updateBroadcast(broadcast.id, { message: newMessage })}
                      onCancel={cancelEditing}
                    />
                    {editingId !== broadcast.id && (
                      <button
                        onClick={() => startEditing(broadcast, 'message')}
                        className="mt-1 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {broadcast.image_url && (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={broadcast.image_url}
                        alt="Message image"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col space-y-2">
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded flex items-center justify-between">
                      <span>Pending</span>
                      <span className="font-bold">{broadcast._count.pending}</span>
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded flex items-center justify-between">
                      <span>Sent</span>
                      <span className="font-bold">{broadcast._count.sent}</span>
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded flex items-center justify-between">
                      <span>Failed</span>
                      <span className="font-bold">{broadcast._count.failed}</span>
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    broadcast.status === 'active' 
                      ? 'bg-purple-100 text-purple-800'
                      : broadcast.status === 'paused'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {broadcast.status.charAt(0).toUpperCase() + broadcast.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    {broadcast.status !== 'finished' && (
                      <button
                        onClick={() => toggleBroadcastStatus(broadcast)}
                        className={`p-2 rounded-full hover:bg-gray-100 ${
                          broadcast.status === 'active' ? 'text-orange-600' : 'text-purple-600'
                        }`}
                        title={broadcast.status === 'active' ? 'Pause broadcast' : 'Resume broadcast'}
                      >
                        {broadcast.status === 'active' ? (
                          <Pause className="h-5 w-5 text-orange-600" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => deleteBroadcast(broadcast)}
                      className="p-2 rounded-full hover:bg-gray-100 text-red-600"
                      title="Delete broadcast"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view */}
      <div className="md:hidden divide-y divide-gray-200">
        {broadcasts.map((broadcast) => (
          <div key={broadcast.id} className="p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1">
                {editingId === broadcast.id && editingField === 'name' ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateBroadcast(broadcast.id, { name: editingName })}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium text-gray-900">{broadcast.name}</h3>
                    <button
                      onClick={() => startEditing(broadcast, 'name')}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                  broadcast.status === 'active' 
                    ? 'bg-purple-100 text-purple-800'
                    : broadcast.status === 'paused'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {broadcast.status.charAt(0).toUpperCase() + broadcast.status.slice(1)}
                </span>
                <div className="text-xs text-gray-500">
                  {format(new Date(broadcast.created_at), 'MMM d, yyyy HH:mm')}
                </div>
              </div>
              <div className="flex space-x-2">
                {broadcast.status !== 'finished' && (
                  <button
                    onClick={() => toggleBroadcastStatus(broadcast)}
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      broadcast.status === 'active' ? 'text-orange-600' : 'text-purple-600'
                    }`}
                  >
                    {broadcast.status === 'active' ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => deleteBroadcast(broadcast)}
                  className="p-2 rounded-full hover:bg-gray-100 text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Message</div>
              <CollapsibleMessage
                message={broadcast.message}
                isEditing={editingId === broadcast.id && editingField === 'message'}
                onEdit={(newMessage) => updateBroadcast(broadcast.id, { message: newMessage })}
                onCancel={cancelEditing}
              />
              {editingId !== broadcast.id && (
                <button
                  onClick={() => startEditing(broadcast, 'message')}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>

            {broadcast.image_url && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Image</div>
                <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={broadcast.image_url}
                    alt="Message image"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Progress</div>
              <div className="flex flex-col space-y-2">
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded flex items-center justify-between">
                  <span>Pending</span>
                  <span className="font-bold">{broadcast._count.pending}</span>
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded flex items-center justify-between">
                  <span>Sent</span>
                  <span className="font-bold">{broadcast._count.sent}</span>
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded flex items-center justify-between">
                  <span>Failed</span>
                  <span className="font-bold">{broadcast._count.failed}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}