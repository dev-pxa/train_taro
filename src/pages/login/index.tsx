import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { Button, Input, Picker, Text, View } from '@tarojs/components';
import AgreementModal from '../../components/AgreementModal';
import Icon from '../../components/Icon';
import { useAuth } from '../../contexts/AuthContext';
import { fetchLoginConfig, login } from '../../services/api';
import { Agreement, Company } from '../../types';

export default function LoginPage() {
  const { signIn, initializing, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [agreements, setAgreements] = useState<Agreement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await fetchLoginConfig();
        setCompanies(config.data.companies);
        setAgreements(config.data.agreements);
      } catch {
        Taro.showToast({ title: '获取登录配置失败', icon: 'none' });
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  useEffect(() => {
    if (!initializing && isAuthenticated) {
      Taro.switchTab({ url: '/pages/home/index' });
    }
  }, [initializing, isAuthenticated]);

  const selectedCompany = companies[selectedIndex];

  const handleLogin = async () => {
    if (!selectedCompany) {
      Taro.showToast({ title: '请选择企业', icon: 'none' });
      return;
    }
    if (!username.trim()) {
      Taro.showToast({ title: '请输入工号/手机号', icon: 'none' });
      return;
    }
    if (!password.trim()) {
      Taro.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }
    if (!agreedToTerms) {
      setShowAgreementModal(true);
      return;
    }
    setLoggingIn(true);
    try {
      const response = await login({ companyCode: selectedCompany.code, username: username.trim(), password: password.trim() });
      await signIn(response);
      Taro.switchTab({ url: '/pages/home/index' });
    } catch (err) {
      Taro.showToast({ title: err instanceof Error ? err.message : '登录失败', icon: 'none' });
    } finally {
      setLoggingIn(false);
    }
  };

  if (loading || initializing) {
    return <View className="loading-state"><Text className="loading-text">加载中...</Text></View>;
  }

  return (
    <View className="page login-page page-white">
      <View className="login-content">
        <View className="brand-section">
          <View className="brand-logo gradient"><Icon name="Logo" className="brand-logo-icon" /></View>
          <Text className="brand-title">企训通</Text>
          <Text className="brand-subtitle">智能家居行业领先的培训平台</Text>
        </View>

        <View className="login-form">
          <View className="field-label">企业</View>
          <Picker mode="selector" range={companies.map(company => company.name)} value={selectedIndex} onChange={event => setSelectedIndex(Number(event.detail.value))}>
            <View className="input-shell">
              <Text className="input-text">{selectedCompany?.name || '请选择企业'}</Text>
              <Icon name="ChevronDown" className="input-icon" />
            </View>
          </Picker>

          <View className="input-shell">
            <Icon name="User" className="input-icon" />
            <Input className="input-control" placeholder="工号 / 手机号" value={username} onInput={event => setUsername(event.detail.value)} />
          </View>

          <View className="input-shell">
            <Icon name="Lock" className="input-icon" />
            <Input className="input-control" password placeholder="请输入密码" value={password} onInput={event => setPassword(event.detail.value)} />
          </View>
        </View>

        <View className="quick-row">
          <View className="agree-row" onClick={() => setAgreedToTerms(value => !value)}>
            <View className={`checkbox ${agreedToTerms ? 'checked' : ''}`}>{agreedToTerms ? '✓' : ''}</View>
            <Text>我已阅读并同意</Text>
            <Text className="link" onClick={() => setShowAgreementModal(true)}>服务协议和隐私条款</Text>
          </View>
          <Text className="forgot">忘记密码？</Text>
        </View>

        <Button className="primary-btn login-button" loading={loggingIn} onClick={handleLogin}>立即开启学习</Button>

        <View className="register-row">
          <Text>还没有账号？</Text>
          <Text className="link" onClick={() => Taro.navigateTo({ url: '/pages/register/index' })}>立即注册</Text>
        </View>
      </View>

      {agreements ? (
        <AgreementModal
          visible={showAgreementModal}
          agreements={agreements}
          onClose={() => setShowAgreementModal(false)}
          onAgree={() => setAgreedToTerms(true)}
        />
      ) : null}
    </View>
  );
}
