import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LandingScreen() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-1 justify-center px-8">
        <Text className="text-5xl font-extrabold tracking-tight text-slate-900">
          Lugica
        </Text>
        <Text className="mt-3 text-lg leading-7 text-slate-500">
          Your brass instruments, tracked.
        </Text>
      </View>

      <View className="px-8 pb-10">
        <Link href="/login" asChild>
          <Pressable className="items-center rounded-2xl bg-slate-900 py-4 active:opacity-80">
            <Text className="text-lg font-semibold text-white">Get started</Text>
          </Pressable>
        </Link>

        <View className="mt-4 flex-row justify-center gap-4 space-x-6">
          <Link href="/login" asChild>
            <Pressable className="py-2 active:opacity-60">
              <Text className="text-base font-medium text-slate-900">
                Dont have an account?
              </Text>
            </Pressable>
          </Link>
          <Link href="/register" asChild>
            <Pressable className="py-2 active:opacity-60">
              <Text className="text-base font-medium text-slate-500">
                Create account
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}