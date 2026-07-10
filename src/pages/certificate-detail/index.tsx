import { useEffect, useState } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { Image, ScrollView, Text, View } from '@tarojs/components';
import AuthGate from '../../components/AuthGate';
import CustomNavBar from '../../components/CustomNavBar';
import ErrorState from '../../components/ErrorState';
import Icon from '../../components/Icon';
import { useFetchData } from '../../hooks/useFetchData';
import { fetchCertificateDetail } from '../../services/api';
import { CertificateDetail, CertificateDetailResponse } from '../../types';

export default function CertificateDetailPage() {
  const router = useRouter();
  const certificateId = Number(router.params.certificateId || 0);
  const { data, loading, error, fetchData } = useFetchData<CertificateDetail>();
  const [toastText, setToastText] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchData(() => fetchCertificateDetail(certificateId) as Promise<CertificateDetailResponse>);
  }, [certificateId, fetchData]);

  useEffect(() => {
    if (!toastText) return undefined;
    const timer = setTimeout(() => setToastText(''), 1600);
    return () => clearTimeout(timer);
  }, [toastText]);

  const handleDownload = async () => {
    if (!data || downloading) return;
    setDownloading(true);
    try {
      await Taro.saveImageToPhotosAlbum({ filePath: data.imageUrl });
      setToastText('证书已保存到本地');
    } catch {
      setToastText('证书下载失败，请稍后重试');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AuthGate>
      <View className="page certificate-page page-white">
        {toastText ? <Text className="toast">{toastText}</Text> : null}
        <CustomNavBar
          title="证书详情"
          variant="white"
          showBack
          rightSlot={<View className="custom-nav-action" onClick={() => setToastText('证书信息来自本次考试记录')}>?</View>}
        />
        {loading ? <View className="loading-state"><Text className="loading-text">加载证书中...</Text></View> : null}
        {error || !data ? (
          !loading ? <ErrorState message={error || '证书详情加载失败'} onRetry={() => fetchData(() => fetchCertificateDetail(certificateId) as Promise<CertificateDetailResponse>)} /> : null
        ) : (
          <>
            <ScrollView scrollY className="certificate-scroll">
              <View className="certificate-status gradient">
                <Text className="result-status"><Icon name="VerifiedCheck" /> {data.statusText}</Text>
                <Text className="certificate-name">{data.name}</Text>
                <Text className="certificate-desc">{data.desc}</Text>
              </View>
              <View className="certificate-wrap">
                <Image className="certificate-image" src={data.imageUrl} mode="aspectFill" onClick={() => setToastText('已打开证书大图预览')} />
                <Text className="preview-hint"><Icon name="Search" /> {data.previewHint}</Text>
              </View>
              <View className="section-card soft-card">
                <Text className="section-title">{data.infoSection.title}</Text>
                {data.infoSection.rows.map(row => (
                  <View className="info-row" key={row.label}>
                    <Text className="info-label">{row.label}</Text>
                    <Text className="info-value">{row.value}</Text>
                  </View>
                ))}
              </View>
              <View className="section-card soft-card">
                <Text className="section-title">{data.nodeInfo.noteTitle}</Text>
                {data.nodeInfo.notes.map(note => <Text className="note-line" key={note}>• {note}</Text>)}
              </View>
              <View className="safe-bottom" />
            </ScrollView>
            <View className="fixed-bottom-actions">
              <View className="primary-btn" onClick={handleDownload}>{downloading ? '下载中...' : '下载证书'}</View>
              <View className="secondary-btn" onClick={() => setToastText('证书分享卡已生成')}>分享证书</View>
            </View>
          </>
        )}
      </View>
    </AuthGate>
  );
}
