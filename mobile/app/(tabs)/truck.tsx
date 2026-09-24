import { SymbolView } from 'expo-symbols';
import { ScrollView } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function TruckScreen() {
  return (
    <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
      <Text className="text-3xl font-bold">Deliveries</Text>
      <Text className="mt-2 text-base text-gray-500">Track your active and completed deliveries.</Text>

      <View className="mt-8 gap-3">
        <View className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-blue-700">IN TRANSIT</Text>
            <Text className="text-sm text-gray-500">#LG-2048</Text>
          </View>
          <Text className="mt-4 text-base font-bold">Kigali Heights → Kimihurura</Text>
          <Text className="mt-1 text-sm text-gray-500">Estimated arrival: Today, 14:30</Text>
          <View className="mt-5 flex-row items-center">
            <SymbolView name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }} tintColor="#2563eb" size={18} />
            <Text className="ml-2 text-sm font-medium text-blue-700">Driver assigned</Text>
          </View>
        </View>

        <View className="flex-row items-center rounded-2xl border border-gray-200 px-5 py-5">
          <View className="mr-4 rounded-full bg-green-100 p-3">
            <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} tintColor="#16a34a" size={18} />
          </View>
          <View className="flex-1">
            <Text className="font-semibold">Delivered to Nyarutarama</Text>
            <Text className="mt-1 text-sm text-gray-500">Yesterday · #LG-2036</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
