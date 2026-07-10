import { Text, View } from '@tarojs/components';
import CustomNavBar from '../../components/CustomNavBar';

export default function RegisterPage() {
  return (
    <View className="page register-page page-white">
      <CustomNavBar title="注册账号" variant="white" showBack backFallbackUrl="/pages/login/index" />
      <View className="empty-state">
        <Text className="empty-text">注册功能请联系企业培训管理员开通账号。</Text>
      </View>
    </View>
  );
}
