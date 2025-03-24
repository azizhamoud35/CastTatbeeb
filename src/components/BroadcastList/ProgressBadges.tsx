import React from 'react';

interface ProgressBadgesProps {
  counts: {
    pending: number;
    sent: number;
    failed: number;
  };
}

export default function ProgressBadges({ counts }: ProgressBadgesProps) {
  return (
    <div className="flex flex-col space-y-2">
      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded flex items-center justify-between">
        <span>Pending</span>
        <span className="font-bold">{counts.pending}</span>
      </span>
      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded flex items-center justify-between">
        <span>Sent</span>
        <span className="font-bold">{counts.sent}</span>
      </span>
      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded flex items-center justify-between">
        <span>Failed</span>
        <span className="font-bold">{counts.failed}</span>
      </span>
    </div>
  );
}