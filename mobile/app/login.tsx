import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';

import { Link } from 'expo-router';

import { Text, View } from '@/components/Themed';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold">Welcome back</Text>
        <Text className="mt-2 text-base text-gray-500">Sign in to continue.</Text>

        <View className="mt-10 gap-4">
          <View className="gap-2">
            <Text className="text-sm font-medium text-gray-700">Email</Text>
            <View className="rounded-xl border border-gray-300 px-4 py-3">
              <TextInput
                className="text-base"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-gray-700">Password</Text>
            <View className="flex-row items-center rounded-xl border border-gray-300 px-4 py-3">
              <TextInput
                className="flex-1 text-base"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)}>
                <Text className="text-sm font-medium text-blue-500">
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable className="mt-2 items-center rounded-xl bg-blue-500 py-3">
            <Text className="text-base font-semibold text-white">Sign in</Text>
          </Pressable>

          <Link href="/register" className="mt-4 text-center text-sm text-blue-500">
            Don&apos;t have an account? Create one
          </Link>
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
