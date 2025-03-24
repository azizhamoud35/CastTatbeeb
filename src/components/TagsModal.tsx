import React, { useState, useEffect } from 'react';
import { X, Plus, Tag as TagIcon, Trash2, Pencil, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import ConfirmationModal from './ConfirmationModal';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedContactIds: string[];
  onTagsUpdated: () => void;
}

export default function TagsModal({ isOpen, onClose, selectedContactIds, onTagsUpdated }: TagsModalProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [loading, setLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTags();
      loadSelectedTags();
    }
  }, [isOpen, selectedContactIds]);

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
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedTags = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_tags')
        .select('tag_id')
        .in('contact_id', selectedContactIds);

      if (error) throw error;
      
      // Find tags that are common to all selected contacts
      const tagCounts = new Map<string, number>();
      data.forEach(({ tag_id }) => {
        tagCounts.set(tag_id, (tagCounts.get(tag_id) || 0) + 1);
      });

      const commonTags = new Set<string>();
      tagCounts.forEach((count, tagId) => {
        if (count === selectedContactIds.length) {
          commonTags.add(tagId);
        }
      });

      setSelectedTags(commonTags);
    } catch (error: any) {
      console.error('Error loading selected tags:', error);
      toast.error('Error loading selected tags');
    }
  };

  const createTag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTagName.trim()) {
      toast.error('Please enter a tag name');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tags')
        .insert([{ name: newTagName.trim(), color: newTagColor }])
        .select()
        .single();

      if (error) throw error;

      setTags([...tags, data]);
      setNewTagName('');
      setNewTagColor('#3B82F6');
      toast.success('Tag created successfully');
    } catch (error: any) {
      console.error('Error creating tag:', error);
      toast.error(error.message === '23505' ? 'Tag name already exists' : 'Error creating tag');
    }
  };

  const startEditing = (tag: Tag) => {
    setEditingTag(tag);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const cancelEditing = () => {
    setEditingTag(null);
    setEditName('');
    setEditColor('');
  };

  const updateTag = async (tag: Tag) => {
    if (!editName.trim()) {
      toast.error('Please enter a tag name');
      return;
    }

    try {
      const { error } = await supabase
        .from('tags')
        .update({ name: editName.trim(), color: editColor })
        .eq('id', tag.id);

      if (error) throw error;

      setTags(tags.map(t => t.id === tag.id ? { ...t, name: editName.trim(), color: editColor } : t));
      cancelEditing();
      toast.success('Tag updated successfully');
      onTagsUpdated();
    } catch (error: any) {
      console.error('Error updating tag:', error);
      toast.error(error.message === '23505' ? 'Tag name already exists' : 'Error updating tag');
    }
  };

  const confirmDelete = (tag: Tag) => {
    setTagToDelete(tag);
    setShowDeleteConfirmation(true);
  };

  const deleteTag = async () => {
    if (!tagToDelete) return;

    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagToDelete.id);

      if (error) throw error;

      setTags(tags.filter(t => t.id !== tagToDelete.id));
      setShowDeleteConfirmation(false);
      setTagToDelete(null);
      toast.success('Tag deleted successfully');
      onTagsUpdated();
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      toast.error('Error deleting tag');
    }
  };

  const toggleTag = async (tagId: string) => {
    const isSelected = selectedTags.has(tagId);
    try {
      if (isSelected) {
        // Remove tag from all selected contacts
        const { error } = await supabase
          .from('contact_tags')
          .delete()
          .in('contact_id', selectedContactIds)
          .eq('tag_id', tagId);

        if (error) throw error;
      } else {
        // Add tag to all selected contacts
        const contactTags = selectedContactIds.map(contactId => ({
          contact_id: contactId,
          tag_id: tagId
        }));

        const { error } = await supabase
          .from('contact_tags')
          .upsert(contactTags);

        if (error) throw error;
      }

      // Update local state
      const newSelectedTags = new Set(selectedTags);
      if (isSelected) {
        newSelectedTags.delete(tagId);
      } else {
        newSelectedTags.add(tagId);
      }
      setSelectedTags(newSelectedTags);
      
      onTagsUpdated();
      toast.success(`Tag ${isSelected ? 'removed from' : 'added to'} selected contacts`);
    } catch (error: any) {
      console.error('Error toggling tag:', error);
      toast.error('Error updating tags');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Tags
              </h3>
              
              <div className="mt-4">
                <form onSubmit={createTag} className="flex items-center space-x-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="sr-only"
                      id="new-tag-color"
                    />
                    <label
                      htmlFor="new-tag-color"
                      className="block w-8 h-8 rounded-full cursor-pointer border-2 border-gray-200 hover:border-gray-300 transition-colors"
                      style={{ backgroundColor: newTagColor }}
                    />
                  </div>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="New tag name"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </form>
              </div>

              <div className="mt-4">
                <div className="space-y-2">
                  {loading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : tags.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No tags created yet</div>
                  ) : (
                    tags.map((tag) => (
                      <div
                        key={tag.id}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-md transition-colors ${
                          selectedTags.has(tag.id)
                            ? 'bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {editingTag?.id === tag.id ? (
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="relative">
                              <input
                                type="color"
                                value={editColor}
                                onChange={(e) => setEditColor(e.target.value)}
                                className="sr-only"
                                id={`edit-color-${tag.id}`}
                              />
                              <label
                                htmlFor={`edit-color-${tag.id}`}
                                className="block w-6 h-6 rounded-full cursor-pointer border-2 border-gray-200 hover:border-gray-300 transition-colors"
                                style={{ backgroundColor: editColor }}
                              />
                            </div>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                            <button
                              onClick={() => updateTag(tag)}
                              className="p-1 text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1 text-gray-400 hover:text-gray-500"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => toggleTag(tag.id)}
                              className="flex items-center space-x-2 flex-1 text-left"
                            >
                              <TagIcon 
                                className="h-4 w-4" 
                                style={{ color: tag.color }} 
                              />
                              <span>{tag.name}</span>
                            </button>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => startEditing(tag)}
                                className="p-1 text-gray-400 hover:text-gray-500"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => confirmDelete(tag)}
                                className="p-1 text-red-400 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        title="Delete Tag"
        message={`Are you sure you want to delete the tag "${tagToDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={deleteTag}
        onCancel={() => {
          setShowDeleteConfirmation(false);
          setTagToDelete(null);
        }}
      />
    </div>
  );
}