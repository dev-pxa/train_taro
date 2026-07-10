import { Text } from '@tarojs/components';

export type IconName =
  | 'Home' | 'Learn' | 'Exam' | 'Profile' | 'Back' | 'Play' | 'Lock'
  | 'CheckCircle' | 'CloudDownload' | 'Share' | 'Refresh' | 'Settings'
  | 'ArrowRight' | 'Search' | 'X' | 'Medal' | 'VerifiedCheck' | 'Clock'
  | 'Book' | 'Logo' | 'User' | 'ChevronDown' | 'Check' | 'Eye' | 'Plus';

const ICONS: Record<IconName, string> = {
  Home: '⌂',
  Learn: '▣',
  Exam: '✓',
  Profile: '●',
  Back: '‹',
  Play: '▶',
  Lock: '⌕',
  CheckCircle: '✓',
  CloudDownload: '⇩',
  Share: '↗',
  Refresh: '↻',
  Settings: '⚙',
  ArrowRight: '›',
  Search: '⌕',
  X: '×',
  Medal: '◉',
  VerifiedCheck: '✓',
  Clock: '◷',
  Book: '▤',
  Logo: '✦',
  User: '●',
  ChevronDown: '⌄',
  Check: '✓',
  Eye: '◌',
  Plus: '+',
};

export default function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return <Text className={className}>{ICONS[name]}</Text>;
}
