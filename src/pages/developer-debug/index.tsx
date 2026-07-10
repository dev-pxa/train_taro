import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { CoverView, Input, ScrollView, Text, Textarea, View } from '@tarojs/components';
import AuthGate from '../../components/AuthGate';
import CustomNavBar from '../../components/CustomNavBar';
import {
  API_ENVIRONMENT_OPTIONS,
  ApiEnvironment,
  getDefaultEnvironmentConfig,
  loadEnvironmentConfig,
  saveEnvironmentConfig,
} from '../../services/environment';

const ENVIRONMENT_ORDER: ApiEnvironment[] = ['test', 'mock', 'production', 'custom'];

export default function DeveloperDebugPage() {
  const [selectedEnv, setSelectedEnv] = useState<ApiEnvironment>(getDefaultEnvironmentConfig().env);
  const [customApiBaseUrl, setCustomApiBaseUrl] = useState('');
  const [toastText, setToastText] = useState('');

  useEffect(() => {
    loadEnvironmentConfig().then(config => {
      setSelectedEnv(config.env);
      if (config.env === 'custom') setCustomApiBaseUrl(config.apiBaseUrl);
    });
  }, []);

  useEffect(() => {
    if (!toastText) return undefined;
    const timer = setTimeout(() => setToastText(''), 1600);
    return () => clearTimeout(timer);
  }, [toastText]);

  const handleSave = async () => {
    if (selectedEnv === 'custom' && !customApiBaseUrl.trim()) {
      Taro.showToast({ title: '请输入自定义环境域名', icon: 'none' });
      return;
    }
    const config = await saveEnvironmentConfig(selectedEnv, customApiBaseUrl);
    setToastText(`${API_ENVIRONMENT_OPTIONS[config.env].label}配置已保存`);
    await Taro.showModal({ title: '接口环境已切换', content: '当前登录态可能不适用于新环境，如接口返回登录过期，请重新登录。', showCancel: false });
  };

  const preview = selectedEnv === 'custom' ? customApiBaseUrl.trim() : API_ENVIRONMENT_OPTIONS[selectedEnv].apiBaseUrl;

  return (
    <AuthGate>
      <View className="page debug-page">
        {toastText ? <Text className="toast">{toastText}</Text> : null}
        <CustomNavBar title="开发者调试" showBack />
        <ScrollView scrollY className="debug-scroll">
          <View className="debug-hero gradient">
            <Text className="debug-kicker">Debug · 内部环境</Text>
            <Text className="debug-title">切换调试配置前，请确认当前账号和接口环境。</Text>
            <Text className="debug-copy">此页面用于培训 App 内部联调，保存后仅影响当前设备的调试参数。</Text>
          </View>

          <View className="section-card soft-card">
            <Text className="section-title">接口环境</Text>
            <Text className="section-desc">一行一个点按钮，选择后用于接口请求和日志上报。</Text>
            {ENVIRONMENT_ORDER.map(env => {
              const option = API_ENVIRONMENT_OPTIONS[env];
              const active = selectedEnv === env;
              return (
                <View className={`env-row ${active ? 'active' : ''}`} key={env} onClick={() => setSelectedEnv(env)}>
                  <View className="radio-dot">{active ? <View className="radio-inner" /> : null}</View>
                  <View className="env-copy">
                    <Text className="env-title">{option.label}</Text>
                    <Text className="env-meta">{env === 'custom' ? customApiBaseUrl || '请输入自定义域名' : option.apiBaseUrl.replace(/^https?:\/\//, '')}</Text>
                  </View>
                  <Text className="env-pill">{active ? '当前' : option.badge}</Text>
                </View>
              );
            })}
            {selectedEnv === 'custom' ? (
              <View className="debug-field">
                <Text className="field-label">自定义域名</Text>
                <Input className="debug-input" value={customApiBaseUrl} placeholder="请输入自定义环境域名" onInput={event => setCustomApiBaseUrl(event.detail.value)} />
              </View>
            ) : null}
          </View>

          <View className="section-card soft-card">
            <Text className="section-title">调试表单</Text>
            <Text className="section-desc">配置联调范围和临时参数，保存后下次打开仍按当前设置展示。</Text>
            <View className="debug-field"><Text className="field-label">调试范围</Text><View className="debug-input">考试流程 ⌄</View></View>
            <View className="debug-field"><Text className="field-label">接口路径</Text><Input className="debug-input" value="/training/exam/submit" /></View>
            <View className="debug-field"><Text className="field-label">测试用户 ID</Text><Input className="debug-input" value="u_20260528_zhang" /></View>
            <View className="debug-field"><Text className="field-label">调试备注</Text><Textarea className="debug-input debug-area" value="验证考试提交、结果页、证书跳转链路。" /></View>
          </View>

          <View className="preview-card soft-card">
            <Text className="preview-label">当前请求前缀</Text>
            <Text className="preview-value">{preview ? `${preview}/api/app` : '请输入自定义环境域名'}</Text>
          </View>
          <View className="safe-bottom" />
        </ScrollView>
        <CoverView className="fixed-bottom-actions debug-fixed-bottom-actions">
          <CoverView className="secondary-btn debug-fixed-action" onClick={() => Taro.navigateBack()}>取消</CoverView>
          <CoverView className="primary-btn debug-fixed-action" onClick={handleSave}>保存</CoverView>
        </CoverView>
      </View>
    </AuthGate>
  );
}
