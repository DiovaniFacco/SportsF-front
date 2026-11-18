import React, { useState, useRef } from 'react';
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
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SportsFLogo } from '../components/common/SportsFLogo';
import { theme } from '../styles/theme';

/**
 * Tela de Login.
 * `subtitle`: substitui o texto padrão (ex: modo gestão usa copy neutra).
 * `showRegisterLink`: oculta o link de cadastro quando embutida no painel de gestão.
 */
export function LoginScreen({ onNavigateRegister, onNavigateForgot, onBack, onLoginSuccess, subtitle = null, showRegisterLink = true }) {
  const { colors } = useTheme();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const passwordRef = useRef(null);

  const handleEmailLogin = async () => {
    setErrorMessage('');
    setEmailError('');
    setPasswordError('');
    if (!email.trim()) {
      setEmailError('Informe seu e-mail.');
      return;
    }
    if (!password) {
      setPasswordError('Digite sua senha.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Credenciais inválidas. Verifique os dados e tente novamente.');
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
        {/* Header Bar: Back action */}
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

        {/* Brand Logo Header */}
        <View style={styles.brandHeroContainer}>
          <View style={styles.logoRow}>
            <SportsFLogo height={44} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Bem-vindo de volta!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle || 'Entre na sua conta para agendar quadras e partidas'}
          </Text>
        </View>

        {/* Form Container */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {errorMessage ? (
            <View style={[styles.errorContainer, { backgroundColor: colors.errorSurface, borderColor: colors.error }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Email Field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>E-mail</Text>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.searchBg, borderColor: emailError ? colors.error : colors.border },
              ]}
            >
              <Mail size={18} color={emailError ? colors.error : colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="seu.email@exemplo.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (emailError) setEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus?.()}
              />
            </View>
            {emailError ? (
              <View style={styles.fieldErrorRow}>
                <AlertCircle size={12} color={colors.error} />
                <Text style={[styles.fieldErrorText, { color: colors.error }]}>{emailError}</Text>
              </View>
            ) : null}
          </View>

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Senha</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={onNavigateForgot}>
                <Text style={[styles.forgotText, { color: colors.primary }]}>Esqueceu?</Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.searchBg, borderColor: passwordError ? colors.error : colors.border },
              ]}
            >
              <Lock size={18} color={passwordError ? colors.error : colors.textMuted} style={styles.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Sua senha secreta"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (passwordError) setPasswordError('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleEmailLogin}
              />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.textMuted} />
                ) : (
                  <Eye size={18} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <View style={styles.fieldErrorRow}>
                <AlertCircle size={12} color={colors.error} />
                <Text style={[styles.fieldErrorText, { color: colors.error }]}>{passwordError}</Text>
              </View>
            ) : null}
          </View>

          {/* Primary Submit Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleEmailLogin}
            disabled={loading}
            style={[
              styles.primaryBtn,
              { backgroundColor: colors.primary },
              loading && { opacity: 0.7 },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Entrar no SportsF</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Navigation Link — oculto no modo gestão (contas são criadas pelo administrador) */}
        {showRegisterLink ? (
          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Ainda não tem uma conta?{' '}
            </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={onNavigateRegister}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderBtn: {
    width: 40,
  },
  brandHeroContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: theme.typography.sizes.h2,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: theme.typography.sizes.body,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 20,
  },
  card: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  errorContainer: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: theme.typography.sizes.label,
    fontWeight: '600',
    marginBottom: 6,
  },
  forgotText: {
    fontSize: theme.typography.sizes.bodySmall,
    fontWeight: '600',
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  fieldErrorText: {
    fontSize: theme.typography.sizes.caption,
    fontWeight: '600',
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    height: 48,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  eyeBtn: {
    padding: 6,
  },
  primaryBtn: {
    height: 50,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: theme.typography.sizes.button,
    fontWeight: '700',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: theme.typography.sizes.body,
  },
  footerLink: {
    fontSize: theme.typography.sizes.body,
    fontWeight: '700',
  },
});
