import React from 'react';

const STATUS_CONFIG = {
  ready: { label: 'Operational / Calibrated', className: 'status-good' },
  busy: { label: 'In-Session / Reserved', className: 'status-warning' },
  hazard: { label: 'Maintenance / Alert', className: 'status-danger' },
  offline: { label: 'Offline', className: 'status-danger' }
};

export function StatusBadge({ status = 'ready', label, className = '' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.ready;
  const displayLabel = label || config.label;

  return (
    <span className={`equipment-status-pill ${config.className} ${className}`}>
      {displayLabel}
    </span>
  );
}

export default StatusBadge;
