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
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SportsFLogo } from '../components/common/SportsFLogo';
import { theme } from '../styles/theme';

export function ForgotPasswordScreen({ onNavigateLogin, onBack }) {
  const { colors } = useTheme();
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setErrorMessage('');
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Por favor, informe um e-mail válido.');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setErrorMessage(err.message || 'Não foi possível enviar o link. Tente novamente.');
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
          <Text style={[styles.title, { color: colors.textPrimary }]}>Esqueceu a senha?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Informe seu e-mail e enviaremos um link para redefinir sua senha
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {sent ? (
            <View style={styles.successBox}>
              <CheckCircle2 size={48} color={colors.success} />
              <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
                Verifique seu e-mail
              </Text>
              <Text style={[styles.successText, { color: colors.textSecondary }]}>
                Se o e-mail estiver cadastrado, o link foi enviado. O link expira em 60 minutos.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onNavigateLogin}
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.primaryBtnText}>Voltar ao login</Text>
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
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                  />
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSend}
                disabled={loading}
                style={[styles.primaryBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Enviar link de recuperação</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Lembrou a senha? </Text>
          <TouchableOpacity activeOpacity={0.7} onPress={onNavigateLogin}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Voltar ao login</Text>
          </TouchableOpacity>
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
  primaryBtn: { height: 50, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', marginTop: theme.spacing.sm },
  primaryBtnText: { color: '#FFFFFF', fontSize: theme.typography.sizes.button, fontWeight: '700' },
  successBox: { alignItems: 'center', paddingVertical: 8 },
  successTitle: { fontSize: theme.typography.sizes.h3, fontWeight: '800', marginTop: 12, marginBottom: 6, textAlign: 'center' },
  successText: { fontSize: theme.typography.sizes.body, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: theme.typography.sizes.body },
  footerLink: { fontSize: theme.typography.sizes.body, fontWeight: '700' },
});
