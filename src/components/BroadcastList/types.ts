export interface Broadcast {
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

export interface EditingState {
  editingId: string | null;
  editingField: 'name' | 'message' | null;
  editingName: string;
}

export interface BroadcastViewProps {
  broadcasts: Broadcast[];
  editingId: string | null;
  editingField: 'name' | 'message' | null;
  editingName: string;
  onStartEditing: (broadcast: Broadcast, field: 'name' | 'message') => void;
  onCancelEditing: () => void;
  onUpdateBroadcast: (broadcastId: string, updates: { name?: string; message?: string }) => void;
  onToggleStatus: (broadcast: Broadcast) => void;
  onDelete: (broadcast: Broadcast) => void;
}