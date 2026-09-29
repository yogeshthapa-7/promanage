import { Avatar as AntAvatar } from 'antd';
import type { AvatarProps as AntAvatarProps } from 'antd';
import type { AvatarProps, AvatarStackProps } from '@/shared/components/ui/types/generic-ui-types';


export function Avatar({ src, alt, size = 32, className = '' }: AvatarProps) {
  return (
    <AntAvatar
      src={src}
      alt={alt}
      size={size as AntAvatarProps['size']}
      className={className}
      style={{ marginLeft: size > 32 ? '-8px' : undefined }}
    />
  );
}

export function AvatarStack({ items, size = 28, extra, extraLabel }: AvatarStackProps) {
  return (
    <AntAvatar.Group maxCount={3}>
      {items.slice(0, 3).map((item) => (
        <Avatar key={item.id} src={item.src} alt={item.alt} size={size} />
      ))}
      {(extra !== undefined && extra > 0) && (
        <AntAvatar
          size={size}
          style={{ background: 'var(--secondary)', color: 'var(--primary)' }}
        >
          {extraLabel ?? `+${extra}`}
        </AntAvatar>
      )}
    </AntAvatar.Group>
  );
}






