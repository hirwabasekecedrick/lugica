import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';

import axios from 'axios';
import { Link, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

import {
  getRoleFromAccessToken,
  Login,
  Register,
  storeAuthTokens,
} from '@/lib/auth/auth_api';
import { Text, View } from '@/components/Themed';

const dashboardForRole = {
  ADMIN: '/dashboard/admin',
  DRIVER: '/dashboard/driver',
  CLIENT: '/(tabs)',
} as const;

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const normalizedPhone = phone.trim();

    if (!normalizedName || !normalizedEmail || !normalizedPhone || !password) {
      Toast.show({
        type: 'error',
        text1: 'Missing details',
        text2: 'Complete all fields to create your account.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await Register({
        email: normalizedEmail,
        password,
        name: normalizedName,
        phone: normalizedPhone,
      });

      const { accessToken, refreshToken } = await Login({
        email: normalizedEmail,
        password,
      });
      await storeAuthTokens(accessToken, refreshToken);
      router.replace(dashboardForRole[getRoleFromAccessToken(accessToken)]);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;

      Toast.show({
        type: 'error',
        text1: 'Unable to create account',
        text2:error instanceof Error ? error.message : (Array.isArray(message) ? message[0] : message) ?? 'Check your connection and details, then try again.',
      });
      console.log(error);
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      className="flex-1">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingBottom: 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold">Create your account</Text>
        <Text className="mt-2 text-base text-gray-500">Join us to get started.</Text>

        <View className="mt-10 gap-4">
          <View className="gap-2">
            <Text className="text-sm font-medium text-gray-700">Full name</Text>
            <View className="rounded-xl border border-gray-300 px-4 py-3">
              <TextInput
                className="text-base text-white"
                value={name}
                onChangeText={setName}
                placeholder="User Name"
                placeholderTextColor="#9ca3af"
                autoComplete="name"
              />
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-gray-700">Email</Text>
            <View className="rounded-xl border border-gray-300 px-4 py-3">
              <TextInput
                className="text-base text-white"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-gray-700">Phone</Text>
            <View className="rounded-xl border border-gray-300 px-4 py-3">
              <TextInput
                className="text-base text-white"
                value={phone}
                onChangeText={setPhone}
                placeholder="+250 700 000 000"
                placeholderTextColor="#9ca3af"
                autoComplete="tel"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-gray-700">Password</Text>
            <View className="flex-row items-center rounded-xl border border-gray-300 px-4 py-3">
              <TextInput
                className="flex-1 text-base text-white"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)}>
                <Text className="text-sm font-medium text-blue-500">
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            className={`mt-2 items-center rounded-xl bg-blue-500 py-3 ${
              isSubmitting ? 'opacity-60' : ''
            }`}
            disabled={isSubmitting}
            onPress={handleRegister}>
            <Text className="text-base font-semibold text-white">
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </Text>
          </Pressable>

          <Link href="/login" className="mt-4 text-center text-sm text-blue-500">
          <Text className="text-base text-center font-medium text-gray-500">
            Already have an account? Sign in
            </Text>
          </Link>
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
