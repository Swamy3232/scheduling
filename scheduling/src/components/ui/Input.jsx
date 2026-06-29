import React from 'react';

const Input = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const baseClasses = 'w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';
  
  const stateClasses = error
    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400';
  
  const disabledClasses = props.disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : '';
  
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          className={`${baseClasses} ${stateClasses} ${disabledClasses} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <span className="w-1 h-1 bg-red-600 rounded-full"></span>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export const Select = ({
  label,
  error,
  helperText,
  options = [],
  className = '',
  containerClassName = '',
  ...props
}) => {
  const baseClasses = 'w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 appearance-none cursor-pointer';
  
  const stateClasses = error
    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400';
  
  const disabledClasses = props.disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : '';
  
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          className={`${baseClasses} ${stateClasses} ${disabledClasses} ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <span className="w-1 h-1 bg-red-600 rounded-full"></span>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export const Textarea = ({
  label,
  error,
  helperText,
  className = '',
  containerClassName = '',
  rows = 4,
  ...props
}) => {
  const baseClasses = 'w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none';
  
  const stateClasses = error
    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400';
  
  const disabledClasses = props.disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : '';
  
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        className={`${baseClasses} ${stateClasses} ${disabledClasses} ${className}`}
        rows={rows}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <span className="w-1 h-1 bg-red-600 rounded-full"></span>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
