import { useEffect, useMemo, useState } from 'react';
import { Text, View } from '@tarojs/components';
import Icon from '../Icon';
import { getResourceAuthOptions } from '../../services/resourceRequest';

type PdfPreviewProps = {
  url: string;
  title?: string;
  downloadable?: boolean;
};

type PreviewStatus = 'loading' | 'ready' | 'error';

export default function PdfPreview({ url, title, downloadable = true }: PdfPreviewProps) {
  const [status, setStatus] = useState<PreviewStatus>('loading');
  const [message, setMessage] = useState('正在加载PDF');
  const [objectUrl, setObjectUrl] = useState('');

  const previewTitle = useMemo(() => title || 'PDF预览', [title]);

  const openInNewTab = () => {
    if (typeof window !== 'undefined') {
      const targetUrl = objectUrl || url;
      if (targetUrl) {
        window.open(targetUrl, '_blank');
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    let nextObjectUrl = '';

    setObjectUrl('');
    setStatus('loading');
    setMessage('正在加载PDF');

    if (!url) {
      setStatus('error');
      setMessage('缺少PDF地址');
      return undefined;
    }

    const loadPdf = async () => {
      try {
        const { header, credentials } = await getResourceAuthOptions(url);
        const response = await fetch(url, { headers: header, credentials });
        if (!response.ok) {
          throw new Error(`PDF下载失败：${response.status}`);
        }

        const blob = await response.blob();
        if (cancelled) return;

        nextObjectUrl = URL.createObjectURL(
          new Blob([blob], { type: blob.type || 'application/pdf' }),
        );
        setObjectUrl(nextObjectUrl);
        setStatus('ready');
        setMessage(previewTitle);
      } catch (error) {
        if (cancelled) return;
        console.error('PDF preview failed:', error);
        setStatus('error');
        setMessage('PDF加载失败，请检查文件地址或跨域配置');
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      if (nextObjectUrl) {
        URL.revokeObjectURL(nextObjectUrl);
      }
    };
  }, [previewTitle, url]);

  return (
    <View className="pdf-preview">
      <View className="resource-title-bar">
        <Text className="resource-title">{previewTitle}</Text>
        {downloadable ? (
          <View className="resource-action" onClick={openInNewTab}><Icon name="Share" /> 打开文件</View>
        ) : (
          <View className="resource-action resource-action-muted"><Icon name="Lock" /> 禁止下载</View>
        )}
      </View>
      {status === 'ready' && objectUrl ? (
        <View className="pdf-iframe-shell">
          <iframe
            className="pdf-iframe"
            src={downloadable ? objectUrl : `${objectUrl}#toolbar=0&navpanes=0`}
            title={previewTitle}
            onContextMenu={downloadable ? undefined : (event) => event.preventDefault()}
          />
        </View>
      ) : (
        <View className={`pdf-preview-status pdf-preview-status-${status}`}>
          <Text className="pdf-preview-status-title">{message}</Text>
          {status === 'loading' && (
            <Text className="pdf-preview-status-desc">正在准备内嵌预览</Text>
          )}
          {status === 'error' && (
            <Text className="pdf-preview-status-desc">请检查文件地址、登录状态或跨域配置</Text>
          )}
        </View>
      )}
    </View>
  );
}
