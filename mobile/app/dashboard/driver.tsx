import { Text, View } from '@/components/Themed';

export default function DriverDashboard() {
  return (
    <View className="flex-1 justify-center px-6">
      <Text className="text-3xl font-bold">Driver dashboard</Text>
      <Text className="mt-2 text-base text-gray-500">
        View your assigned deliveries and vehicle status.
      </Text>
    </View>
  );
}
