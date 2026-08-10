import { useEffect } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { Text, Video, View } from '@tarojs/components';
import AuthGate from '../../components/AuthGate';
import CustomNavBar from '../../components/CustomNavBar';
import ErrorState from '../../components/ErrorState';
import Icon from '../../components/Icon';
import { useFetchData } from '../../hooks/useFetchData';
import { fetchProductDetail } from '../../services/api';
import { ProductDetail } from '../../types';

export default function ProductDetailPage() {
  const router = useRouter();
  const productId = router.params.productId || '';
  const { data, loading, error, fetchData } = useFetchData<ProductDetail>();

  useEffect(() => {
    if (productId) fetchData(() => fetchProductDetail(productId));
  }, [productId, fetchData]);

  return (
    <AuthGate>
      <View className="page product-detail-page" data-testid="product-detail-screen">
        <CustomNavBar title="产品详情" variant="white" showBack />
        {loading ? <View className="loading-state"><Text className="loading-text">加载中...</Text></View> : null}
        {error || !data ? (
          !loading ? (
            <ErrorState
              message={error || '产品数据加载失败'}
              onRetry={() => fetchData(() => fetchProductDetail(productId))}
              onGoHome={() => Taro.switchTab({ url: '/pages/product-guide/index' })}
            />
          ) : null
        ) : (
          <View className="product-detail-scroll">
            <View className="product-video-shell">
              {data.videoUrl ? (
                <Video
                  className="product-video"
                  src={data.videoUrl}
                  controls
                  objectFit="cover"
                  enableProgressGesture={false}
                  pageGesture={false}
                  vslideGesture={false}
                />
              ) : (
                <View className="product-video-empty">
                  <View className="product-video-empty-icon">
                    <Icon name="Play" className="product-video-empty-play" />
                  </View>
                  <Text className="product-video-empty-text">暂无产品介绍视频</Text>
                </View>
              )}
            </View>

            <View className="product-detail-card product-summary-card">
              <Text className="product-detail-name">{data.name}</Text>
              <Text className="product-detail-description">{data.description}</Text>
            </View>

            <View className="product-detail-card product-spec-card">
              <Text className="product-detail-section-title">说明信息</Text>
              {data.specs.length ? (
                <View className="product-spec-table">
                  {data.specs.map((spec, index) => (
                    <View key={`${spec.title}-${index}`} className="product-spec-row">
                      <Text className="product-spec-title">{spec.title}</Text>
                      <Text className="product-spec-content">{spec.content}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="product-spec-empty">暂无说明信息</Text>
              )}
            </View>
            <View className="safe-bottom" />
          </View>
        )}
      </View>
    </AuthGate>
  );
}
