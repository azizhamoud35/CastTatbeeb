import React from 'react';
import { Pause, Play, Trash2, Pencil } from 'lucide-react';
import CollapsibleMessage from './CollapsibleMessage';
import ProgressBadges from './ProgressBadges';
import StatusBadge from './StatusBadge';
import type { BroadcastViewProps } from './types';

export default function DesktopView({
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
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {broadcast.name}
                  </div>
                  <button
                    onClick={() => onStartEditing(broadcast, 'name')}
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
                  onEdit={(newMessage) => onUpdateBroadcast(broadcast.id, { message: newMessage })}
                  onCancel={onCancelEditing}
                />
                {editingId !== broadcast.id && (
                  <button
                    onClick={() => onStartEditing(broadcast, 'message')}
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
              <ProgressBadges counts={broadcast._count} />
            </td>
            <td className="px-6 py-4">
              <StatusBadge status={broadcast.status} />
            </td>
            <td className="px-6 py-4">
              <div className="flex space-x-2">
                {broadcast.status !== 'finished' && (
                  <button
                    onClick={() => onToggleStatus(broadcast)}
                    className={`p-2 rounded-full hover:bg-gray-100 ${
                      broadcast.status === 'active' ? 'text-orange-600' : 'text-purple-600'
                    }`}
                    title={broadcast.status === 'active' ? 'Pause broadcast' : 'Resume broadcast'}
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
  );
}