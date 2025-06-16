import React from 'react';
import { cn } from '../../lib/utils';

const Toast = ({ title, description, variant = "default", className, ...props }) => {
  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 w-full max-w-sm rounded-lg border p-4 shadow-lg",
        variant === "destructive" 
          ? "border-red-200 bg-red-50 text-red-900" 
          : "border-green-200 bg-green-50 text-green-900",
        className
      )}
      {...props}
    >
      {title && <div className="font-semibold">{title}</div>}
      {description && <div className="text-sm opacity-90">{description}</div>}
    </div>
  );
};

export { Toast }; 