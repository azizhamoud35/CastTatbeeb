import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import BroadcastForm from '../components/BroadcastForm';
import BroadcastList from '../components/BroadcastList';

interface Contact {
  id: string;
  phone_number: string;
  is_active: boolean;
}

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

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export default function Broadcasts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    const messagesChannel = supabase
      .channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => loadData()
      )
      .subscribe();

    const broadcastsChannel = supabase
      .channel('broadcasts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'broadcasts'
        },
        () => loadData()
      )
      .subscribe();

    const contactsChannel = supabase
      .channel('contacts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contacts'
        },
        () => loadData()
      )
      .subscribe();

    return () => {
      messagesChannel.unsubscribe();
      broadcastsChannel.unsubscribe();
      contactsChannel.unsubscribe();
    };
  }, []);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchWithRetry = async <T,>(
    operation: () => Promise<{ data: T | null; error: any; count?: number }>,
    retries = MAX_RETRIES
  ): Promise<{ data: T | null; count?: number }> => {
    try {
      const { data, error, count } = await operation();
      if (error) throw error;
      return { data, count };
    } catch (error) {
      if (retries > 0) {
        await delay(RETRY_DELAY);
        return fetchWithRetry(operation, retries - 1);
      }
      throw error;
    }
  };

  const loadData = async () => {
    try {
      // Load all contacts with pagination and retry logic
      let allContacts: Contact[] = [];
      let page = 0;
      const pageSize = 1000;
      
      while (true) {
        try {
          const { data: contactsPage } = await fetchWithRetry(() => 
            supabase
              .from('contacts')
              .select('*', { count: 'exact' })
              .eq('is_active', true)
              .range(page * pageSize, (page + 1) * pageSize - 1)
          );

          if (!contactsPage || contactsPage.length === 0) break;
          
          allContacts = [...allContacts, ...contactsPage];
          
          if (contactsPage.length < pageSize) break;
          
          page++;
        } catch (error) {
          console.error('Error loading contacts page:', error);
          break;
        }
      }

      setContacts(allContacts);

      // Get all messages
      const { data: messages } = await fetchWithRetry(() =>
        supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false })
      );

      if (!messages) {
        setBroadcasts([]);
        return;
      }

      // For each message, get the broadcast counts
      const processedBroadcasts = await Promise.all(
        messages.map(async (message) => {
          try {
            const [pendingResult, sentResult, failedResult] = await Promise.all([
              fetchWithRetry(() =>
                supabase
                  .from('broadcasts')
                  .select('*', { count: 'exact', head: true })
                  .eq('message_id', message.id)
                  .eq('status', 'pending')
              ),
              fetchWithRetry(() =>
                supabase
                  .from('broadcasts')
                  .select('*', { count: 'exact', head: true })
                  .eq('message_id', message.id)
                  .eq('status', 'sent')
              ),
              fetchWithRetry(() =>
                supabase
                  .from('broadcasts')
                  .select('*', { count: 'exact', head: true })
                  .eq('message_id', message.id)
                  .eq('status', 'failed')
              )
            ]);

            return {
              ...message,
              _count: {
                pending: pendingResult.count || 0,
                sent: sentResult.count || 0,
                failed: failedResult.count || 0,
              }
            };
          } catch (error) {
            console.error(`Error processing broadcast counts for message ${message.id}:`, error);
            return {
              ...message,
              _count: {
                pending: 0,
                sent: 0,
                failed: 0,
              }
            };
          }
        })
      );

      // Update the broadcasts state with the latest data
      setBroadcasts(processedBroadcasts);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Error loading data. Retrying...');
      // Retry the entire load operation after a delay
      await delay(RETRY_DELAY);
      loadData();
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcastUpdated = () => {
    // Immediately reload data when a broadcast is updated or deleted
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BroadcastForm contacts={contacts} onBroadcastCreated={handleBroadcastUpdated} />
      <BroadcastList broadcasts={broadcasts} onBroadcastUpdated={handleBroadcastUpdated} />
    </div>
  );
}