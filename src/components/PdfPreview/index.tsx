import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import { Text, View } from '@tarojs/components';
import Icon from '../Icon';
import { getResourceAuthOptions } from '../../services/resourceRequest';

type PdfPreviewProps = {
  url: string;
  title?: string;
  downloadable?: boolean;
};

type PreviewStatus = 'idle' | 'loading' | 'ready' | 'error';

export default function PdfPreview({ url, title, downloadable = true }: PdfPreviewProps) {
  const [status, setStatus] = useState<PreviewStatus>('idle');
  const [message, setMessage] = useState('点击打开PDF');

  const openPdf = async () => {
    if (!url) {
      setStatus('error');
      setMessage('缺少PDF地址');
      return;
    }

    try {
      setStatus('loading');
      setMessage('正在加载PDF');
      const { header } = await getResourceAuthOptions(url);
      const downloadResult = await Taro.downloadFile({ url, header });
      if (downloadResult.statusCode && downloadResult.statusCode >= 400) {
        throw new Error(`PDF下载失败：${downloadResult.statusCode}`);
      }

      await Taro.openDocument({
        filePath: downloadResult.tempFilePath,
        fileType: 'pdf',
        showMenu: downloadable,
      });
      setStatus('ready');
      setMessage('PDF已打开');
    } catch (error) {
      console.error('Open PDF failed:', error);
      setStatus('error');
      setMessage('PDF打开失败，请稍后重试');
    }
  };

  useEffect(() => {
    openPdf();
  }, [url, downloadable]);

  return (
    <View className="pdf-preview pdf-preview-native">
      <View className="resource-title-bar">
        <Text className="resource-title">{title || 'PDF预览'}</Text>
        <View className="resource-action" onClick={openPdf}><Icon name="Refresh" /> 重试</View>
      </View>
      <View className={`pdf-preview-status pdf-preview-status-${status}`}>
        <Text className="pdf-preview-status-title">{message}</Text>
        <Text className="pdf-preview-status-desc">
          {downloadable ? '微信小程序使用系统文档预览打开PDF' : '该资源仅支持在线预览，系统保存菜单已关闭'}
        </Text>
      </View>
    </View>
  );
}
