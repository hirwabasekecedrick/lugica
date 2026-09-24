import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, TextInput } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function CartScreen() {
  return (
    <ScrollView className="flex-1" contentContainerClassName="px-6 pb-10 pt-6">
      <Text className="text-3xl font-bold">New delivery</Text>
      <Text className="mt-2 text-base text-gray-500">Tell us where it needs to go.</Text>

      <Text className="mt-8 text-sm font-semibold text-gray-700">Pickup</Text>
      <View className="mt-2 flex-row items-center rounded-xl border border-gray-200 px-4">
        <SymbolView name={{ ios: 'circle.fill', android: 'radio_button_checked', web: 'radio_button_checked' }} tintColor="#2563eb" size={14} />
        <TextInput className="ml-3 flex-1 py-4 text-base text-gray-900" placeholder="Pickup address" placeholderTextColor="#9ca3af" />
      </View>

      <Text className="mt-6 text-sm font-semibold text-gray-700">Drop-off</Text>
      <View className="mt-2 flex-row items-center rounded-xl border border-gray-200 px-4">
        <SymbolView name={{ ios: 'mappin.circle.fill', android: 'location_on', web: 'location_on' }} tintColor="#dc2626" size={18} />
        <TextInput className="ml-3 flex-1 py-4 text-base text-gray-900" placeholder="Drop-off address" placeholderTextColor="#9ca3af" />
      </View>

      <Text className="mt-6 text-sm font-semibold text-gray-700">Package details</Text>
      <View className="mt-2 rounded-xl border border-gray-200 px-4 py-4">
        <TextInput className="text-base text-gray-900" placeholder="What are you sending?" placeholderTextColor="#9ca3af" />
      </View>

      <Pressable className="mt-8 items-center rounded-xl bg-blue-600 py-4 active:opacity-80">
        <Text className="font-semibold text-white">Request delivery</Text>
      </Pressable>
    </ScrollView>
  );
}
