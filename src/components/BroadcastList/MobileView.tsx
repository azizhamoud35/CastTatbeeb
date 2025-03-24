import React from 'react';
import { format } from 'date-fns';
import { Pause, Play, Trash2, Pencil } from 'lucide-react';
import CollapsibleMessage from './CollapsibleMessage';
import ProgressBadges from './ProgressBadges';
import StatusBadge from './StatusBadge';
import type { BroadcastViewProps } from './types';

export default function MobileView({
  broadcasts,
  editingId,
  editingField,
  editingName,
  onStartEditing,
  onCancelEditing,
  onUpdateBroadcast,
  onToggleStatus,
  onDelete
}: BroadcastViewProps) {
  return (
    <div className="divide-y divide-gray-200">
      {broadcasts.map((broadcast) => (
        <div key={broadcast.id} className="p-4 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1 flex-1">
              {editingId === broadcast.id && editingField === 'name' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => onUpdateBroadcast(broadcast.id, { name: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onUpdateBroadcast(broadcast.id, { name: editingName })}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={onCancelEditing}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-medium text-gray-900">{broadcast.name}</h3>
                  <button
                    onClick={() => onStartEditing(broadcast, 'name')}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
              )}
              <StatusBadge status={broadcast.status} />
              <div className="text-xs text-gray-500">
                {format(new Date(broadcast.created_at), 'MMM d, yyyy HH:mm')}
              </div>
            </div>
            <div className="flex space-x-2">
              {broadcast.status !== 'finished' && (
                <button
                  onClick={() => onToggleStatus(broadcast)}
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
                onClick={() => onDelete(broadcast)}
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
              onEdit={(newMessage) => onUpdateBroadcast(broadcast.id, { message: newMessage })}
              onCancel={onCancelEditing}
            />
            {editingId !== broadcast.id && (
              <button
                onClick={() => onStartEditing(broadcast, 'message')}
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
            <ProgressBadges counts={broadcast._count} />
          </div>
        </div>
      ))}
    </div>
  );
}