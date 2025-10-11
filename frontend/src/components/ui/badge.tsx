import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "destructive" | "secondary" | "outline";
}

export const Badge: React.FC<BadgeProps> = ({ 
  className = "", 
  variant = "default", 
  children, 
  ...props 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "destructive":
        return "bg-red-100 text-red-800";
      case "secondary":
        return "bg-gray-100 text-gray-800";
      case "outline":
        return "border border-gray-300 text-gray-700";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getVariantClasses()} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};