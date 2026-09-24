import { SymbolView } from 'expo-symbols';
import { Tabs, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';

import Colors from '@/constants/Colors';
import { Logout } from '@/lib/auth/auth_api';
import { useColorScheme } from '@/components/useColorScheme';

type ActiveModal = 'search' | 'account' | null;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await Logout();
      setActiveModal(null);
      router.replace('/landing');
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Unable to log out',
        text2: 'Please try again.',
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme].tint,
          headerLeft: () => null,
          headerTitle: () => (
            <View style={styles.logoContainer}>
              <Image source={{ uri: 'logo.png' }} style={styles.logoImage} />
              <Text style={[styles.logoFallback, { color: Colors[colorScheme].text }]}>logo</Text>
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable onPress={() => setActiveModal('search')} hitSlop={10}>
                <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={Colors[colorScheme].text} size={22} />
              </Pressable>
              <Pressable onPress={() => setActiveModal('account')} hitSlop={10}>
                <SymbolView name={{ ios: 'person.circle', android: 'account_circle', web: 'account_circle' }} tintColor={Colors[colorScheme].text} size={24} />
              </Pressable>
            </View>
          ),
        }}>
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <SymbolView name={{ ios: 'house.fill', android: 'home', web: 'home' }} tintColor={color} size={24} /> }} />
        <Tabs.Screen name="cart" options={{ title: 'Cart', tabBarIcon: ({ color }) => <SymbolView name={{ ios: 'cart.fill', android: 'shopping_cart', web: 'shopping_cart' }} tintColor={color} size={24} /> }} />
        <Tabs.Screen name="truck" options={{ title: 'Deliveries', tabBarIcon: ({ color }) => <SymbolView name={{ ios: 'truck.box.fill', android: 'local_shipping', web: 'local_shipping' }} tintColor={color} size={24} /> }} />
        <Tabs.Screen name="two" options={{ href: null }} />
      </Tabs>

      <Modal visible={activeModal === 'search'} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Search</Text>
            <TextInput autoFocus placeholder="Search deliveries..." style={styles.searchInput} />
            <Pressable onPress={() => setActiveModal(null)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Close</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={activeModal === 'account'} transparent animationType="slide" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Account</Text>
            {['Profile', 'Settings', 'History'].map((item) => (
              <Pressable key={item} style={styles.menuItem} onPress={() => setActiveModal(null)}><Text style={styles.menuText}>{item}</Text></Pressable>
            ))}
            <Pressable disabled={isLoggingOut} onPress={handleLogout} style={styles.logoutButton}><Text style={styles.logoutText}>{isLoggingOut ? 'Logging out...' : 'Log out'}</Text></Pressable>
            <Pressable onPress={() => setActiveModal(null)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Close</Text></Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  logoContainer: { alignItems: 'center', justifyContent: 'center', minWidth: 80 },
  logoImage: { height: 24, position: 'absolute', width: 80 },
  logoFallback: { fontSize: 18, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 18, marginRight: 16 },
  modalBackdrop: { backgroundColor: 'rgba(0,0,0,0.45)', flex: 1, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { color: '#111827', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  searchInput: { borderColor: '#d1d5db', borderRadius: 12, borderWidth: 1, color: '#111827', padding: 14 },
  menuItem: { borderBottomColor: '#e5e7eb', borderBottomWidth: 1, paddingVertical: 16 },
  menuText: { color: '#111827', fontSize: 16 },
  logoutButton: { alignItems: 'center', backgroundColor: '#dc2626', borderRadius: 12, marginTop: 20, padding: 14 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { alignItems: 'center', padding: 14 },
  secondaryButtonText: { color: '#2563eb', fontSize: 16, fontWeight: '600' },
});
