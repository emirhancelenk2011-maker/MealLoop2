const paths = {
  home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  packages: 'M4 8h16v13H4z M3 4h18v4H3z M10 12h4',
  reservations: 'M7 3h10v3H7z M7 5H4v16h16V5h-3 M8 11h8 M8 15h5',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z',
  plus: 'M12 5v14 M5 12h14', close: 'm6 6 12 12 M18 6 6 18', menu: 'M4 6h16 M4 12h16 M4 18h16',
  arrow: 'M4 12h16 m-6-6 6 6-6 6', chevron: 'm14 6-6 6 6 6', search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 m5 12 6 6',
  moon: 'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11z', sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l1 1 M18 18l1 1 M5 19l1-1 M18 6l1-1',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M2 12h20 M12 2c-6 5-6 15 0 20 M12 2c6 5 6 15 0 20',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2',
  pin: 'M12 22s8-8 8-14a8 8 0 0 0-16 0c0 6 8 14 8 14z M12 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  user: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M4 21v-3a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v3',
  leaf: 'M20 3C9 1 2 8 6 15s16 4 14-12z M4 21 16 8 M9 16v-5 M10 15h6',
  check: 'm5 12 4 4L19 6', edit: 'm16 3 5 5-12 12-6 1 1-6z M13 6l5 5',
  trash: 'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
  logout: 'M9 4H4v16h5 M10 12h11 m-4-4 4 4-4 4', store: 'M3 10h18l-2-7H5z M4 10v11h16V10 M9 21v-7h6v7',
};
export default function Icon({ name, size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.packages} /></svg>;
}
