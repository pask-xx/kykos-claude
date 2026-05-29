'use client';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-10 w-10 border-[3px]',
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      className={`
        animate-spin rounded-full border-b-transparent
        border-primary-600
        ${sizeClasses[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    />
  );
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-3 z-10">
      <Spinner size="lg" />
      {message && <p className="text-gray-500 text-sm">{message}</p>}
    </div>
  );
}
