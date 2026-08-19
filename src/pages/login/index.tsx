import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { Button, Image, Input, Picker, Text, View } from '@tarojs/components';
import AgreementModal from '../../components/AgreementModal';
import { useAuth } from '../../contexts/AuthContext';
import { fetchLoginConfig, login } from '../../services/api';
import { Agreement, Company } from '../../types';
import heroDecoration from '../../assets/login/hero-decoration.png';
import glowlinkWordmark from '../../assets/login/glowlink-wordmark.png';
import enterpriseIcon from '../../assets/login/icon-enterprise.png';
import chevronIcon from '../../assets/login/icon-chevron.png';
import userIcon from '../../assets/login/icon-user.png';
import lockIcon from '../../assets/login/icon-lock.png';
import eyeIcon from '../../assets/login/icon-eye.png';
import eyeHiddenIcon from '../../assets/login/icon-eye-hidden.png';

export default function LoginPage() {
  const { signIn, initializing, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [agreements, setAgreements] = useState<Agreement | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
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
    <View className="page login-page">
      <Image className="login-hero-decoration" src={heroDecoration} mode="scaleToFill" />

      <View className="login-content">
        <View className="brand-section">
          <Image className="brand-wordmark" src={glowlinkWordmark} mode="aspectFit" />
          <Text className="brand-subtitle">智能家居行业领先的培训平台</Text>
        </View>

        <View className="login-card">
          <View className="login-form">
            <Picker mode="selector" range={companies.map(company => company.name)} value={selectedIndex} onChange={event => setSelectedIndex(Number(event.detail.value))}>
              <View className="login-field enterprise-field">
                <Image className="field-image" src={enterpriseIcon} mode="aspectFit" />
                <Text className="input-text">{selectedCompany?.name || '企业选择'}</Text>
                <Image className="field-image field-action chevron-image" src={chevronIcon} mode="aspectFit" />
              </View>
            </Picker>

            <View className="login-field">
              <Image className="field-image" src={userIcon} mode="aspectFit" />
              <Input className="input-control" placeholder="工号/手机号" value={username} onInput={event => setUsername(event.detail.value)} />
            </View>

            <View className="login-field">
              <Image className="field-image" src={lockIcon} mode="aspectFit" />
              <Input
                className="input-control"
                password={!passwordVisible}
                placeholder="密码"
                value={password}
                onInput={event => setPassword(event.detail.value)}
              />
              <View
                className="field-action password-visibility"
                onClick={() => setPasswordVisible(value => !value)}
              >
                <Image
                  className="field-image eye-image"
                  src={passwordVisible ? eyeIcon : eyeHiddenIcon}
                  mode="aspectFit"
                />
              </View>
            </View>
          </View>

          <View className="quick-row">
            <View className="agree-row">
              <View
                className={`checkbox ${agreedToTerms ? 'checked' : ''}`}
                onClick={() => setAgreedToTerms(value => !value)}
              >
                {agreedToTerms ? '✓' : ''}
              </View>
              <Text className="agreement-prefix">我已阅读并同意</Text>
              <Text className="link agreement-link" onClick={() => setShowAgreementModal(true)}>服务协议和隐私条款</Text>
            </View>
            <Text className="forgot">忘记密码?</Text>
          </View>

          <Button className="primary-btn login-button" loading={loggingIn} onClick={handleLogin}>立即开启学习</Button>

          <Button className="login-register-button" onClick={() => Taro.navigateTo({ url: '/pages/register/index' })}>立即注册</Button>
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
