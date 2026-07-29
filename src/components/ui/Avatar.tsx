'use client';

interface AvatarProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, alt, size = 32, className = '' }: AvatarProps) {
  return (
    <div
      className={`rounded-full overflow-hidden flex-shrink-0 border-2 border-white ${className}`}
      style={{ width: size, height: size, marginLeft: size > 32 ? '-8px' : undefined }}
    >
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        loading="lazy"
        className="object-cover w-full h-full"
      />
    </div>
  );
}

interface AvatarStackProps {
  items: { src: string; alt: string; id: string }[];
  size?: number;
  extra?: number;
  extraLabel?: string;
}

export function AvatarStack({ items, size = 28, extra, extraLabel }: AvatarStackProps) {
  return (
    <div className="flex items-center avatar-stack">
      {items.slice(0, 3).map((item) => (
        <Avatar key={item.id} src={item.src} alt={item.alt} size={size} />
      ))}
      {(extra !== undefined && extra > 0) && (
        <div
          className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: 'var(--secondary)', color: 'var(--primary)', marginLeft: '-8px' }}
        >
          {extraLabel ?? `+${extra}`}
        </div>
      )}
    </div>
  );
}