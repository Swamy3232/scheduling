import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'lg',
  shadow = 'md',
  hover = false 
}) => {
  const baseClasses = 'rounded-2xl border transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-white border-gray-200',
    elevated: 'bg-white border-gray-100 shadow-lg',
    glass: 'bg-white/80 backdrop-blur-xl border-white/20',
    outlined: 'bg-transparent border-2 border-gray-200',
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };
  
  const hoverClasses = hover ? 'hover:shadow-xl hover:-translate-y-0.5' : '';
  
  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${shadowClasses[shadow]} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-6 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-xl font-bold text-gray-900 ${className}`}>{children}</h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`}>{children}</p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-6 pt-6 border-t border-gray-200 ${className}`}>{children}</div>
);

export default Card;
