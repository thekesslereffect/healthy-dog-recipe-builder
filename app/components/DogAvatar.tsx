import { avatarColorClass, initials } from '../utils/avatar';

interface DogAvatarProps {
  name: string;
  avatar?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
};

export function DogAvatar({ name, avatar, size = 'md', className = '' }: DogAvatarProps) {
  const label = name.trim() || 'Dog';
  const dim = sizes[size];

  if (avatar) {
    return (
      <img
        src={avatar}
        alt=""
        className={`${dim} shrink-0 rounded-full object-cover ring-2 ring-white ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${dim} inline-flex shrink-0 items-center justify-center rounded-full font-medium ring-2 ring-white dark:ring-zinc-900 ${avatarColorClass(label)} ${className}`}
    >
      {initials(label)}
    </span>
  );
}
