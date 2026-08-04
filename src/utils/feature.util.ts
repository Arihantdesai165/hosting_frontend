export interface MenuItem {
  name: string;
  path: string;
  icon: any;
  feature?: string;
  badge?: number;
}

export interface MenuGroup {
  title: string;
  items: MenuItem[];
}

/**
 * Reusable utility to filter grouped menu items based on active feature flags.
 * Used across AdminLayout, PrincipalLayout, and future ERP dashboards.
 */
export const filterMenuItems = (
  groups: MenuGroup[],
  features: Record<string, boolean>
): MenuGroup[] => {
  return groups
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (!item.feature) return true;
        return !!features[item.feature];
      })
    }))
    .filter(group => group.items.length > 0);
};
