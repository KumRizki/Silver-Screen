export const NAV = [
  { label: "What's On", href: '/whats-on' },
  { label: 'Festivals', href: '/festivals' },
  { label: 'Di Bioskop', href: '/di-bioskop' },
  { label: 'Venues', href: '/venues' },
  { label: 'Blog', href: '/blog' },
] as const;

/** Pages in the plan that are not built yet. Each gets a short holding page. */
export const COMING_SOON: Record<string, { title: string; line: string }> = {
  festivals: { title: 'Festivals', line: 'Every festival and series in Jakarta, with dates and how to get tickets.' },
  'di-bioskop': { title: 'Di Bioskop', line: 'What is on general release this week, with links out to CGV, XXI and Cinépolis.' },
  venues: { title: 'Venues', line: 'Cinemas, cultural centres and community spaces that show films, with how to get there.' },
  blog: { title: 'Blog', line: 'Festival guides, ticket how-tos, interviews and picks.' },
  search: { title: 'Search', line: 'Search films, festivals and venues.' },
  alerts: { title: 'Alerts', line: 'A WhatsApp message when ticket sales open, and a short email on Fridays.' },
  submit: { title: 'Submit a screening', line: 'Organizers will be able to send us screenings here. Free to list.' },
  about: { title: 'About', line: 'Who runs The Silver Screen, where the listings come from, and how to reach us.' },
};
