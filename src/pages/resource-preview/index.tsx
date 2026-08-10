import { useMemo } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { Image, ScrollView, Text, View } from '@tarojs/components';
import AuthGate from '../../components/AuthGate';
import CustomNavBar from '../../components/CustomNavBar';
import Icon from '../../components/Icon';
import PdfPreview from '../../components/PdfPreview';

type PreviewType = 'image' | 'pdf';

function decodeParam(value?: string): string {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isPreviewType(value?: string): value is PreviewType {
  return value === 'image' || value === 'pdf';
}

export default function ResourcePreviewPage() {
  const router = useRouter();
  const type = isPreviewType(router.params.type) ? router.params.type : null;
  const resourceUrl = useMemo(() => decodeParam(router.params.url), [router.params.url]);
  const title = useMemo(() => decodeParam(router.params.title) || (type === 'pdf' ? 'PDF预览' : '图片预览'), [router.params.title, type]);
  const downloadable = router.params.downloadable !== '0';

  const handlePreviewImage = () => {
    if (!resourceUrl) return;
    Taro.previewImage({ urls: [resourceUrl], current: resourceUrl });
  };

  return (
    <AuthGate>
      <View className="page resource-preview-page page-white">
        <CustomNavBar title={type === 'pdf' ? 'PDF预览' : '图片预览'} variant="white" showBack />
        {!type || !resourceUrl ? (
          <View className="resource-empty">
            <Text className="resource-empty-title">资料暂不可预览</Text>
            <Text className="resource-empty-desc">缺少资源类型或文件地址</Text>
          </View>
        ) : type === 'image' ? (
          <ScrollView scrollY className="resource-image-scroll">
            <View className="resource-title-bar">
              <Text className="resource-title">{title}</Text>
              {downloadable ? (
                <View className="resource-action" onClick={handlePreviewImage}><Icon name="Eye" /> 查看原图</View>
              ) : (
                <View className="resource-action resource-action-muted"><Icon name="Lock" /> 禁止下载</View>
              )}
            </View>
            <View>
              <Image
                className={`resource-image${downloadable ? '' : ' resource-image-protected'}`}
                src={resourceUrl}
                mode="widthFix"
                showMenuByLongpress={downloadable}
                onClick={downloadable ? handlePreviewImage : undefined}
              />
            </View>
            <View className="safe-bottom" />
          </ScrollView>
        ) : (
          <PdfPreview url={resourceUrl} title={title} downloadable={downloadable} />
        )}
      </View>
    </AuthGate>
  );
}
