import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { GoogleIcon } from '../components/common/GoogleIcon';
import { theme } from '../styles/theme';
import { useGoogleAuth } from '../services/googleAuth';

export function LoginScreen({ onNavigateRegister, onBack, onLoginSuccess }) {
  const { colors } = useTheme();
  const { login, loginWithGoogle } = useAuth();
  const { request, response, promptAsync, isConfigured } = useGoogleAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (response?.type === 'success') {
      const id_token = response.params?.id_token || response.authentication?.idToken;
      const access_token = response.params?.access_token || response.authentication?.accessToken;
      handleBackendGoogleLogin({ id_token, access_token });
    } else if (response?.type === 'error') {
      setErrorMessage('Erro ao autenticar com o Google: ' + (response.error?.message || 'Falha na autorização'));
      setGoogleLoading(false);
    }
  }, [response]);

  const handleBackendGoogleLogin = async (tokens) => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle(tokens);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Erro ao realizar login com o Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    setErrorMessage('');
    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail.');
      return;
    }
    if (!password) {
      setErrorMessage('Por favor, digite sua senha.');
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

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setGoogleLoading(true);
    try {
      if (isConfigured && request) {
        const result = await promptAsync();
        if (result?.type === 'success') {
          const id_token = result.params?.id_token || result.authentication?.idToken;
          const access_token = result.params?.access_token || result.authentication?.accessToken;
          await handleBackendGoogleLogin({ id_token, access_token });
          return;
        } else if (result?.type === 'cancel' || result?.type === 'dismiss') {
          setGoogleLoading(false);
          return;
        }
      }

      if (!isConfigured) {
        if (email.trim() && email.includes('@')) {
          await handleBackendGoogleLogin({
            email: email.trim(),
            name: email.split('@')[0],
            google_id: 'google_dev_' + Date.now(),
          });
        } else {
          setErrorMessage(
            'Para autenticação real com Google em produção, defina EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID no arquivo .env. Em desenvolvimento, informe um e-mail no campo acima para testar.'
          );
          setGoogleLoading(false);
        }
      }
    } catch (err) {
      setErrorMessage('Erro ao acionar o Google: ' + err.message);
      setGoogleLoading(false);
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
            <Text style={[styles.letraS, { color: colors.letraS }]}>S</Text>
            <Text style={[styles.brandName, { color: colors.brandName }]}>facco</Text>
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Bem-vindo de volta!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Entre na sua conta para agendar quadras e partidas
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
            <View style={[styles.inputWrapper, { backgroundColor: colors.searchBg, borderColor: colors.border }]}>
              <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="seu.email@exemplo.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Senha</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => Alert.alert('Recuperação de Senha', 'Um link de redefinição será enviado para seu e-mail.')}>
                <Text style={[styles.forgotText, { color: colors.primary }]}>Esqueceu?</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: colors.searchBg, borderColor: colors.border }]}>
              <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Sua senha secreta"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
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
          </View>

          {/* Primary Submit Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleEmailLogin}
            disabled={loading || googleLoading}
            style={[
              styles.primaryBtn,
              { backgroundColor: colors.primary },
              (loading || googleLoading) && { opacity: 0.7 },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Entrar no SFACCO</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>ou continue com</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Google Login Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleGoogleLogin}
            disabled={loading || googleLoading}
            style={[
              styles.googleBtn,
              { backgroundColor: colors.backgroundSecondary, borderColor: colors.border },
              (loading || googleLoading) && { opacity: 0.7 },
            ]}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <>
                <GoogleIcon size={20} style={styles.googleIcon} />
                <Text style={[styles.googleBtnText, { color: colors.textPrimary }]}>
                  Entrar com o Google
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Navigation Link */}
        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Ainda não tem uma conta?{' '}
          </Text>
          <TouchableOpacity activeOpacity={0.7} onPress={onNavigateRegister}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Cadastre-se</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 20,
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
    marginBottom: 28,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  letraS: {
    fontFamily:
      Platform.OS === 'web'
        ? "'Great Vibes', cursive, 'GreatVibes_400Regular'"
        : 'GreatVibes_400Regular',
    fontSize: 54,
    marginRight: -4,
  },
  brandName: {
    fontFamily:
      Platform.OS === 'web'
        ? "'Josefin Sans', sans-serif, 'JosefinSans_700Bold'"
        : 'JosefinSans_700Bold',
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  card: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  errorContainer: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 14,
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
    marginTop: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    height: 50,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    marginRight: 10,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 26,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
