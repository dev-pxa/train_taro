import { Text } from '@tarojs/components';

export type IconName =
  | 'Home' | 'Learn' | 'Exam' | 'Profile' | 'Back' | 'Play' | 'Lock'
  | 'Unlock' | 'CheckCircle' | 'CloudDownload' | 'Share' | 'Refresh' | 'Settings'
  | 'ArrowRight' | 'Search' | 'X' | 'Medal' | 'VerifiedCheck' | 'Clock'
  | 'Book' | 'ExamDuration' | 'ExamQuestionCount' | 'ExamPassScore'
  | 'Logo' | 'User' | 'ChevronDown' | 'Check' | 'Eye' | 'Plus' | 'Info';

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
  CloudDownload: '\ue703',
  Share: '\ue6f3',
  Refresh: '\ue6a4',
  Settings: '⚙',
  ArrowRight: '\ue6a3',
  Search: '\ue65c',
  X: '\ue658',
  Medal: '\ue7c2',
  VerifiedCheck: '\ue656',
  Clock: '\ue65f',
  Book: '\ue7ab',
  ExamDuration: '\ue65f',
  ExamQuestionCount: '\ue691',
  ExamPassScore: '\ue7c2',
  Logo: '✦',
  User: '\ue7d9',
  ChevronDown: '\ue749',
  Check: '✓',
  Eye: '\ue637',
  Plus: '\ue6da',
  Info: '\ue6e4',
};

export default function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  return <Text className={`iconfont ${className}`.trim()}>{ICONS[name]}</Text>;
}
