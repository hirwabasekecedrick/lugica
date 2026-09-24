import { SymbolView } from 'expo-symbols';
import { Link } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
      <Text className="text-sm font-medium text-gray-500">Good morning</Text>
      <Text className="mt-1 text-3xl font-bold">Where are we going?</Text>

      <Link href="/(tabs)/cart" asChild>
        <Pressable className="mt-8 flex-row items-center justify-between rounded-2xl bg-blue-600 px-5 py-5 active:opacity-80">
          <View className="flex-1 bg-transparent">
            <Text className="text-lg font-bold text-white">Create a delivery</Text>
            <Text className="mt-1 text-sm text-blue-100">Send something across town.</Text>
          </View>
          <SymbolView name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} tintColor="#fff" size={24} />
        </Pressable>
      </Link>

      <Text className="mt-9 text-lg font-bold">Active delivery</Text>
      <View className="mt-3 rounded-2xl border border-gray-200 px-5 py-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-blue-600">IN TRANSIT</Text>
          <Text className="text-sm text-gray-500">#LG-2048</Text>
        </View>
        <Text className="mt-4 text-base font-semibold">Kigali Heights</Text>
        <Text className="mt-1 text-sm text-gray-500">to Kimihurura · Arriving today</Text>
        <View className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
          <View className="h-full w-3/5 rounded-full bg-blue-600" />
        </View>
        <Text className="mt-2 text-xs text-gray-500">Driver is on the way</Text>
      </View>

      <Text className="mt-9 text-lg font-bold">Recent activity</Text>
      <View className="mt-3 gap-3">
        <View className="flex-row items-center rounded-xl border border-gray-200 px-4 py-4">
          <View className="mr-4 rounded-full bg-green-100 p-3">
            <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} tintColor="#16a34a" size={18} />
          </View>
          <View className="flex-1">
            <Text className="font-semibold">Delivery completed</Text>
            <Text className="mt-1 text-sm text-gray-500">Yesterday · #LG-2036</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
