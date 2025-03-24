import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import ContactUpload from '../components/ContactUpload';
import { validateSaudiNumber, formatPhoneNumber } from '../utils/phoneValidation';
import ConfirmationModal from '../components/ConfirmationModal';
import TagsModal from '../components/TagsModal';
import AddContactForm from '../components/AddContactForm';
import ContactTable from '../components/ContactTable';
import ContactToolbar from '../components/ContactToolbar';

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
  created_at: string;
  tags: Tag[];
}

interface DuplicateCount {
  phone_number: string;
  count: number;
}

type SortField = 'phone_number' | 'created_at' | 'is_active';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [removingDuplicates, setRemovingDuplicates] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState<{
    totalDuplicates: number;
    phoneNumbers: number;
  } | null>(null);
  const [sort, setSort] = useState<SortConfig>({ field: 'created_at', direction: 'desc' });
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [includedTags, setIncludedTags] = useState<Set<string>>(new Set());
  const [excludedTags, setExcludedTags] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    loadContacts();
    loadTags();
  }, []);

  useEffect(() => {
    // Reset to first page when filters change
    setPage(1);
  }, [searchQuery, statusFilter, includedTags, excludedTags]);

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

  const loadContacts = async () => {
    try {
      let allContacts: Contact[] = [];
      let page = 0;
      const pageSize = 1000;
      
      while (true) {
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select(`
            *,
            contact_tags!contact_tags_contact_id_fkey (
              tags (
                id,
                name,
                color
              )
            )
          `)
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order('created_at', { ascending: false });

        if (contactsError) throw contactsError;
        
        if (!contactsData || contactsData.length === 0) break;

        const contactsWithTags = contactsData.map((contact: any) => ({
          ...contact,
          tags: contact.contact_tags
            .map((ct: any) => ct.tags)
            .filter((tag: Tag | null): tag is Tag => tag !== null)
        }));

        allContacts = [...allContacts, ...contactsWithTags];
        
        if (contactsData.length < pageSize) break;
        
        page++;
      }

      setContacts(allContacts);
      setSelectedContacts(new Set());
    } catch (error: any) {
      console.error('Error loading contacts:', error);
      toast.error('Error loading contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortedContacts = (contacts: Contact[]) => {
    return [...contacts].sort((a, b) => {
      const direction = sort.direction === 'asc' ? 1 : -1;
      
      switch (sort.field) {
        case 'phone_number':
          return a.phone_number.localeCompare(b.phone_number) * direction;
        case 'created_at':
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * direction;
        case 'is_active':
          return (Number(a.is_active) - Number(b.is_active)) * direction;
        default:
          return 0;
      }
    });
  };

  const getFilteredContacts = (contacts: Contact[]) => {
    return contacts.filter(contact => {
      // Search filter
      const matchesSearch = contact.phone_number.includes(searchQuery.replace(/[^0-9]/g, ''));
      
      // Status filter
      const matchesStatus = statusFilter === 'all' 
        ? true 
        : statusFilter === 'active' 
          ? contact.is_active 
          : !contact.is_active;

      // Tag filters
      let matchesTags = true;
      
      if (includedTags.size > 0) {
        const contactTagIds = new Set(contact.tags.map(tag => tag.id));
        // Contact must have ALL of the included tags
        matchesTags = Array.from(includedTags).every(tagId => contactTagIds.has(tagId));
      }

      // Excluded tags - contact must not have ANY excluded tags
      if (excludedTags.size > 0) {
        const contactTagIds = new Set(contact.tags.map(tag => tag.id));
        const hasExcludedTag = Array.from(excludedTags).some(tagId => contactTagIds.has(tagId));
        if (hasExcludedTag) {
          matchesTags = false;
        }
      }

      return matchesSearch && matchesStatus && matchesTags;
    });
  };

  const handleTagInclude = (tagId: string) => {
    const newIncludedTags = new Set(includedTags);
    const newExcludedTags = new Set(excludedTags);
    
    newExcludedTags.delete(tagId);
    
    if (newIncludedTags.has(tagId)) {
      newIncludedTags.delete(tagId);
    } else {
      newIncludedTags.add(tagId);
    }
    
    setIncludedTags(newIncludedTags);
    setExcludedTags(newExcludedTags);
  };

  const handleTagExclude = (tagId: string) => {
    const newIncludedTags = new Set(includedTags);
    const newExcludedTags = new Set(excludedTags);
    
    newIncludedTags.delete(tagId);
    
    if (newExcludedTags.has(tagId)) {
      newExcludedTags.delete(tagId);
    } else {
      newExcludedTags.add(tagId);
    }
    
    setIncludedTags(newIncludedTags);
    setExcludedTags(newExcludedTags);
  };

  const filteredContacts = getFilteredContacts(contacts);
  const sortedContacts = getSortedContacts(filteredContacts);
  const paginatedContacts = sortedContacts.slice((page - 1) * pageSize, page * pageSize);

  const toggleSelectAll = () => {
    if (selectedContacts.size === paginatedContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(paginatedContacts.map(c => c.id)));
    }
  };

  const toggleSelectContact = (id: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedContacts(newSelected);
  };

  const toggleActive = async (contact: Contact) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ is_active: !contact.is_active })
        .eq('id', contact.id);

      if (error) throw error;
      
      loadContacts();
      toast.success('Contact status updated');
    } catch (error: any) {
      toast.error('Error updating contact');
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      loadContacts();
      toast.success('Contact deleted');
    } catch (error: any) {
      toast.error('Error deleting contact');
    }
  };

  const deleteSelectedContacts = async () => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .in('id', Array.from(selectedContacts));

      if (error) throw error;
      
      setSelectedContacts(new Set());
      loadContacts();
      toast.success(`${selectedContacts.size} contacts deleted`);
      setShowDeleteConfirmation(false);
    } catch (error: any) {
      toast.error('Error deleting contacts');
    }
  };

  const toggleBulkActive = async (active: boolean) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ is_active: active })
        .in('id', Array.from(selectedContacts));

      if (error) throw error;
      
      loadContacts();
      toast.success(`${selectedContacts.size} contacts ${active ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error('Error updating contacts');
    }
  };

  const checkDuplicates = async () => {
    try {
      const { data: duplicatesData, error: findError } = await supabase
        .rpc('get_duplicate_contacts');

      if (findError) throw findError;

      const duplicates = duplicatesData as DuplicateCount[] | null;

      if (!duplicates || duplicates.length === 0) {
        toast.success('No duplicate contacts found');
        return;
      }

      const totalDuplicates = duplicates.reduce((sum, dup) => sum + Number(dup.count) - 1, 0);

      setConfirmationDetails({
        totalDuplicates,
        phoneNumbers: duplicates.length
      });
      setShowConfirmation(true);
    } catch (error: any) {
      console.error('Error checking duplicates:', error);
      toast.error('Error checking duplicates');
    }
  };

  const removeDuplicates = async () => {
    try {
      setRemovingDuplicates(true);
      setShowConfirmation(false);

      const { error: deleteError } = await supabase
        .rpc('remove_duplicate_contacts');

      if (deleteError) throw deleteError;

      const totalDuplicates = confirmationDetails?.totalDuplicates || 0;
      toast.success(`Successfully removed ${totalDuplicates} duplicate contact${totalDuplicates !== 1 ? 's' : ''}`);
      await loadContacts();
    } catch (error: any) {
      console.error('Error removing duplicates:', error);
      toast.error('Error removing duplicates');
    } finally {
      setRemovingDuplicates(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AddContactForm onContactAdded={loadContacts} />
        <ContactUpload onUploadComplete={loadContacts} />
      </div>

      <div className="bg-white shadow rounded-lg">
        <ContactToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          selectedCount={selectedContacts.size}
          onShowTags={() => setShowTagsModal(true)}
          onActivate={() => toggleBulkActive(true)}
          onDeactivate={() => toggleBulkActive(false)}
          onDelete={() => setShowDeleteConfirmation(true)}
          onCheckDuplicates={checkDuplicates}
          removingDuplicates={removingDuplicates}
          tags={tags}
          includedTags={includedTags}
          excludedTags={excludedTags}
          onTagInclude={handleTagInclude}
          onTagExclude={handleTagExclude}
          filteredContactsCount={filteredContacts.length}
          totalContactsCount={contacts.length}
        />

        <ContactTable
          contacts={paginatedContacts}
          selectedContacts={selectedContacts}
          sort={sort}
          onSort={handleSort}
          onToggleSelectAll={toggleSelectAll}
          onToggleSelectContact={toggleSelectContact}
          onToggleActive={toggleActive}
          onDeleteContact={deleteContact}
          page={page}
          pageSize={pageSize}
          totalContacts={filteredContacts.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Confirmation Modal for Duplicates */}
      <ConfirmationModal
        isOpen={showConfirmation}
        title="Deduplicate Contacts"
        message={confirmationDetails ? 
          `Found ${confirmationDetails.totalDuplicates} duplicate contact${
            confirmationDetails.totalDuplicates !== 1 ? 's' : ''
          } across ${confirmationDetails.phoneNumbers} phone number${
            confirmationDetails.phoneNumbers !== 1 ? 's' : ''
          }.\n\nThis will keep only the most recently added contact for each phone number while preserving broadcast history.\n\nDo you want to continue?` : 
          ''}
        confirmLabel={removingDuplicates ? 'Removing...' : 'Deduplicate'}
        onConfirm={removeDuplicates}
        onCancel={() => setShowConfirmation(false)}
      />

      {/* Confirmation Modal for Bulk Delete */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        title="Delete Selected Contacts"
        message={`Are you sure you want to delete ${selectedContacts.size} selected contact${
          selectedContacts.size !== 1 ? 's' : ''
        }? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={deleteSelectedContacts}
        onCancel={() => setShowDeleteConfirmation(false)}
      />

      {/* Tags Modal */}
      <TagsModal
        isOpen={showTagsModal}
        onClose={() => setShowTagsModal(false)}
        selectedContactIds={Array.from(selectedContacts)}
        onTagsUpdated={() => {
          loadContacts();
          loadTags();
        }}
      />
    </div>
  );
}