import { Text } from '@tarojs/components';

export type IconName =
  | 'Home' | 'Learn' | 'Exam' | 'Profile' | 'Back' | 'Play' | 'Lock'
  | 'Unlock' | 'CheckCircle' | 'CloudDownload' | 'Share' | 'Refresh' | 'Settings'
  | 'ArrowRight' | 'Search' | 'X' | 'Medal' | 'VerifiedCheck' | 'Clock'
  | 'Book' | 'Logo' | 'User' | 'ChevronDown' | 'Check' | 'Eye' | 'Plus';

const ICONS: Record<IconName, string> = {
  Home: '\ue6bb',
  Learn: '\ue62e',
  Exam: '\ue7ab',
  Profile: '\ue7d9',
  Back: '\ue679',
  Play: '\ue74f',
  Lock: '\ue6c0',
  Unlock: '\ue6c2',
  CheckCircle: '\ue656',
  CloudDownload: '⇩',
  Share: '↗',
  Refresh: '↻',
  Settings: '⚙',
  ArrowRight: '\ue6a3',
  Search: '⌕',
  X: '×',
  Medal: '◉',
  VerifiedCheck: '\ue656',
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
  return <Text className={`iconfont ${className}`.trim()}>{ICONS[name]}</Text>;
}
