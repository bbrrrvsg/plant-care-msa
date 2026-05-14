import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { ArrowLeft, Mail, KeyRound, Eye, EyeOff, Check, Sprout } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

type Step = "email" | "verify" | "reset" | "done";

export function ForgotPassword() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [pw, setPw] = useState<string>("");
  const [pwConfirm, setPwConfirm] = useState<string>("");
  const [showPw, setShowPw] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [resendIn, setResendIn] = useState<number>(0);
  
  // 타입 안정성을 위한 TextInput 배열 참조
  const codeRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (step !== "verify" || resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, resendIn]);

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const codeFilled = code.every((c) => c.length === 1);
  const pwStrong = pw.length >= 8;
  const pwMatch = pw === pwConfirm && pw.length > 0;

  const sendEmail = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setResendIn(30);
      setStep("verify");
    }, 900);
  };

  const verifyCode = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setStep("reset");
    }, 800);
  };

  const resetPassword = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setStep("done");
    }, 900);
  };

  const handleCodeChange = (i: number, v: string) => {
    const ch = v.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = ch;
    setCode(next);
    
    // 다음 입력창으로 자동 포커스 이동
    if (ch && i < 5) {
      codeRefs.current[i + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (i: number, e: any) => {
    // 백스페이스 시 이전 입력창으로 자동 포커스 이동
    if (e.nativeEvent.key === "Backspace" && !code[i] && i > 0) {
      codeRefs.current[i - 1]?.focus();
    }
  };

  const stepIndex = ["email", "verify", "reset", "done"].indexOf(step);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                if (step === "email" || step === "done") navigation.navigate("Login");
                else {
                  const steps: Step[] = ["email", "verify", "reset", "done"];
                  setStep(steps[stepIndex - 1]);
                }
              }}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ArrowLeft size={20} color="#374151" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Sprout size={20} color="#3a7d44" />
              <Text style={styles.headerTitle}>PlantCare</Text>
            </View>
            <View style={{ width: 36 }} /> {/* 균형을 위한 빈 공간 */}
          </View>

          {/* Progress */}
          {step !== "done" && (
            <View style={styles.progressContainer}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.progressBar,
                    i <= stepIndex ? styles.progressActive : styles.progressInactive,
                  ]}
                />
              ))}
            </View>
          )}

          <View style={styles.contentContainer}>
            {/* Step 1: Email */}
            {step === "email" && (
              <View style={styles.stepWrapper}>
                <View style={styles.iconBox}>
                  <Mail size={24} color="#3a7d44" />
                </View>
                <Text style={styles.title}>비밀번호를 잊으셨나요?</Text>
                <Text style={styles.subtitle}>
                  가입하신 이메일을 입력해주세요.{"\n"}인증 코드를 보내드릴게요.
                </Text>

                <Text style={styles.inputLabel}>이메일 주소</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="hello@plantcare.app"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                  />
                  <Mail size={20} color="#9CA3AF" />
                </View>

                <View style={styles.bottomSpacer} />
                <SubmitButton onPress={sendEmail} disabled={!validEmail || submitting} loading={submitting}>
                  인증 코드 받기
                </SubmitButton>
                <View style={styles.loginLinkContainer}>
                  <Text style={styles.loginLinkText}>계정이 기억나셨나요? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                    <Text style={styles.loginLinkHighlight}>로그인</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Step 2: Verify */}
            {step === "verify" && (
              <View style={styles.stepWrapper}>
                <View style={styles.iconBox}>
                  <KeyRound size={24} color="#3a7d44" />
                </View>
                <Text style={styles.title}>인증 코드를 입력해주세요</Text>
                <Text style={styles.subtitle}>
                  <Text style={styles.boldText}>{email}</Text>으로{"\n"}6자리 코드를 보냈어요.
                </Text>

                <View style={styles.codeContainer}>
                  {code.map((c, i) => (
                    <TextInput
                      key={i}
                      ref={(el) => { codeRefs.current[i] = el; }}
                      style={[styles.codeInput, c ? styles.codeInputActive : null]}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={c}
                      onChangeText={(text) => handleCodeChange(i, text)}
                      onKeyPress={(e) => handleCodeKeyPress(i, e)}
                    />
                  ))}
                </View>

                <View style={styles.resendContainer}>
                  {resendIn > 0 ? (
                    <Text style={styles.resendTextWait}>{resendIn}초 후 코드를 다시 보낼 수 있어요</Text>
                  ) : (
                    <TouchableOpacity
                      onPress={() => {
                        setResendIn(30);
                        setCode(["", "", "", "", "", ""]);
                        codeRefs.current[0]?.focus();
                      }}
                    >
                      <Text style={styles.resendTextActive}>코드 다시 보내기</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.bottomSpacer} />
                <SubmitButton onPress={verifyCode} disabled={!codeFilled || submitting} loading={submitting}>
                  코드 확인
                </SubmitButton>
              </View>
            )}

            {/* Step 3: Reset */}
            {step === "reset" && (
              <View style={styles.stepWrapper}>
                <View style={styles.iconBox}>
                  <KeyRound size={24} color="#3a7d44" />
                </View>
                <Text style={styles.title}>새 비밀번호를 설정해주세요</Text>
                <Text style={styles.subtitle}>안전한 비밀번호로 계정을 보호하세요.</Text>

                <Text style={styles.inputLabel}>새 비밀번호</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={pw}
                    onChangeText={setPw}
                    placeholder="8자 이상"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPw}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                    {showPw ? <Eye size={20} color="#9CA3AF" /> : <EyeOff size={20} color="#9CA3AF" />}
                  </TouchableOpacity>
                </View>
                <PasswordStrength pw={pw} />

                <Text style={[styles.inputLabel, { marginTop: 20 }]}>비밀번호 확인</Text>
                <View
                  style={[
                    styles.inputWrapper,
                    pwConfirm.length > 0 && !pwMatch ? styles.inputWrapperError : null,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    value={pwConfirm}
                    onChangeText={setPwConfirm}
                    placeholder="비밀번호를 다시 입력"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPw}
                    autoCapitalize="none"
                  />
                  {pwMatch && <Check size={20} color="#3a7d44" />}
                </View>
                {pwConfirm.length > 0 && !pwMatch && (
                  <Text style={styles.errorText}>비밀번호가 일치하지 않아요</Text>
                )}

                <View style={styles.bottomSpacer} />
                <SubmitButton
                  onPress={resetPassword}
                  disabled={!pwStrong || !pwMatch || submitting}
                  loading={submitting}
                >
                  비밀번호 변경하기
                </SubmitButton>
              </View>
            )}

            {/* Step 4: Done */}
            {step === "done" && (
              <View style={styles.doneWrapper}>
                <View style={styles.doneIconBox}>
                  <Check size={40} color="#3a7d44" />
                </View>
                <Text style={styles.title}>비밀번호가 변경됐어요</Text>
                <Text style={styles.doneSubtitle}>
                  새 비밀번호로 다시 로그인해주세요.{"\n"}계정이 안전하게 보호되고 있어요.
                </Text>
                <View style={styles.bottomSpacer} />
                <SubmitButton onPress={() => navigation.navigate("Login")}>
                  로그인 화면으로 이동
                </SubmitButton>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Sub Components ---

interface SubmitButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

function SubmitButton({ onPress, disabled, loading, children }: SubmitButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[styles.submitBtn, disabled ? styles.submitBtnDisabled : styles.submitBtnActive]}
    >
      {loading && <ActivityIndicator color="#ffffff" size="small" style={{ marginRight: 8 }} />}
      <Text style={[styles.submitBtnText, disabled ? styles.submitBtnTextDisabled : null]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

function PasswordStrength({ pw }: { pw: string }) {
  const checks = [
    { label: "8자 이상", ok: pw.length >= 8 },
    { label: "영문 포함", ok: /[A-Za-z]/.test(pw) },
    { label: "숫자 포함", ok: /\d/.test(pw) },
    { label: "특수문자", ok: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const color =
    score <= 1 ? "#EF4444" : score === 2 ? "#FBBF24" : score === 3 ? "#7CCB8A" : "#3a7d44";

  return (
    <View style={styles.strengthContainer}>
      <View style={styles.strengthBars}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.strengthBar,
              { backgroundColor: i < score ? color : "#E5E7EB" },
            ]}
          />
        ))}
      </View>
      <View style={styles.strengthChecks}>
        {checks.map((c) => (
          <View key={c.label} style={styles.checkItem}>
            <Check size={12} color={c.ok ? "#3a7d44" : "#9CA3AF"} />
            <Text style={[styles.checkLabel, { color: c.ok ? "#3a7d44" : "#9CA3AF" }]}>
              {c.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// --- StyleSheet ---

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    backgroundColor: "#ffffff", // gradient 대체를 위해 단색 적용
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3a7d44",
  },
  progressContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 24,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: "#3a7d44",
  },
  progressInactive: {
    backgroundColor: "#E5E7EB",
  },
  contentContainer: {
    flex: 1,
    marginTop: 32,
  },
  stepWrapper: {
    flex: 1,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#e8f5e9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: "700",
    color: "#111827",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginTop: 28,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputWrapperError: {
    borderColor: "#FCA5A5",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 6,
  },
  bottomSpacer: {
    flex: 1,
    minHeight: 40,
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  loginLinkText: {
    fontSize: 14,
    color: "#6B7280",
  },
  loginLinkHighlight: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3a7d44",
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
  },
  codeInput: {
    width: 48,
    height: 56,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  codeInputActive: {
    borderColor: "#7CCB8A",
    backgroundColor: "#ffffff",
  },
  resendContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  resendTextWait: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  resendTextActive: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3a7d44",
  },
  doneWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  doneIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(124, 203, 138, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  doneSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    lineHeight: 22,
    textAlign: "center",
  },
  submitBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnActive: {
    backgroundColor: "#2d5a27",
  },
  submitBtnDisabled: {
    backgroundColor: "#E5E7EB",
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  submitBtnTextDisabled: {
    color: "#9CA3AF",
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBars: {
    flexDirection: "row",
    gap: 4,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    borderRadius: 2,
  },
  strengthChecks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  checkLabel: {
    fontSize: 12,
  },
});