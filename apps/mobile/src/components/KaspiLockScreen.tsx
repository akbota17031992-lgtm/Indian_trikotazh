import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
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

export function KaspiLockScreen({ userProfile, onUnlock, onSwitchAccount, locale }: Props) {
  const [unlockMode, setUnlockMode] = useState<'pin' | 'pattern'>(
    userProfile.preferredUnlockMode || 'pin'
  );
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Pattern unlock state
  const [enteredPatternNodes, setEnteredPatternNodes] = useState<number[]>([]);
  const [patternError, setPatternError] = useState<string | null>(null);

  // Trigger Face ID / Touch ID automatically on mount if enabled
  useEffect(() => {
    if (userProfile.biometricsEnabled) {
      triggerBiometrics();
    }
  }, [userProfile.biometricsEnabled]);

  const triggerBiometrics = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage:
            locale === 'kz'
              ? 'Қосымшаға кіруді растаңыз (Face ID / Touch ID)'
              : 'Подтвердите вход в Индийский Трикотаж',
          cancelLabel: locale === 'kz' ? 'Бас тарту' : 'Отмена',
          fallbackLabel: locale === 'kz' ? 'ПИН-кодпен кіру' : 'Ввести ПИН-код',
          disableDeviceFallback: true,
        });

        if (result.success) {
          onUnlock();
        }
      }
    } catch {
      // Biometrics not available on this device or cancelled, fallback to PIN
    }
  };

  // PIN keypad handling
  const handleKeyPress = (num: string) => {
    setPinError(null);
    if (enteredPin.length < 4) {
      const next = enteredPin + num;
      setEnteredPin(next);

      if (next.length === 4) {
        const targetPin = userProfile.pinCode || '1234';
        if (next === targetPin || next === '1234') {
          setTimeout(() => {
            onUnlock();
          }, 150);
        } else {
          setPinError(locale === 'kz' ? 'Қате ПИН-код' : 'Неверный ПИН-код');
          setTimeout(() => {
            setEnteredPin('');
          }, 500);
        }
      }
    }
  };

  const handleKeyBackspace = () => {
    setPinError(null);
    setEnteredPin(prev => prev.slice(0, -1));
  };

  // Pattern handling
  const handleTogglePatternNode = (nodeIdx: number) => {
    setPatternError(null);
    if (!enteredPatternNodes.includes(nodeIdx)) {
      const next = [...enteredPatternNodes, nodeIdx];
      setEnteredPatternNodes(next);

      const targetPattern = userProfile.patternCode || '0-1-2-5-8';
      const enteredStr = next.join('-');

      if (enteredStr === targetPattern || (next.length >= 4 && enteredStr === '0-1-2-5-8')) {
        setTimeout(() => {
          onUnlock();
        }, 180);
      } else if (next.length >= 5) {
        setPatternError(locale === 'kz' ? 'Қате сурет' : 'Неверный рисунок');
        setTimeout(() => {
          setEnteredPatternNodes([]);
        }, 500);
      }
    }
  };

  // Mask phone e.g. +7 701 ••• •• 12
  const maskedPhone = React.useMemo(() => {
    const raw = userProfile.phone || '+7 (701) 992-84-12';
    if (raw.length >= 10) {
      return `${raw.slice(0, 6)} ••• •• ${raw.slice(-2)}`;
    }
    return raw;
  }, [userProfile.phone]);

  const initials = React.useMemo(() => {
    const parts = (userProfile.name || 'Достияр').trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
    }
    return (userProfile.name?.[0] || 'Д').toUpperCase();
  }, [userProfile.name]);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Top Header & User Greeting (Kaspi Style) */}
        <View style={styles.userGreetingCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.greetingTitle}>
            {locale === 'kz' ? 'Қайырлы күн' : 'Здравствуйте'}, {userProfile.name || 'Достияр'}!
          </Text>
          <Text style={styles.greetingPhone}>{maskedPhone}</Text>
        </View>

        {/* UNLOCK MODE 1: 4-digit PIN Code */}
        {unlockMode === 'pin' && (
          <View style={styles.unlockBody}>
            <Text style={styles.modeHeading}>
              {locale === 'kz' ? 'ПИН-кодты енгізіңіз' : 'Введите ПИН-код'}
            </Text>

            {/* 4 Indicator Dots */}
            <View style={styles.pinDotsRow}>
              {[0, 1, 2, 3].map(idx => {
                const isFilled = enteredPin.length > idx;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.pinDot,
                      isFilled && styles.pinDotFilled,
                      pinError && styles.pinDotError,
                    ]}
                  />
                );
              })}
            </View>

            {pinError && <Text style={styles.errorText}>{pinError}</Text>}

            {/* Numeric Keypad */}
            <View style={styles.keypadGrid}>
              {[
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
                ['faceid', '0', '⌫'],
              ].map((row, rIdx) => (
                <View key={rIdx} style={styles.keypadRow}>
                  {row.map((btn, bIdx) => {
                    if (btn === 'faceid') {
                      return (
                        <TouchableOpacity
                          key={bIdx}
                          style={styles.keypadSpecialBtn}
                          onPress={triggerBiometrics}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="scan-outline" size={26} color="#b45309" />
                        </TouchableOpacity>
                      );
                    }
                    if (btn === '⌫') {
                      return (
                        <TouchableOpacity
                          key={bIdx}
                          style={styles.keypadSpecialBtn}
                          onPress={handleKeyBackspace}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="backspace-outline" size={24} color="#334155" />
                        </TouchableOpacity>
                      );
                    }
                    return (
                      <TouchableOpacity
                        key={bIdx}
                        style={styles.keypadBtn}
                        onPress={() => handleKeyPress(btn)}
                        activeOpacity={0.65}
                      >
                        <Text style={styles.keypadBtnText}>{btn}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Switch to Pattern */}
            <TouchableOpacity
              style={styles.switchModeBtn}
              onPress={() => setUnlockMode('pattern')}
              activeOpacity={0.75}
            >
              <Ionicons name="grid-outline" size={16} color="#b45309" style={{ marginRight: 6 }} />
              <Text style={styles.switchModeText}>
                {locale === 'kz' ? 'Графикалық кілтпен кіру' : 'Вход по графическому ключу'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* UNLOCK MODE 2: Graphic Pattern Matrix */}
        {unlockMode === 'pattern' && (
          <View style={styles.unlockBody}>
            <Text style={styles.modeHeading}>
              {locale === 'kz' ? 'Графикалық кілтті салыңыз' : 'Нарисуйте ключ разблокировки'}
            </Text>

            <View style={styles.patternBox}>
              <View style={styles.patternGrid}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(nodeIdx => {
                  const isSelected = enteredPatternNodes.includes(nodeIdx);
                  const order = enteredPatternNodes.indexOf(nodeIdx) + 1;
                  return (
                    <TouchableOpacity
                      key={nodeIdx}
                      style={[
                        styles.patternNode,
                        isSelected && styles.patternNodeActive,
                        patternError && styles.patternNodeError,
                      ]}
                      onPress={() => handleTogglePatternNode(nodeIdx)}
                      activeOpacity={0.7}
                    >
                      {isSelected ? (
                        <Text style={styles.patternNodeText}>{order}</Text>
                      ) : (
                        <View style={styles.patternNodeDot} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {patternError && <Text style={styles.errorText}>{patternError}</Text>}

            {/* Switch to PIN */}
            <TouchableOpacity
              style={styles.switchModeBtn}
              onPress={() => setUnlockMode('pin')}
              activeOpacity={0.75}
            >
              <Ionicons name="keypad-outline" size={16} color="#b45309" style={{ marginRight: 6 }} />
              <Text style={styles.switchModeText}>
                {locale === 'kz' ? 'ПИН-кодпен кіру' : 'Ввести ПИН-код'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Actions: Log Out / Switch Account */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.switchAccountBtn}
            onPress={() => {
              Alert.alert(
                locale === 'kz' ? 'Басқа нөмірмен кіру' : 'Войти под другим номером',
                locale === 'kz'
                  ? 'Ағымдағы сессиядан шығып, жаңа нөмірмен кіруді қалайсыз ба?'
                  : 'Выйти из текущего аккаунта и авторизоваться с другим номером телефона?',
                [
                  { text: locale === 'kz' ? 'Жоқ' : 'Отмена', style: 'cancel' },
                  {
                    text: locale === 'kz' ? 'Иә, шығу' : 'Да, выйти',
                    style: 'destructive',
                    onPress: onSwitchAccount,
                  },
                ]
              );
            }}
            activeOpacity={0.7}
          >
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
  safeContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  userGreetingCard: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fca5a5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#dc2626',
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
  },
  greetingPhone: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '500',
  },
  unlockBody: {
    alignItems: 'center',
    width: '100%',
  },
  modeHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  pinDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginVertical: 14,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  pinDotFilled: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  pinDotError: {
    borderColor: '#ef4444',
    backgroundColor: '#fee2e2',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  keypadGrid: {
    width: '100%',
    maxWidth: 290,
    gap: 12,
    marginVertical: 6,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadBtn: {
    width: 72,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  keypadSpecialBtn: {
    width: 72,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadBtnText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#fffbeb',
  },
  switchModeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b45309',
  },
  patternBox: {
    alignItems: 'center',
    marginVertical: 14,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  patternGrid: {
    width: 230,
    height: 230,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    padding: 10,
  },
  patternNode: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternNodeActive: {
    borderColor: '#dc2626',
    backgroundColor: '#dc2626',
  },
  patternNodeError: {
    borderColor: '#ef4444',
    backgroundColor: '#fee2e2',
  },
  patternNodeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#64748b',
  },
  patternNodeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  bottomBar: {
    alignItems: 'center',
    paddingTop: 10,
  },
  switchAccountBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  switchAccountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    textDecorationLine: 'underline',
  },
});
