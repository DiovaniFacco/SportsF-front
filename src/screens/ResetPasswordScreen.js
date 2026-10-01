import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SportsFLogo } from '../components/common/SportsFLogo';
import { PasswordStrength } from '../components/common/PasswordStrength';
import { theme } from '../styles/theme';

export function ResetPasswordScreen({ token, email, onBack, onResetSuccess }) {
  const { colors } = useTheme();
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    setErrorMessage('');
    if (!token || !email) {
      setErrorMessage('Link inválido. Peça um novo link de recuperação.');
      return;
    }
    if (!password || password.length < 8) {
      setErrorMessage('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem. Verifique e tente novamente.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword({ token, email, password });
      setDone(true);
    } catch (err) {
      setErrorMessage(err.message || 'Não foi possível redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topHeader}>
          {onBack ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onBack}
              style={[styles.iconBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              accessibilityLabel="Voltar"
            >
              <ArrowLeft size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholderBtn} />
          )}
        </View>

        <View style={styles.brandHeroContainer}>
          <View style={styles.logoRow}>
            <SportsFLogo height={44} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Redefinir senha</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Crie uma nova senha para {email}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {done ? (
            <View style={styles.successBox}>
              <CheckCircle2 size={48} color={colors.success} />
              <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Senha redefinida!</Text>
              <Text style={[styles.successText, { color: colors.textSecondary }]}>
                Você já está logado e pode continuar usando o SportsF.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onResetSuccess}
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.primaryBtnText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {errorMessage ? (
                <View style={[styles.errorContainer, { backgroundColor: colors.errorSurface, borderColor: colors.error }]}>
                  <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Nova senha (mínimo 8 caracteres)</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.searchBg, borderColor: colors.border }]}>
                  <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="Crie uma senha forte"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                  />
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    {showPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
                  </TouchableOpacity>
                </View>
                <PasswordStrength password={password} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Confirmar nova senha</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.searchBg, borderColor: colors.border }]}>
                  <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.textPrimary }]}
                    placeholder="Repita a nova senha"
                    placeholderTextColor={colors.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="go"
                    onSubmitEditing={handleReset}
                  />
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                    {showConfirmPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleReset}
                disabled={loading}
                style={[styles.primaryBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Redefinir senha</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  iconBtn: { width: 40, height: 40, borderRadius: theme.radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderBtn: { width: 40 },
  brandHeroContainer: { alignItems: 'center', marginBottom: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: theme.typography.sizes.h2, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: theme.typography.sizes.body, textAlign: 'center', maxWidth: 300, lineHeight: 20 },
  card: { borderRadius: theme.radius.xl, borderWidth: 1, padding: theme.spacing.lg, ...theme.shadows.sm },
  errorContainer: { borderWidth: 1, borderRadius: theme.radius.md, padding: 12, marginBottom: 16 },
  errorText: { fontSize: theme.typography.sizes.label, fontWeight: '600', textAlign: 'center' },
  inputGroup: { marginBottom: theme.spacing.md },
  label: { fontSize: theme.typography.sizes.label, fontWeight: '600', marginBottom: 6 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: theme.radius.md, borderWidth: 1, height: 48, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: theme.typography.sizes.body, paddingVertical: 8 },
  eyeBtn: { padding: 6 },
  primaryBtn: { height: 50, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', marginTop: theme.spacing.sm },
  primaryBtnText: { color: '#FFFFFF', fontSize: theme.typography.sizes.button, fontWeight: '700' },
  successBox: { alignItems: 'center', paddingVertical: 8 },
  successTitle: { fontSize: theme.typography.sizes.h3, fontWeight: '800', marginTop: 12, marginBottom: 6, textAlign: 'center' },
  successText: { fontSize: theme.typography.sizes.body, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
});
