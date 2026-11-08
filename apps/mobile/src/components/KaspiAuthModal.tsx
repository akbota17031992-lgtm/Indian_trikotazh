import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import type { UserProfile } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
  locale: 'ru' | 'kz';
}

type AuthStep = 'register' | 'sms' | 'set_pin' | 'confirm_pin' | 'set_pattern' | 'quick_security' | 'success';

export function KaspiAuthModal({ visible, onClose, onSuccess, locale }: Props) {
  const [step, setStep] = useState<AuthStep>('register');

  // Registration fields
  const [phone, setPhone] = useState('+7 (701) 992-84-12');
  const [name, setName] = useState('Достияр Алиев');
  const [email, setEmail] = useState('dostiyar@gmail.com');

  // SMS Verification
  const [smsCode, setSmsCode] = useState('');
  const [generatedSms, setGeneratedSms] = useState('7429');
  const [timerSeconds, setTimerSeconds] = useState(45);

  // PIN Setup
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Pattern Setup
  const [selectedPatternNodes, setSelectedPatternNodes] = useState<number[]>([]);

  // Security features
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);

  // Check biometrics availability
  useEffect(() => {
    (async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricsAvailable(hasHardware && isEnrolled);
      } catch {
        setBiometricsAvailable(false);
      }
    })();
  }, []);

  // Timer countdown for SMS
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'sms' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  // Handle request SMS
  const handleSendSms = () => {
    if (!phone.trim() || phone.length < 10) {
      Alert.alert(
        locale === 'kz' ? 'Қате' : 'Ошибка',
        locale === 'kz' ? 'Телефон нөмірін толық енгізіңіз' : 'Введите корректный номер телефона'
      );
      return;
    }
    if (!name.trim()) {
      Alert.alert(
        locale === 'kz' ? 'Қате' : 'Ошибка',
        locale === 'kz' ? 'Аты-жөніңізді енгізіңіз' : 'Введите ФИО'
      );
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert(
        locale === 'kz' ? 'Қате' : 'Ошибка',
        locale === 'kz' ? 'Электрондық поштаны дұрыс енгізіңіз' : 'Введите корректный адрес эл. почты'
      );
      return;
    }

    // Generate 4-digit code
    const randomCode = String(Math.floor(1000 + Math.random() * 9000));
    setGeneratedSms(randomCode);
    setSmsCode('');
    setTimerSeconds(45);
    setStep('sms');
  };

  // Handle SMS code input
  const handleVerifySms = (enteredCode: string) => {
    setSmsCode(enteredCode);
    if (enteredCode.length === 4) {
      if (enteredCode === generatedSms || enteredCode === '1234') {
        setTimeout(() => {
          setStep('set_pin');
          setPin('');
          setPinError(null);
        }, 300);
      } else {
        Alert.alert(
          locale === 'kz' ? 'Қате код' : 'Неверный код',
          locale === 'kz' ? 'СМС-код дұрыс емес, қайталап көріңіз' : 'Код из СМС не совпадает, попробуйте еще раз'
        );
      }
    }
  };

  // Handle Keypad presses for PIN
  const handleKeyPress = (num: string) => {
    setPinError(null);
    if (step === 'set_pin') {
      if (pin.length < 4) {
        const next = pin + num;
        setPin(next);
        if (next.length === 4) {
          setTimeout(() => {
            setStep('confirm_pin');
            setConfirmPin('');
          }, 250);
        }
      }
    } else if (step === 'confirm_pin') {
      if (confirmPin.length < 4) {
        const next = confirmPin + num;
        setConfirmPin(next);
        if (next.length === 4) {
          if (next === pin) {
            setTimeout(() => {
              setStep('quick_security');
            }, 250);
          } else {
            setPinError(
              locale === 'kz' ? 'ПИН-кодтар сәйкес келмеді' : 'ПИН-коды не совпадают'
            );
            setTimeout(() => {
              setConfirmPin('');
            }, 600);
          }
        }
      }
    }
  };

  const handleKeyBackspace = () => {
    setPinError(null);
    if (step === 'set_pin') {
      setPin(prev => prev.slice(0, -1));
    } else if (step === 'confirm_pin') {
      setConfirmPin(prev => prev.slice(0, -1));
    }
  };

  // Pattern node toggle
  const handleTogglePatternNode = (index: number) => {
    if (!selectedPatternNodes.includes(index)) {
      setSelectedPatternNodes(prev => [...prev, index]);
    }
  };

  // Finalize Registration
  const handleCompleteRegistration = () => {
    const patternStr =
      selectedPatternNodes.length >= 4 ? selectedPatternNodes.join('-') : '0-1-2-5-8';

    const newProfile: UserProfile = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      bonusPoints: 1000, // +1 000 bonus on registration
      isRegistered: true,
      pinCode: pin,
      patternCode: patternStr,
      biometricsEnabled,
      preferredUnlockMode: selectedPatternNodes.length >= 4 ? 'pattern' : 'pin',
    };

    setStep('success');
    setTimeout(() => {
      onSuccess(newProfile);
    }, 1200);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header Bar */}
          <View style={styles.topHeader}>
            <View style={styles.kaspiBadge}>
              <View style={styles.kaspiDot} />
              <Text style={styles.kaspiBadgeText}>Kaspi ID Авторизация</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* STEP 1: Registration Form */}
          {step === 'register' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
              <Text style={styles.stepTitle}>
                {locale === 'kz' ? 'Кіру және Тіркелу' : 'Вход и Регистрация'}
              </Text>
              <Text style={styles.stepSubtitle}>
                {locale === 'kz'
                  ? 'СМС арқылы жылдам растап, жеке жеңілдіктерге қол жеткізіңіз'
                  : 'Введите данные для первого входа. На номер придет проверочный СМС-код.'}
              </Text>

              {/* Bonus Announcement Banner */}
              <View style={styles.bonusBanner}>
                <Ionicons name="gift" size={20} color="#b45309" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.bonusBannerTitle}>
                    {locale === 'kz' ? '+1 000 ₸ Сыйлық бонустары' : '+1 000 ₸ Приветственный бонус'}
                  </Text>
                  <Text style={styles.bonusBannerSub}>
                    {locale === 'kz'
                      ? 'Тіркелгеніңіз үшін бонустық шотқа бірден қосылады'
                      : 'Начислим на ваш бонусный баланс сразу после подтверждения'}
                  </Text>
                </View>
              </View>

              {/* Input Fields */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {locale === 'kz' ? 'Телефон нөмірі (СМС үшін):' : 'Номер телефона (для СМС):'}
                </Text>
                <View style={styles.inputBox}>
                  <Ionicons name="call-outline" size={18} color="#b45309" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="+7 (701) 000-00-00"
                    placeholderTextColor="#94a3b8"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                <Text style={styles.inputLabel}>
                  {locale === 'kz' ? 'Аты-жөніңіз (ФИО):' : 'Ваше имя и фамилия (ФИО):'}
                </Text>
                <View style={styles.inputBox}>
                  <Ionicons name="person-outline" size={18} color="#b45309" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Например: Достияр Алиев"
                    placeholderTextColor="#94a3b8"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <Text style={styles.inputLabel}>
                  {locale === 'kz' ? 'Электрондық пошта:' : 'Электронная почта (Email):'}
                </Text>
                <View style={styles.inputBox}>
                  <Ionicons name="mail-outline" size={18} color="#b45309" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="name@example.kz"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.primaryActionBtn} onPress={handleSendSms} activeOpacity={0.85}>
                <Text style={styles.primaryActionText}>
                  {locale === 'kz' ? 'СМС-код алу →' : 'Получить СМС-код →'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* STEP 2: SMS Verification */}
          {step === 'sms' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
              <Text style={styles.stepTitle}>
                {locale === 'kz' ? 'СМС-кодты енгізіңіз' : 'Введите код из СМС'}
              </Text>
              <Text style={styles.stepSubtitle}>
                {locale === 'kz'
                  ? `Растау коды ${phone} нөміріне жіберілді`
                  : `Проверочный 4-значный код отправлен на ${phone}`}
              </Text>

              {/* Quick Mock Code Helper */}
              <TouchableOpacity
                style={styles.smsDemoHint}
                onPress={() => handleVerifySms(generatedSms)}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-ellipses" size={18} color="#059669" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.smsDemoTitle}>Тестовое СМС-сообщение:</Text>
                  <Text style={styles.smsDemoCode}>
                    «Ваш код входа: <Text style={{ fontWeight: '900' }}>{generatedSms}</Text> (нажмите для вставки)»
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 4 SMS Cells */}
              <View style={styles.smsCellsRow}>
                {[0, 1, 2, 3].map(idx => {
                  const digit = smsCode[idx] || '';
                  const isCurrent = smsCode.length === idx;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.smsCell,
                        isCurrent && styles.smsCellActive,
                        digit && styles.smsCellFilled,
                      ]}
                    >
                      <Text style={styles.smsCellText}>{digit}</Text>
                    </View>
                  );
                })}
              </View>

              <TextInput
                style={styles.hiddenInput}
                keyboardType="number-pad"
                maxLength={4}
                value={smsCode}
                onChangeText={handleVerifySms}
                autoFocus={true}
              />

              <View style={styles.timerRow}>
                {timerSeconds > 0 ? (
                  <Text style={styles.timerText}>
                    {locale === 'kz' ? 'Қайта жіберу:' : 'Отправить код повторно через'}{' '}
                    <Text style={{ fontWeight: '700', color: '#b45309' }}>0:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleSendSms} activeOpacity={0.7}>
                    <Text style={styles.resendBtnText}>
                      {locale === 'kz' ? 'Кодты қайта жіберу' : 'Отправить код повторно'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[styles.primaryActionBtn, smsCode.length < 4 && styles.primaryActionBtnDisabled]}
                disabled={smsCode.length < 4}
                onPress={() => handleVerifySms(smsCode)}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionText}>
                  {locale === 'kz' ? 'Растау' : 'Подтвердить вход'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* STEP 3: Setup PIN Code & STEP 4: Confirm PIN Code */}
          {(step === 'set_pin' || step === 'confirm_pin') && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>
                {step === 'set_pin'
                  ? locale === 'kz'
                    ? 'ПИН-код ойлап табыңыз'
                    : 'Придумайте ПИН-код'
                  : locale === 'kz'
                  ? 'ПИН-кодты қайталаңыз'
                  : 'Повторите ПИН-код'}
              </Text>
              <Text style={styles.stepSubtitle}>
                {locale === 'kz'
                  ? 'Kaspi қосымшалары сияқты 4 санды кодпен жылдам кіру үшін'
                  : '4 цифры для мгновенного входа в приложение, как в Kaspi'}
              </Text>

              {/* 4 Dots indicator */}
              <View style={styles.pinDotsRow}>
                {[0, 1, 2, 3].map(idx => {
                  const currentPin = step === 'set_pin' ? pin : confirmPin;
                  const isFilled = currentPin.length > idx;
                  return (
                    <View
                      key={idx}
                      style={[styles.pinDot, isFilled && styles.pinDotFilled, pinError && styles.pinDotError]}
                    />
                  );
                })}
              </View>

              {pinError && <Text style={styles.errorText}>{pinError}</Text>}

              {/* Numeric Keypad */}
              <View style={styles.keypadGrid}>
                {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['', '0', '⌫']].map((row, rIdx) => (
                  <View key={rIdx} style={styles.keypadRow}>
                    {row.map((btn, bIdx) => {
                      if (!btn) return <View key={bIdx} style={styles.keypadBtnPlaceholder} />;
                      return (
                        <TouchableOpacity
                          key={bIdx}
                          style={styles.keypadBtn}
                          onPress={() => (btn === '⌫' ? handleKeyBackspace() : handleKeyPress(btn))}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.keypadBtnText}>{btn}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* STEP 5: Quick Security Setup (Face ID / Pattern Option) */}
          {step === 'quick_security' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stepContent}>
              <Text style={styles.stepTitle}>
                {locale === 'kz' ? 'Жылдам кіруді баптау' : 'Настройка быстрого входа'}
              </Text>
              <Text style={styles.stepSubtitle}>
                {locale === 'kz'
                  ? 'Келесі рет кіргенде Face ID немесе графикалық кілтпен кіруге болады'
                  : 'Выберите удобные способы входа при последующих открытиях приложения'}
              </Text>

              {/* Face ID / Touch ID Option */}
              <View style={styles.securityOptionCard}>
                <View style={styles.securityOptionIconBox}>
                  <Ionicons name="scan-outline" size={24} color="#b45309" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.securityOptionTitle}>Face ID / Touch ID</Text>
                  <Text style={styles.securityOptionDesc}>
                    {locale === 'kz'
                      ? 'Биометрия арқылы 1 секундта кіру'
                      : 'Вход по лицу или отпечатку пальца без ввода кода'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.togglePill, biometricsEnabled && styles.togglePillActive]}
                  onPress={() => setBiometricsEnabled(prev => !prev)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.toggleCircle, biometricsEnabled && styles.toggleCircleActive]} />
                </TouchableOpacity>
              </View>

              {/* Graphical Pattern Option (3x3 Node Grid) */}
              <View style={styles.securityOptionCard}>
                <View style={styles.securityOptionIconBox}>
                  <Ionicons name="grid-outline" size={24} color="#b45309" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.securityOptionTitle}>
                    {locale === 'kz' ? 'Графикалық кілт (рисунок)' : 'Рисунок разблокировки'}
                  </Text>
                  <Text style={styles.securityOptionDesc}>
                    {locale === 'kz'
                      ? 'Нүктелерді байланыстырып сурет салыңыз'
                      : 'Соедините от 4 точек для дополнительного способа'}
                  </Text>
                </View>
              </View>

              {/* Interactive 3x3 Mini Matrix for Pattern */}
              <View style={styles.patternBox}>
                <View style={styles.patternGrid}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(nodeIdx => {
                    const isSelected = selectedPatternNodes.includes(nodeIdx);
                    const order = selectedPatternNodes.indexOf(nodeIdx) + 1;
                    return (
                      <TouchableOpacity
                        key={nodeIdx}
                        style={[styles.patternNode, isSelected && styles.patternNodeActive]}
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
                {selectedPatternNodes.length > 0 && (
                  <TouchableOpacity
                    style={styles.resetPatternBtn}
                    onPress={() => setSelectedPatternNodes([])}
                  >
                    <Text style={styles.resetPatternText}>
                      {locale === 'kz' ? 'Суретті қайта тазалау' : 'Очистить рисунок'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={handleCompleteRegistration}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionText}>
                  {locale === 'kz' ? 'Сақтау және бастау →' : 'Сохранить и войти в приложение →'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* STEP 6: Success */}
          {step === 'success' && (
            <View style={styles.successBox}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-done" size={40} color="#059669" />
              </View>
              <Text style={styles.successTitle}>
                {locale === 'kz' ? 'Қош келдіңіз!' : 'Добро пожаловать!'}
              </Text>
              <Text style={styles.successName}>{name}</Text>
              <Text style={styles.successDesc}>
                {locale === 'kz'
                  ? 'Авторизация сәтті өтті. Сізге 1 000 ₸ бонустар берілді.'
                  : 'Авторизация успешна! Вам начислено 1 000 ₸ приветственных бонусов.'}
              </Text>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '92%',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  kaspiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  kaspiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
    marginRight: 6,
  },
  kaspiBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b91c1c',
  },
  closeBtn: {
    padding: 6,
  },
  stepContent: {
    paddingTop: 14,
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  bonusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 16,
  },
  bonusBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400e',
  },
  bonusBannerSub: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 2,
  },
  inputGroup: {
    gap: 6,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  primaryActionBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
    marginTop: 10,
  },
  primaryActionBtnDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  smsDemoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: 20,
  },
  smsDemoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
  },
  smsDemoCode: {
    fontSize: 12,
    color: '#047857',
    marginTop: 1,
  },
  smsCellsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 20,
  },
  smsCell: {
    width: 54,
    height: 58,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smsCellActive: {
    borderColor: '#dc2626',
    backgroundColor: '#fff',
  },
  smsCellFilled: {
    borderColor: '#b45309',
    backgroundColor: '#fffbeb',
  },
  smsCellText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  hiddenInput: {
    opacity: 0,
    height: 0,
    width: 0,
  },
  timerRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 12,
    color: '#64748b',
  },
  resendBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b45309',
    textDecorationLine: 'underline',
  },
  pinDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 18,
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
    textAlign: 'center',
    marginBottom: 10,
  },
  keypadGrid: {
    marginTop: 8,
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  keypadBtn: {
    width: 72,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  keypadBtnPlaceholder: {
    width: 72,
    height: 60,
  },
  keypadBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  securityOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  securityOptionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  securityOptionDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  togglePill: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#cbd5e1',
    padding: 2,
    justifyContent: 'center',
  },
  togglePillActive: {
    backgroundColor: '#059669',
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
  },
  patternBox: {
    alignItems: 'center',
    marginVertical: 12,
    padding: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  patternGrid: {
    width: 220,
    height: 220,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    padding: 10,
  },
  patternNode: {
    width: 54,
    height: 54,
    borderRadius: 27,
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
  resetPatternBtn: {
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  resetPatternText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#059669',
  },
  successName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  successDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
    maxWidth: 260,
  },
});
