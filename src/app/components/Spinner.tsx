// app/components/Spinner.tsx
import React from 'react';

const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-[3px]',
    lg: 'w-8 h-8 border-4',
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeClasses[size]}`}
      role="status"
    >
      <span className="absolute!-m-px!h-px!w-px!overflow-hidden!whitespace-nowrap!border-0!p-0![clip:rect(0,0,0,0)]">
        
      </span>
    </div>
  );
};

export default Spinner;