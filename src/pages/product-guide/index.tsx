import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Taro, { useDidShow } from '@tarojs/taro';
import { Image, ScrollView, Text, View } from '@tarojs/components';
import AuthGate from '../../components/AuthGate';
import CustomNavBar, { getCustomNavMetrics } from '../../components/CustomNavBar';
import ErrorState from '../../components/ErrorState';
import Icon from '../../components/Icon';
import { fetchProductCategories, fetchProductList } from '../../services/api';
import {
  ProductCategory,
  ProductCategoryChild,
  ProductListItem,
} from '../../types';

export default function ProductGuidePage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [activePrimaryId, setActivePrimaryId] = useState<number>();
  const [activeSecondaryId, setActiveSecondaryId] = useState<number>();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(true);
  const [categoryError, setCategoryError] = useState('');
  const [productError, setProductError] = useState('');
  const requestSequence = useRef(0);
  const navMetrics = useMemo(getCustomNavMetrics, []);
  const navHeight = navMetrics.statusBarHeight + navMetrics.navBarHeight;

  const loadCategories = useCallback(async () => {
    setCategoryLoading(true);
    setCategoryError('');
    try {
      const response = await fetchProductCategories();
      if (response.code !== 0 || !Array.isArray(response.data)) {
        throw new Error(response.des || response.desc || '获取产品分类失败');
      }
      setCategories(response.data);
      setActivePrimaryId(current => current && response.data.some(item => item.id === current) ? current : undefined);
    } catch (error) {
      setCategoryError(error instanceof Error ? error.message : '获取产品分类失败');
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setProductLoading(true);
    setProductError('');
    try {
      const response = await fetchProductList({
        primaryCategoryId: activePrimaryId,
        secondaryCategoryId: activeSecondaryId,
      });
      if (sequence !== requestSequence.current) return;
      if (response.code !== 0 || !response.data || !Array.isArray(response.data.list)) {
        throw new Error(response.des || response.desc || '获取产品列表失败');
      }
      setProducts(response.data.list);
      setTotal(response.data.total);
    } catch (error) {
      if (sequence !== requestSequence.current) return;
      setProducts([]);
      setTotal(0);
      setProductError(error instanceof Error ? error.message : '获取产品列表失败');
    } finally {
      if (sequence === requestSequence.current) setProductLoading(false);
    }
  }, [activePrimaryId, activeSecondaryId]);

  useDidShow(() => {
    void loadCategories();
  });

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const secondaryCategories: ProductCategoryChild[] = activePrimaryId
    ? categories.find(item => item.id === activePrimaryId)?.children || []
    : [];

  const selectPrimary = (id?: number) => {
    setActivePrimaryId(id);
    setActiveSecondaryId(undefined);
  };

  const openProduct = (product: ProductListItem) => {
    Taro.navigateTo({ url: `/pages/product-detail/index?productId=${product.id}` });
  };

  return (
    <AuthGate>
      <View className="page product-guide-page" data-testid="product-guide-screen">
        <CustomNavBar title="产品说明" variant="white" fixed />
        <View className="product-guide-layout" style={{ height: `calc(100vh - ${navHeight}px)` }}>
          <ScrollView scrollY className="product-primary-list" showScrollbar={false}>
            <View
              className={`product-primary-item ${activePrimaryId === undefined ? 'active' : ''}`}
              onClick={() => selectPrimary(undefined)}
            >
              <Text>全部</Text>
            </View>
            {categories.map(category => (
              <View
                key={category.id}
                className={`product-primary-item ${activePrimaryId === category.id ? 'active' : ''}`}
                onClick={() => selectPrimary(category.id)}
              >
                <Text>{category.name}</Text>
              </View>
            ))}
          </ScrollView>

          <View className="product-main-pane">
            <ScrollView scrollX className="product-secondary-list" showScrollbar={false}>
              <Text
                className={`product-secondary-item ${activeSecondaryId === undefined ? 'active' : ''}`}
                onClick={() => setActiveSecondaryId(undefined)}
              >
                全部
              </Text>
              {secondaryCategories.map(category => (
                <Text
                  key={category.id}
                  className={`product-secondary-item ${activeSecondaryId === category.id ? 'active' : ''}`}
                  onClick={() => setActiveSecondaryId(category.id)}
                >
                  {category.name}
                </Text>
              ))}
            </ScrollView>

            <View className="product-list-head">
              <Text className="product-list-title">
                {activePrimaryId
                  ? categories.find(item => item.id === activePrimaryId)?.name || '产品'
                  : '全部产品'}
              </Text>
              <Text className="product-list-count">{total} 款</Text>
            </View>

            {categoryLoading || productLoading ? (
              <View className="product-state"><Text>加载中...</Text></View>
            ) : categoryError ? (
              <ErrorState message={categoryError} onRetry={loadCategories} />
            ) : productError ? (
              <ErrorState message={productError} onRetry={loadProducts} />
            ) : (
              <ScrollView scrollY className="product-list-scroll" showScrollbar={false}>
                {products.length ? (
                  <View className="product-card-list">
                    {products.map(product => (
                      <View key={product.id} className="product-card-row" onClick={() => openProduct(product)}>
                        <View className="product-image-wrap">
                          {product.imageUrl ? (
                            <Image className="product-image" src={product.imageUrl} mode="aspectFit" lazyLoad />
                          ) : (
                            <Text className="product-image-empty">暂无图片</Text>
                          )}
                        </View>
                        <View className="product-card-copy">
                          <Text className="product-card-name">{product.name}</Text>
                          <Text className="product-card-desc">{product.description}</Text>
                        </View>
                        <Icon name="ArrowRight" className="product-card-arrow" />
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className="product-state"><Text>当前分类暂无产品</Text></View>
                )}
                <View className="safe-bottom" />
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </AuthGate>
  );
}
