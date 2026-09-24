import { Text, View } from '@/components/Themed';

export default function AdminDashboard() {
  return (
    <View className="flex-1 justify-center px-6">
      <Text className="text-3xl font-bold">Admin dashboard</Text>
      <Text className="mt-2 text-base text-gray-500">
        Manage Lugica operations and users.
      </Text>
    </View>
  );
}
