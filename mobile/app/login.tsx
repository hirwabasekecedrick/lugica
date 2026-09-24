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
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";

import { Text, View } from "@/components/Themed";
import {
  getRoleFromAccessToken,
  Login,
  Register,
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
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpStep, setSignUpStep] = useState<1 | 2>(1);
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

  const toggleSignUp = () => {
    setIsSignUp((current) => !current);
    setSignUpStep(1);
  };

  const handleRegistration = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();
    const normalizedPhone = phone.trim();

    if (!normalizedEmail || !password || !normalizedName || !normalizedPhone) {
      shakeForm();
      Toast.show({
        type: "error",
        text1: "Missing details",
        text2: "Complete every field to create your account.",
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
        type: "error",
        text1: "Unable to create account",
        text2:
          error instanceof Error
            ? error.message
            : (Array.isArray(message) ? message[0] : message) ??
              "Check your details and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
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
      className="flex-1 bg-[#0b1324]"
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
          className="flex-1 justify-center rounded-[28px] border border-[#2c426f] bg-[#131d33] px-6 py-8"
          style={{ transform: [{ translateX: formShake }] }}
        >
          <Text className="text-center text-3xl font-extrabold text-white">
            {isSignUp ? "Start tracking your shipments." : "Track deliveries in real-time."}
          </Text>
          <Text className="mt-2 text-center text-sm text-slate-300">
            {isSignUp
              ? signUpStep === 1
                ? "Step 1 of 2: Personal details"
                : "Step 2 of 2: Account security"
              : "Sign in to track your live driver location"}
          </Text>

          {isSignUp && (
            <View className="mt-5 flex-row justify-center gap-2">
              <View className={`h-1.5 rounded-full ${signUpStep === 1 ? "w-8 bg-lime-300" : "w-2 bg-slate-600"}`} />
              <View className={`h-1.5 rounded-full ${signUpStep === 2 ? "w-8 bg-lime-300" : "w-2 bg-slate-600"}`} />
            </View>
          )}

          <View className="mt-8 gap-4">
            {isSignUp && signUpStep === 1 ? (
              <>
                <View className="gap-2">
                  <Text className="text-sm font-medium text-slate-300">Full name</Text>
                  <View className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3">
                    <TextInput
                      className="text-base text-white"
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="John Doe"
                      placeholderTextColor="#6984A9"
                      autoComplete="name"
                    />
                  </View>
                </View>
                <View className="gap-2">
                  <Text className="text-sm font-medium text-slate-300">Telephone number</Text>
                  <View className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3">
                    <TextInput
                      className="text-base text-white"
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="+250 700 000 000"
                      placeholderTextColor="#6984A9"
                      autoComplete="tel"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
                <Pressable
                  className="items-center rounded-xl bg-lime-300 py-4"
                  onPress={() => {
                    if (!fullName.trim() || !phone.trim()) {
                      shakeForm();
                      Toast.show({ type: "error", text1: "Missing details", text2: "Enter your name and telephone number." });
                      return;
                    }
                    setSignUpStep(2);
                  }}
                >
                  <Text className="font-bold text-slate-900">Next</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View className="gap-2">
                  <Text className="text-sm font-medium text-slate-300">Client / business email</Text>
                  <View className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3">
                    <TextInput
                      className="text-base text-white"
                      value={email}
                      onChangeText={setEmail}
                      placeholder="client@delivery.com"
                      placeholderTextColor="#6984A9"
                      autoCapitalize="none"
                      autoComplete="email"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View className="gap-2">
                  <Text className="text-sm font-medium text-slate-300">Password</Text>
                  <View className="flex-row items-center rounded-xl border border-slate-600 bg-slate-800 px-4 py-3">
                    <TextInput
                      className="flex-1 text-base text-white"
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#6984A9"
                      secureTextEntry={!showPassword}
                      onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 250)}
                    />
                    <Pressable onPress={() => setShowPassword((value) => !value)}>
                      <Text className="text-sm font-semibold text-lime-300">{showPassword ? "Hide" : "Show"}</Text>
                    </Pressable>
                  </View>
                </View>

                <View className="flex-row gap-2">
                  {isSignUp && (
                    <Pressable className="flex-1 items-center rounded-xl border border-slate-600 bg-slate-800 py-4" onPress={() => setSignUpStep(1)}>
                      <Text className="font-medium text-white">Back</Text>
                    </Pressable>
                  )}
                  <Pressable
                    className={`items-center rounded-xl bg-lime-300 py-4 ${isSignUp ? "flex-[2]" : "flex-1"} ${isSubmitting ? "opacity-60" : ""}`}
                    disabled={isSubmitting}
                    onPress={isSignUp ? handleRegistration : handleLogin}
                  >
                    <Text className="font-bold text-slate-900">
                      {isSubmitting ? (isSignUp ? "Creating account..." : "Signing in...") : isSignUp ? "Create account" : "Sign in"}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

            {!isSignUp && <View className="h-px bg-slate-700" />}

            <Pressable className="items-center rounded-xl border border-slate-600 bg-slate-800 py-4" onPress={() => Toast.show({ type: "info", text1: "Google sign-in", text2: "Google authentication is not connected yet." })}>
              <Text className="font-medium text-white">Continue with Google</Text>
            </Pressable>

            <Pressable onPress={toggleSignUp}>
              <Text className="text-center text-sm text-slate-300">
                {isSignUp ? "Already registered? " : "Don't have a tracking account? "}
                <Text className="font-semibold text-lime-300">{isSignUp ? "Sign in" : "Sign up"}</Text>
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
