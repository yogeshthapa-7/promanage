import type { ReactNode } from 'react';
import { Dropdown as AntDropdown } from 'antd';
import type { MenuProps } from 'antd';
import type { DropdownMenuProps } from '@/shared/components/ui/types/generic-ui-types';


export default function DropdownMenu({ trigger, items, className }: DropdownMenuProps) {
  const menuItems: MenuProps['items'] = items.map((item, index) => ({
    key: index.toString(),
    label: item.label,
    onClick: item.onClick,
    danger: item.danger,
  }));

  return (
    <AntDropdown
      menu={{
        items: menuItems,
        style: { zIndex: 9999 },
      }}
      placement="bottomRight"
      className={className}
      trigger={['click']}
      getPopupContainer={() => document.body}
    >
      {trigger}
    </AntDropdown>
  );
}






