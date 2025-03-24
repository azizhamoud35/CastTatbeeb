import React from 'react';
import DesktopView from './DesktopView';
import MobileView from './MobileView';
import { useBroadcastActions } from './useBroadcastActions';
import type { Broadcast } from './types';

interface BroadcastListProps {
  broadcasts: Broadcast[];
  onBroadcastUpdated: () => void;
}

export default function BroadcastList({ broadcasts, onBroadcastUpdated }: BroadcastListProps) {
  const {
    editingId,
    editingField,
    editingName,
    startEditing,
    cancelEditing,
    updateBroadcast,
    toggleBroadcastStatus,
    deleteBroadcast
  } = useBroadcastActions(onBroadcastUpdated);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Desktop view */}
      <div className="hidden md:block">
        <DesktopView
          broadcasts={broadcasts}
          editingId={editingId}
          editingField={editingField}
          editingName={editingName}
          onStartEditing={startEditing}
          onCancelEditing={cancelEditing}
          onUpdateBroadcast={updateBroadcast}
          onToggleStatus={toggleBroadcastStatus}
          onDelete={deleteBroadcast}
        />
      </div>

      {/* Mobile view */}
      <div className="md:hidden">
        <MobileView
          broadcasts={broadcasts}
          editingId={editingId}
          editingField={editingField}
          editingName={editingName}
          onStartEditing={startEditing}
          onCancelEditing={cancelEditing}
          onUpdateBroadcast={updateBroadcast}
          onToggleStatus={toggleBroadcastStatus}
          onDelete={deleteBroadcast}
        />
      </div>
    </div>
  );
}

export type { Broadcast };