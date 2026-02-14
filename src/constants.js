export const TICKET_TYPES = [
  { value: 'bug', label: 'Bug Report', icon: '\u{1F41B}' },
  { value: 'feature', label: 'Feature Request', icon: '\u{2728}' },
  { value: 'question', label: 'Question', icon: '\u{2753}' },
  { value: 'support', label: 'Support Ticket', icon: '\u{1F3AB}' },
];

export const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#22c55e' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
];

export const MOODS = [
  { value: 1, emoji: '\u{1F621}', label: 'Frustrated' },
  { value: 2, emoji: '\u{1F615}', label: 'Unhappy' },
  { value: 3, emoji: '\u{1F610}', label: 'Neutral' },
  { value: 4, emoji: '\u{1F642}', label: 'Happy' },
  { value: 5, emoji: '\u{1F929}', label: 'Love it' },
];

export const FBWIDGET_VERSION = 'v2.2';

export const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'application/pdf', 'text/plain'];
export const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.txt', '.log'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
