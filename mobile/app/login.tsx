import { useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  Vibration,
} from "react-native";

import axios from "axios";
import { Link, useRouter } from "expo-router";
import Toast from "react-native-toast-message";

import { Text, View } from "@/components/Themed";
import {
  getRoleFromAccessToken,
  Login,
  storeAuthTokens,
} from "@/lib/auth/auth_api";

const dashboardForRole = {
  ADMIN: "/dashboard/admin",
  DRIVER: "/dashboard/driver",
  CLIENT: "/(tabs)",
} as const;

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const formShake = useRef(new Animated.Value(0)).current;

  const shakeForm = () => {
    Vibration.vibrate(100);
    Animated.sequence([
      Animated.timing(formShake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(formShake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(formShake, { toValue: -7, duration: 50, useNativeDriver: true }),
      Animated.timing(formShake, { toValue: 7, duration: 50, useNativeDriver: true }),
      Animated.timing(formShake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      shakeForm();
      Toast.show({
        type: "error",
        text1: "Missing details",
        text2: "Enter your email and password to continue.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
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
        type: "error",
        text1: "Unable to sign in",
        text2:error instanceof Error ? error.message : (Array.isArray(message) ? message[0] : message) ?? 'Check your connection and details, then try again.', 
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      className="flex-1"
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingBottom: 180,
        }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          className="flex-1 justify-center px-6"
          style={{ transform: [{ translateX: formShake }] }}
        >
          <Text className="text-3xl font-bold">Welcome back</Text>
          <Text className="mt-2 text-base text-gray-500">
            Sign in to continue.
          </Text>

          <View className="mt-10 gap-4">
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
              <Text className="text-sm font-medium text-gray-700">
                Password
              </Text>
              <View className="flex-row items-center rounded-xl border border-gray-300 px-4 py-3">
                <TextInput
                  className="flex-1 text-base text-white"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 250);
                  }}
                />
                <Pressable onPress={() => setShowPassword((v) => !v)}>
                  <Text className="text-sm font-medium text-blue-500">
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              className={`mt-2 items-center rounded-xl bg-blue-500 py-5 ${
                isSubmitting ? "opacity-60" : ""
              }`}
              disabled={isSubmitting}
              onPress={handleLogin}
            >
              <Text className="text-base font-semibold text-white">
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Text>
            </Pressable>

            <Link
              href="/register"
              className="mt-2 text-center text-lg text-white text-base"
            >
              <Text className="text-base text-center font-medium text-gray-500">
              Don&apos;t have an account? Create one
              </Text>
            </Link>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
