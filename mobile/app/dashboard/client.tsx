import { Text, View } from '@/components/Themed';

export default function ClientDashboard() {
  return (
    <View className="flex-1 justify-center px-6">
      <Text className="text-3xl font-bold">Client dashboard</Text>
      <Text className="mt-2 text-base text-gray-500">
        Create deliveries and track your shipments.
      </Text>
    </View>
  );
}
