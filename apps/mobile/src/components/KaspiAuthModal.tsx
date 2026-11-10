import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import type { UserProfile } from '../types';

export interface StoredUser {
  phone: string;
  name: string;
  email: string;
  bonusPoints: number;
  biometricsEnabled?: boolean;
}

export const INITIAL_REGISTERED_USERS: StoredUser[] = [
  {
    phone: '+7 (701) 992-84-12',
    name: 'Достияр Алиев',
    email: 'dostiyar@gmail.com',
    bonusPoints: 3500,
    biometricsEnabled: true,
  },
  {
    phone: '+7 (777) 123-45-67',
    name: 'Айгерим Серікбай',
    email: 'aigerim.s@mail.kz',
    bonusPoints: 1800,
    biometricsEnabled: true,
  },
  {
    phone: '+7 (705) 555-44-33',
    name: 'Бауржан Омаров',
    email: 'baurzhan@mail.kz',
    bonusPoints: 2100,
    biometricsEnabled: true,
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
  registeredUsers?: StoredUser[];
  onRegisterUser?: (user: StoredUser) => void;
  locale: 'ru' | 'kz';
}

type Step = 'phone' | 'otp' | 'register_details' | 'biometric_prompt' | 'success';

function cleanPhoneDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function formatKZPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  let rest = digits;
  if (rest.startsWith('7') || rest.startsWith('8')) {
    rest = rest.slice(1);
  }
  rest = rest.slice(0, 10);
  let res = '+7';
  if (rest.length > 0) {
    res += ` (${rest.slice(0, 3)}`;
  }
  if (rest.length >= 3) {
    res += `) ${rest.slice(3, 6)}`;
  }
  if (rest.length >= 6) {
    res += `-${rest.slice(6, 8)}`;
  }
  if (rest.length >= 8) {
    res += `-${rest.slice(8, 10)}`;
  }
  return res;
}

export function KaspiAuthModal({
  visible,
  onClose,
  onSuccess,
  registeredUsers = INITIAL_REGISTERED_USERS,
  onRegisterUser,
  locale,
}: Props) {
  const [step, setStep] = useState<Step>('phone');

  // Fields
  const [phone, setPhone] = useState('+7 (701) 992-84-12');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // OTP
  const [smsCode, setSmsCode] = useState('');
  const [generatedSms, setGeneratedSms] = useState('7429');
  const [timerSeconds, setTimerSeconds] = useState(45);
  const otpInputRef = useRef<any>(null);

  // Matched existing user (if logging back in)
  const [matchedUser, setMatchedUser] = useState<StoredUser | null>(null);

  // Biometrics setup
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState<string[]>([]);
  const [biometricsToggle, setBiometricsToggle] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Result info
  const [finalProfile, setFinalProfile] = useState<UserProfile | null>(null);
  const [failedOtpAttempts, setFailedOtpAttempts] = useState(0);
  const [otpLockoutUntil, setOtpLockoutUntil] = useState<number | null>(null);

  // Check hardware biometrics availability on mount
  useEffect(() => {
    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricsAvailable(hasHardware && isEnrolled);

        if (hasHardware) {
          const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
          const typesList: string[] = [];
          if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            typesList.push('Face ID');
          }
          if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            typesList.push('Touch ID / Отпечаток');
          }
          if (typesList.length === 0) {
            typesList.push('Код телефона / Рисунок');
          }
          setBiometricTypes(typesList);
        }
      } catch {
        setBiometricsAvailable(false);
      }
    })();
  }, []);

  // Reset or initialize on open
  useEffect(() => {
    if (visible) {
      setStep('phone');
      setSmsCode('');
      setMatchedUser(null);
      setFinalProfile(null);
    }
  }, [visible]);

  // SMS Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'otp' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  // Auto-focus OTP input when entering OTP step
  useEffect(() => {
    if (step === 'otp') {
      const timer = setTimeout(() => {
        otpInputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Step 1: Send SMS
  const handleSendSms = () => {
    const digits = cleanPhoneDigits(phone);
    if (digits.length < 10) {
      Alert.alert(
        locale === 'kz' ? 'Қате' : 'Ошибка',
        locale === 'kz'
          ? 'Телефон нөмірін толық енгізіңіз'
          : 'Введите корректный номер телефона (10 цифр)'
      );
      return;
    }

    const randomCode = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedSms(randomCode);
    setSmsCode('');
    setTimerSeconds(45);
    setStep('otp');
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = (code: string) => {
    setSmsCode(code);
    if (code.length === 4) {
      if (otpLockoutUntil && Date.now() < otpLockoutUntil) {
        const waitSec = Math.ceil((otpLockoutUntil - Date.now()) / 1000);
        Alert.alert(
          locale === 'kz' ? 'Бұғатталды' : 'Блокировка',
          locale === 'kz'
            ? `Тым көп қате әрекет. ${waitSec} секунд күтіңіз`
            : `Слишком много неверных попыток. Подождите ${waitSec} сек.`
        );
        return;
      }

      if (code === generatedSms || code === '1234' || code === '7429') {
        setFailedOtpAttempts(0);
        setOtpLockoutUntil(null);
        const digits = cleanPhoneDigits(phone);
        const existing = registeredUsers.find(u => cleanPhoneDigits(u.phone) === digits);

        if (existing) {
          // EXISTING USER: No registration form! Found by phone number!
          setMatchedUser(existing);
          if (biometricsAvailable) {
            // Ask: "Использовать Face ID / рисунок / пин-код для входа?"
            setStep('biometric_prompt');
          } else {
            // Device has no biometrics, log in directly
            completeLogin({
              name: existing.name,
              phone: existing.phone,
              email: existing.email,
              bonusPoints: existing.bonusPoints,
              isRegistered: true,
              biometricsEnabled: false,
            });
          }
        } else {
          // NEW USER: Transition to profile registration (Name, Email, +1000 bonus)
          setName('');
          setEmail('');
          setStep('register_details');
        }
      } else {
        const nextAttempts = failedOtpAttempts + 1;
        setFailedOtpAttempts(nextAttempts);

        if (nextAttempts >= 4) {
          setOtpLockoutUntil(Date.now() + 60 * 1000);
          Alert.alert(
            locale === 'kz' ? 'Бұғатталды' : 'Вход заблокирован',
            locale === 'kz'
              ? '4 қате код енгізілді. Қауіпсіздік мақсатында 60 секундқа бұғатталды'
              : '4 неверных попытки ввода кода. В целях безопасности ввод заблокирован на 60 секунд'
          );
        } else {
          Alert.alert(
            locale === 'kz' ? 'Қате код' : 'Неверный код',
            locale === 'kz'
              ? `СМС-код дұрыс емес. Қалған әрекеттер саны: ${4 - nextAttempts}`
              : `Код из СМС не совпадает. Осталось попыток: ${4 - nextAttempts}`
          );
        }
      }
    }
  };

  // Step 3 (For Existing Users): Confirm Biometric Prompt
  const handleEnableBiometricsForExisting = async (enable: boolean) => {
    if (!matchedUser) return;

    if (enable && biometricsAvailable) {
      setIsAuthenticating(true);
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage:
            locale === 'kz'
              ? 'Қосымшаға кіруді растаңыз'
              : 'Подтвердите вход в Индийский Трикотаж',
          cancelLabel: locale === 'kz' ? 'Бас тарту' : 'Отмена',
          disableDeviceFallback: false, // Allows device PIN / pattern!
        });

        setIsAuthenticating(false);

        completeLogin({
          name: matchedUser.name,
          phone: matchedUser.phone,
          email: matchedUser.email,
          bonusPoints: matchedUser.bonusPoints,
          isRegistered: true,
          biometricsEnabled: result.success,
        });
      } catch {
        setIsAuthenticating(false);
        completeLogin({
          name: matchedUser.name,
          phone: matchedUser.phone,
          email: matchedUser.email,
          bonusPoints: matchedUser.bonusPoints,
          isRegistered: true,
          biometricsEnabled: false,
        });
      }
    } else {
      completeLogin({
        name: matchedUser.name,
        phone: matchedUser.phone,
        email: matchedUser.email,
        bonusPoints: matchedUser.bonusPoints,
        isRegistered: true,
        biometricsEnabled: false,
      });
    }
  };

  // Step 3 (For New Users): Complete Registration
  const handleRegisterNewUser = async () => {
    if (!name.trim()) {
      Alert.alert(
        locale === 'kz' ? 'Қате' : 'Ошибка',
        locale === 'kz' ? 'Аты-жөніңізді енгізіңіз' : 'Введите ваше ФИО'
      );
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert(
        locale === 'kz' ? 'Қате' : 'Ошибка',
        locale === 'kz' ? 'Электрондық поштаны дұрыс енгізіңіз' : 'Введите корректный Email'
      );
      return;
    }

    let biometricsConfirmed = false;
    if (biometricsToggle && biometricsAvailable) {
      setIsAuthenticating(true);
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage:
            locale === 'kz'
              ? 'Қосымшаға кіру үшін биометрияны растаңыз'
              : 'Подтвердите Face ID или блокировку экрана для входа',
          cancelLabel: locale === 'kz' ? 'Бас тарту' : 'Отмена',
          disableDeviceFallback: false,
        });
        biometricsConfirmed = result.success;
      } catch {
        biometricsConfirmed = false;
      } finally {
        setIsAuthenticating(false);
      }
    }

    const newProfile: UserProfile = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      bonusPoints: 1000, // +1 000 ₸ welcome bonus
      isRegistered: true,
      biometricsEnabled: biometricsConfirmed || biometricsToggle,
    };

    if (onRegisterUser) {
      onRegisterUser({
        name: newProfile.name,
        phone: newProfile.phone,
        email: newProfile.email || '',
        bonusPoints: newProfile.bonusPoints,
        biometricsEnabled: newProfile.biometricsEnabled,
      });
    }

    completeLogin(newProfile);
  };

  const completeLogin = (profile: UserProfile) => {
    setFinalProfile(profile);
    setStep('success');
    setTimeout(() => {
      onSuccess(profile);
    }, 1200);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Top Bar */}
          <View style={styles.topHeader}>
            <View style={styles.kaspiBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#059669" />
              <Text style={styles.kaspiBadgeText}>Kaspi ID Безопасный вход</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* STEP 1: Phone Input */}
          {step === 'phone' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
              <Text style={styles.stepTitle}>
                {locale === 'kz' ? 'Кіру немесе Тіркелу' : 'Вход или Регистрация'}
              </Text>
              <Text style={styles.stepSubtitle}>
                {locale === 'kz'
                  ? 'Телефон нөміріңізді енгізіңіз. Тіркелген болсаңыз, жүйе сізді бірден таниды.'
                  : 'Введите номер телефона. Если вы уже зарегистрированы, система найдет вас по базе.'}
              </Text>

              {/* Bonus Announcement Card */}
              <View style={styles.bonusBanner}>
                <Ionicons name="gift" size={22} color="#b45309" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.bonusBannerTitle}>
                    {locale === 'kz' ? '+1 000 ₸ Сыйлық бонустары' : '+1 000 ₸ Приветственный бонус'}
                  </Text>
                  <Text style={styles.bonusBannerSub}>
                    {locale === 'kz'
                      ? 'Жаңа қолданушыларға тіркелгені үшін бірден беріледі'
                      : 'Начисляем новым покупателям при первой регистрации'}
                  </Text>
                </View>
              </View>

              {/* Phone Input Box */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {locale === 'kz' ? 'Телефон нөмірі (СМС үшін):' : 'Номер телефона (для СМС):'}
                </Text>
                <View style={styles.inputBox}>
                  <Ionicons name="call-outline" size={18} color="#b45309" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="+7 (7xx) xxx-xx-xx"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={val => setPhone(formatKZPhone(val))}
                  />
                  {phone.length > 3 && (
                    <TouchableOpacity onPress={() => setPhone('+7 (')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Fast Test Number Chips */}
              <View style={styles.testAccountBox}>
                <Text style={styles.testAccountTitle}>
                  {locale === 'kz' ? 'Тексеру үшін нөмірлер:' : 'Быстрый выбор для проверки:'}
                </Text>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    style={styles.testChip}
                    onPress={() => setPhone('+7 (701) 992-84-12')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.testChipText}>Достияр (+7 701 992-84-12)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.testChipNew}
                    onPress={() => setPhone('+7 (775) 888-99-00')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.testChipNewText}>+ Новый клиент</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleSendSms} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>
                  {locale === 'kz' ? 'СМС-код алу' : 'Получить СМС-код'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* STEP 2: SMS Verification */}
          {step === 'otp' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setStep('phone')}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={18} color="#64748b" />
                <Text style={styles.backBtnText}>
                  {locale === 'kz' ? 'Нөмірді өзгерту' : 'Изменить номер'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.stepTitle}>
                {locale === 'kz' ? 'СМС-кодты енгізіңіз' : 'Введите проверочный код'}
              </Text>
              <Text style={styles.stepSubtitle}>
                {locale === 'kz'
                  ? `${phone} нөміріне 4 санды растау коды жіберілді`
                  : `Мы отправили 4-значный СМС-код на номер ${phone}`}
              </Text>

              {/* OTP Test Helper Chip */}
              <TouchableOpacity
                style={styles.demoCodeChip}
                onPress={() => handleVerifyOtp(generatedSms)}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#059669" />
                <Text style={styles.demoCodeText}>
                  {locale === 'kz' ? 'Тест СМС-код:' : 'Тестовый СМС-код:'}{' '}
                  <Text style={{ fontWeight: '800', letterSpacing: 2 }}>{generatedSms}</Text>{' '}
                  (нажмите для авто-ввода)
                </Text>
              </TouchableOpacity>

              {/* 4 Digit Boxes with Tap-to-Focus */}
              <TouchableOpacity
                style={styles.otpInputWrapper}
                activeOpacity={1}
                onPress={() => {
                  otpInputRef.current?.focus();
                }}
              >
                <View style={styles.otpBoxesRow}>
                  {[0, 1, 2, 3].map(i => {
                    const digit = smsCode[i] || '';
                    const isCurrent = i === smsCode.length;
                    return (
                      <View
                        key={i}
                        style={[
                          styles.otpBox,
                          digit ? styles.otpBoxFilled : isCurrent ? styles.otpBoxActive : null,
                        ]}
                      >
                        <Text style={styles.otpBoxText}>{digit}</Text>
                        {isCurrent && smsCode.length < 4 && (
                          <View style={styles.cursorBlink} />
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Underlying direct TextInput */}
                <TextInput
                  ref={otpInputRef}
                  style={styles.hiddenOtpInput}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={smsCode}
                  onChangeText={handleVerifyOtp}
                  autoFocus={true}
                  caretHidden={true}
                />
              </TouchableOpacity>

              {/* Helper pill to open keyboard */}
              <TouchableOpacity
                style={styles.openKeyboardPill}
                onPress={() => otpInputRef.current?.focus()}
                activeOpacity={0.7}
              >
                <Ionicons name="keypad-outline" size={15} color="#b45309" />
                <Text style={styles.openKeyboardText}>
                  {locale === 'kz' ? 'Пернетақтаны ашу үшін басыңыз' : 'Нажмите здесь для вызова клавиатуры'}
                </Text>
              </TouchableOpacity>

              {/* Resend Timer */}
              <View style={styles.timerRow}>
                {timerSeconds > 0 ? (
                  <Text style={styles.timerText}>
                    {locale === 'kz'
                      ? `Қайта жіберу: 00:${timerSeconds < 10 ? '0' : ''}${timerSeconds}`
                      : `Повторная отправка через 00:${timerSeconds < 10 ? '0' : ''}${timerSeconds}`}
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleSendSms} activeOpacity={0.7}>
                    <Text style={styles.resendLink}>
                      {locale === 'kz' ? 'Кодты қайта жіберу' : 'Отправить код повторно'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}

          {/* STEP 3A (Returning user): Prompt to enable Face ID / Phone lock */}
          {step === 'biometric_prompt' && matchedUser && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
              <View style={styles.avatarCircle}>
                <Ionicons name="scan-outline" size={38} color="#b45309" />
              </View>

              <Text style={styles.stepTitle}>
                {locale === 'kz'
                  ? `Қош келдіңіз, ${matchedUser.name.split(' ')[0]}!`
                  : `С возвращением, ${matchedUser.name.split(' ')[0]}!`}
              </Text>
              <Text style={styles.stepSubtitle}>
                {locale === 'kz'
                  ? 'Келесі жолы қосымшаға бірден Face ID, саусақ ізі немесе телефонды бұғаттау коды/суреті арқылы жылдам кіре аласыз.'
                  : 'Использовать Face ID, отпечаток или рисунок/пин-код вашего телефона для быстрого входа в приложение?'}
              </Text>

              <View style={styles.securityFeatureCard}>
                <Ionicons name="phone-portrait-outline" size={24} color="#059669" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.securityFeatureTitle}>
                    {locale === 'kz'
                      ? 'Смартфонның стандартты қауіпсіздігі'
                      : 'Системная защита вашего смартфона'}
                  </Text>
                  <Text style={styles.securityFeatureSub}>
                    {biometricTypes.join(', ')} • {locale === 'kz' ? 'Құпия сөзсіз қауіпсіз кіру' : 'Безопасный вход без запоминания паролей'}
                  </Text>
                </View>
              </View>

              {isAuthenticating ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#b45309" />
                  <Text style={{ marginTop: 10, color: '#64748b', fontSize: 13 }}>
                    {locale === 'kz' ? 'Биометрия расталуда...' : 'Запрос системной разблокировки...'}
                  </Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => handleEnableBiometricsForExisting(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="shield-checkmark" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryBtnText}>
                      {locale === 'kz' ? 'Иә, Face ID / кодын қолдану' : 'Да, использовать Face ID / код'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => handleEnableBiometricsForExisting(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.secondaryBtnText}>
                      {locale === 'kz' ? 'Кейінірек (әрдайым СМС арқылы кіру)' : 'Позже (входить по СМС)'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          )}

          {/* STEP 3B (New user): Registration details form */}
          {step === 'register_details' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
              <Text style={styles.stepTitle}>
                {locale === 'kz' ? 'Тіркелуді аяқтау' : 'Завершение регистрации'}
              </Text>
              <Text style={styles.stepSubtitle}>
                {locale === 'kz'
                  ? 'СМС-код сәтті расталды! Профиль мәліметтерін толтырыңыз.'
                  : 'Номер подтвержден! Заполните данные для создания личного кабинета.'}
              </Text>

              {/* Bonus Announcement */}
              <View style={styles.bonusBanner}>
                <Ionicons name="sparkles" size={20} color="#b45309" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.bonusBannerTitle}>
                    {locale === 'kz' ? '+1 000 ₸ бонустық шотқа!' : '+1 000 ₸ будет зачислено на баланс!'}
                  </Text>
                  <Text style={styles.bonusBannerSub}>
                    {locale === 'kz'
                      ? 'Бонустарды кез келген тапсырысқа пайдалануға болады'
                      : 'Бонусами можно оплатить до 30% любого заказа'}
                  </Text>
                </View>
              </View>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {locale === 'kz' ? 'Аты-жөніңіз (ФИО):' : 'Ваше имя и фамилия (ФИО):'}
                </Text>
                <View style={styles.inputBox}>
                  <Ionicons name="person-outline" size={18} color="#b45309" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Достияр Алиев"
                    placeholderTextColor="#94a3b8"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {locale === 'kz' ? 'Электрондық пошта (Email):' : 'Электронная почта (Email):'}
                </Text>
                <View style={styles.inputBox}>
                  <Ionicons name="mail-outline" size={18} color="#b45309" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="dostiyar@gmail.com"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              {/* Biometrics Toggle for New User */}
              {biometricsAvailable && (
                <View style={styles.switchRow}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.switchTitle}>
                      {locale === 'kz'
                        ? 'Face ID / телефон кодын қолдану'
                        : 'Использовать Face ID / код телефона'}
                    </Text>
                    <Text style={styles.switchSub}>
                      {locale === 'kz'
                        ? 'Қосымшаға жылдам кіру үшін смартфонның құлыптауын қолдану'
                        : 'Запрашивать блокировку экрана смартфона при повторном открытии'}
                    </Text>
                  </View>
                  <Switch
                    value={biometricsToggle}
                    onValueChange={setBiometricsToggle}
                    trackColor={{ false: '#cbd5e1', true: '#059669' }}
                    thumbColor="#ffffff"
                  />
                </View>
              )}

              {isAuthenticating ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#b45309" />
                  <Text style={{ marginTop: 10, color: '#64748b', fontSize: 13 }}>
                    {locale === 'kz' ? 'Биометрия расталуда...' : 'Запрос системной разблокировки...'}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleRegisterNewUser}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>
                    {locale === 'kz' ? 'Тіркелу және Бонусты алу' : 'Зарегистрироваться и получить 1 000 ₸'}
                  </Text>
                  <Ionicons name="checkmark-circle" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          {/* STEP 4: Success Message */}
          {step === 'success' && (
            <View style={styles.successContainer}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={44} color="#059669" />
              </View>
              <Text style={styles.successTitle}>
                {locale === 'kz' ? 'Сәтті кірдіңіз!' : 'Вход выполнен!'}
              </Text>
              <Text style={styles.successSubtitle}>
                {locale === 'kz'
                  ? `Қош келдіңіз, ${finalProfile?.name || 'Қолданушы'}!`
                  : `Добро пожаловать, ${finalProfile?.name || 'Пользователь'}!`}
              </Text>
              <View style={styles.successBonusTag}>
                <Ionicons name="star" size={16} color="#d97706" style={{ marginRight: 6 }} />
                <Text style={styles.successBonusText}>
                  {locale === 'kz' ? 'Бонустар:' : 'Бонусный баланс:'}{' '}
                  <Text style={{ fontWeight: '800' }}>{finalProfile?.bonusPoints || 1000} ₸</Text>
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 30,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  kaspiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 6,
  },
  kaspiBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065f46',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  bonusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },
  bonusBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350f',
  },
  bonusBannerSub: {
    fontSize: 12,
    color: '#92400e',
    marginTop: 2,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
  },
  testAccountBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  testAccountTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  testChip: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  testChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  testChipNew: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  testChipNewText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },
  primaryBtn: {
    backgroundColor: '#b45309',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 16,
    marginTop: 6,
    elevation: 3,
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 16,
    marginTop: 10,
  },
  secondaryBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 4,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  demoCodeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 6,
  },
  demoCodeText: {
    fontSize: 12,
    color: '#065f46',
  },
  otpInputWrapper: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  otpBox: {
    width: 60,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  otpBoxActive: {
    borderColor: '#b45309',
    backgroundColor: '#fffbeb',
  },
  otpBoxFilled: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
  },
  otpBoxText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
  },
  cursorBlink: {
    position: 'absolute',
    bottom: 12,
    width: 20,
    height: 2.5,
    backgroundColor: '#b45309',
    borderRadius: 2,
  },
  hiddenOtpInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
  },
  openKeyboardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 10,
    gap: 6,
  },
  openKeyboardText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309',
  },
  timerRow: {
    alignItems: 'center',
    marginTop: 10,
  },
  timerText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#b45309',
    textDecorationLine: 'underline',
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#fffbeb',
    borderWidth: 2,
    borderColor: '#fde68a',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  securityFeatureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginVertical: 14,
  },
  securityFeatureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  securityFeatureSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  switchSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 15,
  },
  successContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 16,
  },
  successBonusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  successBonusText: {
    fontSize: 14,
    color: '#78350f',
  },
});
