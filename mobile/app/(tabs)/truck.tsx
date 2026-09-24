import { Text, View } from '@/components/Themed';

export default function TruckScreen() {
  return (
    <View className="flex-1 px-6 pt-8">
      <Text className="text-3xl font-bold">Deliveries</Text>
      <Text className="mt-2 text-base text-gray-500">
        Track your active and completed deliveries.
      </Text>
    </View>
  );
}
