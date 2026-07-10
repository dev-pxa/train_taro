import { Image, Swiper, SwiperItem, View } from '@tarojs/components';
import { CarouselItem } from '../types';

export default function Carousel({ interval, items, onPress }: { interval: number; items: CarouselItem[]; onPress?: (jumpUrl: string) => void }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <Swiper className="banner-swiper" indicatorDots autoplay circular interval={interval * 1000}>
      {items.map(item => (
        <SwiperItem key={item.id}>
          <View className="banner-item" onClick={() => onPress?.(item.jumpUrl)}>
            <Image className="banner-image" src={item.imageUrl} mode="aspectFill" />
          </View>
        </SwiperItem>
      ))}
    </Swiper>
  );
}
