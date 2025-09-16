'use client';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function Loader({ size = 'md', text }: LoaderProps) {
  const sizes = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizes[size]} border-indigo-500 border-t-transparent rounded-full animate-spin`} />
      {text && <p className="mt-4 text-gray-400">{text}</p>}
    </div>
  );
}