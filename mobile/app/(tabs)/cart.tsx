import { Text, View } from '@/components/Themed';

export default function CartScreen() {
  return (
    <View className="flex-1 px-6 pt-8">
      <Text className="text-3xl font-bold">Your cart</Text>
      <Text className="mt-2 text-base text-gray-500">
        Review items before creating a delivery.
      </Text>
    </View>
  );
}
