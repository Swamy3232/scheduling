import React from 'react';

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-indigo-100 text-indigo-800',
    outline: 'bg-transparent border-2 border-gray-300 text-gray-700',
  };
  
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-sm',
  };
  
  return (
    <span
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export const StatusBadge = ({ status, className = '' }) => {
  const statusConfig = {
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'danger', label: 'Inactive' },
    pending: { variant: 'warning', label: 'Pending' },
    completed: { variant: 'default', label: 'Completed' },
    'in-progress': { variant: 'primary', label: 'In Progress' },
    upcoming: { variant: 'info', label: 'Scheduled' },
    maintenance: { variant: 'warning', label: 'Maintenance' },
  };
  
  const config = statusConfig[status?.toLowerCase()] || { variant: 'default', label: status || 'Unknown' };
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};

export default Badge;
