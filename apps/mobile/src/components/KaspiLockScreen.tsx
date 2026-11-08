import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import type { UserProfile } from '../types';

interface Props {
  userProfile: UserProfile;
  onUnlock: () => void;
  onSwitchAccount: () => void;
  locale: 'ru' | 'kz';
}

function maskPhoneNumber(phone: string): string {
  // Format +7 (701) •••-••-12
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    const code = digits.slice(-10, -7);
    const last2 = digits.slice(-2);
    return `+7 (${code}) •••-••-${last2}`;
  }
  return phone;
}

export function KaspiLockScreen({ userProfile, onUnlock, onSwitchAccount, locale }: Props) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Auto trigger biometrics / phone screen lock when screen appears
  useEffect(() => {
    handleSystemUnlock();
  }, []);

  const handleSystemUnlock = async () => {
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        // Fallback or no lock set on device
        setIsAuthenticating(false);
        onUnlock();
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage:
          locale === 'kz'
            ? 'Индийский Трикотаж қосымшасына кіру'
            : 'Вход в Индийский Трикотаж',
        cancelLabel: locale === 'kz' ? 'Бас тарту' : 'Отмена',
        disableDeviceFallback: false, // Uses device PIN / pattern if biometrics fails!
      });

      setIsAuthenticating(false);

      if (result.success) {
        onUnlock();
      } else {
        if (result.error !== 'user_cancel') {
          setAuthError(
            locale === 'kz'
              ? 'Растау орындалмады. Қайталап көріңіз'
              : 'Подтверждение не выполнено. Попробуйте еще раз'
          );
        }
      }
    } catch {
      setIsAuthenticating(false);
      // If error occurs, let user try again via button
    }
  };

  const initials = userProfile.name
    ? userProfile.name
        .split(' ')
        .map(p => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'ИТ';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Top Header Badge */}
        <View style={styles.headerBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#059669" />
          <Text style={styles.headerBadgeText}>Kaspi ID Безопасность</Text>
        </View>

        {/* User Card */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={styles.greeting}>
            {locale === 'kz'
              ? `Қайырлы күн, ${userProfile.name.split(' ')[0]}!`
              : `Здравствуйте, ${userProfile.name.split(' ')[0]}!`}
          </Text>

          <Text style={styles.maskedPhone}>{maskPhoneNumber(userProfile.phone)}</Text>

          <View style={styles.bonusTag}>
            <Ionicons name="star" size={14} color="#d97706" style={{ marginRight: 4 }} />
            <Text style={styles.bonusText}>
              {locale === 'kz' ? 'Бонустық шот:' : 'Бонусный баланс:'}{' '}
              <Text style={{ fontWeight: '800' }}>{userProfile.bonusPoints} ₸</Text>
            </Text>
          </View>
        </View>

        {/* Unlock Action Center */}
        <View style={styles.actionCenter}>
          <TouchableOpacity
            style={styles.biometricCircleBtn}
            onPress={handleSystemUnlock}
            activeOpacity={0.8}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <ActivityIndicator size="large" color="#b45309" />
            ) : (
              <Ionicons name="scan-circle" size={88} color="#b45309" />
            )}
          </TouchableOpacity>

          <Text style={styles.promptText}>
            {locale === 'kz'
              ? 'Face ID немесе телефонды бұғаттау кодымен кіру'
              : 'Вход по Face ID или коду разблокировки телефона'}
          </Text>

          {authError && <Text style={styles.errorText}>{authError}</Text>}

          <TouchableOpacity
            style={styles.unlockBtn}
            onPress={handleSystemUnlock}
            activeOpacity={0.85}
          >
            <Ionicons name="lock-open-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.unlockBtnText}>
              {locale === 'kz' ? 'Қайта растау' : 'Разблокировать'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Actions */}
        <View style={styles.footerSection}>
          <TouchableOpacity
            style={styles.switchAccountBtn}
            onPress={onSwitchAccount}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={16} color="#64748b" style={{ marginRight: 6 }} />
            <Text style={styles.switchAccountText}>
              {locale === 'kz' ? 'Басқа нөмірмен кіру' : 'Войти под другим номером'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  headerBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
  },
  userSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#fffbeb',
    borderWidth: 3,
    borderColor: '#fde68a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#b45309',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  maskedPhone: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
  },
  bonusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  bonusText: {
    fontSize: 13,
    color: '#78350f',
  },
  actionCenter: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  biometricCircleBtn: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  promptText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#b45309',
    paddingHorizontal: 28,
    height: 48,
    borderRadius: 14,
    elevation: 2,
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  unlockBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  footerSection: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  switchAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  switchAccountText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
});
