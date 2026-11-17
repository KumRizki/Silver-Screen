// One icon set: 24px grid, 1.5 stroke, round caps. Rendered at 20px.
export const ICONS = {
  search: '<circle cx="11" cy="11" r="7"></circle><path d="M20 20l-4-4"></path>',
  menu: '<path d="M4 8h16M4 16h16"></path>',
  left: '<path d="M19 12H5M11 6l-6 6 6 6"></path>',
  right: '<path d="M5 12h14M13 6l6 6-6 6"></path>',
  back: '<path d="M15 5l-7 7 7 7"></path>',
  play: '<path d="M8 5l11 7-11 7z"></path>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="2"></rect><path d="M4 10h16M9 3v4M15 3v4"></path>',
  share: '<path d="M12 4v11M8 8l4-4 4 4M5 14v5h14v-5"></path>',
  bell: '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"></path><path d="M10 20h4"></path>',
  ext: '<path d="M14 5h5v5M19 5l-8 8M18 14v5H5V6h5"></path>',
  pin: '<path d="M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12z"></path><circle cx="12" cy="9" r="2.5"></circle>',
} as const;

export type IconName = keyof typeof ICONS;
