import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button: React.FC<ButtonProps> = ({ 
  className = "", 
  variant = "default", 
  size = "default",
  children, 
  ...props 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "destructive":
        return "bg-red-600 text-white hover:bg-red-700 border-red-600";
      case "outline":
        return "border-2 bg-transparent text-current hover:bg-opacity-10 hover:bg-current border-current";
      case "secondary":
        return "bg-opacity-20 bg-current text-current hover:bg-opacity-30";
      case "ghost":
        return "text-current hover:bg-opacity-10 hover:bg-current";
      case "link":
        return "text-current underline-offset-4 hover:underline";
      default:
        return "bg-[var(--tg-button-color,#007bff)] text-[var(--tg-button-text-color,#ffffff)] hover:opacity-90 border-[var(--tg-button-color,#007bff)]";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-8 px-3 text-sm";
      case "lg":
        return "h-11 px-8";
      case "icon":
        return "h-10 w-10";
      default:
        return "h-10 px-4 py-2";
    }
  };

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tg-button-color,#007bff)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ${getVariantClasses()} ${getSizeClasses()} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};