import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ className = "", children, ...props }) => (
  <div
    className={`bg-white rounded-lg shadow-md ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<CardProps> = ({ className = "", children, ...props }) => (
  <div
    className={`p-4 pb-2 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className = "", children, ...props }) => (
  <h3
    className={`text-lg font-semibold ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardContent: React.FC<CardProps> = ({ className = "", children, ...props }) => (
  <div
    className={`p-4 pt-2 ${className}`}
    {...props}
  >
    {children}
  </div>
);