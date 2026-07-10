import { Button, ScrollView, Text, View } from '@tarojs/components';
import { Agreement } from '../types';

export default function AgreementModal({
  visible,
  agreements,
  onClose,
  onAgree,
}: {
  visible: boolean;
  agreements: Agreement;
  onClose: () => void;
  onAgree: () => void;
}) {
  if (!visible) return null;

  const blocks = [...agreements.serviceAgreement.contents, ...agreements.privacyPolicy.contents];

  return (
    <View className="agreement-mask">
      <View className="agreement-panel">
        <View className="agreement-head">
          <Text className="agreement-title">服务协议与隐私条款</Text>
          <Text className="agreement-close" onClick={onClose}>×</Text>
        </View>
        <ScrollView scrollY className="agreement-body">
          {blocks.map(block => (
            <View key={block.title} className="agreement-block">
              <Text className="agreement-subtitle">{block.title}</Text>
              <Text className="agreement-copy">{block.content}</Text>
            </View>
          ))}
        </ScrollView>
        <Button className="primary-btn agreement-action" onClick={() => { onAgree(); onClose(); }}>同意并继续</Button>
      </View>
    </View>
  );
}
