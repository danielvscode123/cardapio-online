import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { IconifyIcon } from '@/components/ui/iconify-icon';
import { TextField } from '@/components/ui/text-field';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
});

const setupSchema = loginSchema.extend({
  name: z.string().trim().min(2, 'Informe o nome do gerente.'),
});

type LoginValues = z.infer<typeof loginSchema>;
type SetupValues = z.infer<typeof setupSchema>;

function LoginForm({ onShowSetup }: { onShowSetup: () => void }) {
  const { resendConfirmation, signIn } = useAuth();
  const [resending, setResending] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const {
    clearErrors,
    control,
    getValues,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit(async ({ email, password }) => {
    setConfirmationSent(false);
    const result = await signIn(email, password);
    if (result.error) {
      const canResendConfirmation = ['email_not_confirmed', 'invalid_credentials'].includes(
        result.errorCode ?? '',
      );
      setError('root', {
        type: canResendConfirmation ? 'email_confirmation' : 'server',
        message:
          result.errorCode === 'email_not_confirmed'
            ? 'Seu e-mail ainda não foi confirmado.'
            : canResendConfirmation
              ? 'Não foi possível entrar. Confira a senha e se o e-mail já foi confirmado.'
              : 'O login está indisponível agora. Tente novamente em alguns instantes.',
      });
    }
  });

  const resend = async () => {
    const emailResult = loginSchema.shape.email.safeParse(getValues('email'));
    if (!emailResult.success) {
      setError('email', { message: 'Informe um e-mail válido para reenviar a confirmação.' });
      return;
    }

    setResending(true);
    setConfirmationSent(false);
    const result = await resendConfirmation(emailResult.data);
    setResending(false);

    if (result.error) {
      setError('root', {
        message:
          result.errorCode === 'over_email_send_rate_limit'
            ? 'O limite de envios foi atingido. Aguarde alguns minutos e tente novamente.'
            : 'Não foi possível reenviar agora. Tente novamente em alguns instantes.',
      });
      return;
    }

    clearErrors('root');
    setConfirmationSent(true);
  };

  return (
    <View style={styles.form}>
      <View style={styles.formHeading}>
        <Text style={styles.formTitle}>Bom serviço.</Text>
        <Text style={styles.formSubtitle}>Entre para acessar as mesas, a cozinha e o caixa.</Text>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { onBlur, onChange, value } }) => (
          <TextField
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email?.message}
            keyboardType="email-address"
            label="E-mail"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="voce@restaurante.com"
            returnKeyType="next"
            value={value}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onBlur, onChange, value } }) => (
          <TextField
            autoComplete="password"
            error={errors.password?.message}
            label="Senha"
            onBlur={onBlur}
            onChangeText={onChange}
            onSubmitEditing={submit}
            placeholder="Sua senha"
            returnKeyType="done"
            secureTextEntry
            value={value}
          />
        )}
      />

      {errors.root?.message ? (
        <View style={styles.formNotice}>
          <IconifyIcon icon="solar:letter-bold" size={20} color={colors.danger} />
          <View style={styles.formNoticeCopy}>
            <Text style={styles.formError}>{errors.root.message}</Text>
            {errors.root.type === 'email_confirmation' ? (
              <Pressable accessibilityRole="button" disabled={resending} onPress={() => void resend()}>
                <Text style={styles.resendLink}>
                  {resending ? 'Reenviando…' : 'Reenviar confirmação por e-mail'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {confirmationSent ? (
        <View style={[styles.formNotice, styles.successNotice]}>
          <IconifyIcon icon="solar:check-circle-bold" size={20} color={colors.success} />
          <Text style={styles.successText}>
            Se houver um cadastro pendente, enviamos um novo link. Confira também a pasta de spam.
          </Text>
        </View>
      ) : null}

      <Button
        icon="solar:arrow-right-bold"
        label="Entrar no salão"
        loading={isSubmitting}
        onPress={submit}
      />

      <Pressable accessibilityRole="button" onPress={onShowSetup} style={styles.setupLink}>
        <Text style={styles.setupLinkText}>Primeira vez aqui?</Text>
        <Text style={styles.setupLinkStrong}>Configurar gerente</Text>
      </Pressable>
    </View>
  );
}

function SetupForm({ onBack }: { onBack: () => void }) {
  const { createInitialManager, resendConfirmation } = useAuth();
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SetupValues>({
    resolver: zodResolver(setupSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const submit = handleSubmit(async ({ name, email, password }) => {
    const result = await createInitialManager(name, email, password);
    if (result.error) {
      setError('root', { message: result.error });
      return;
    }

    if (result.requiresEmailConfirmation) {
      setConfirmationEmail(email.trim().toLowerCase());
    }
  });

  const resend = async () => {
    if (!confirmationEmail) return;
    setResending(true);
    setResendMessage(null);
    const result = await resendConfirmation(confirmationEmail);
    setResending(false);
    setResendMessage(
      result.error
        ? result.errorCode === 'over_email_send_rate_limit'
          ? 'Muitos envios em pouco tempo. Aguarde alguns minutos.'
          : 'Não foi possível reenviar agora.'
        : 'Novo link enviado. Confira também a pasta de spam.',
    );
  };

  if (confirmationEmail) {
    return (
      <View style={styles.form}>
        <View style={styles.confirmationIcon}>
          <IconifyIcon icon="solar:letter-opened-bold" size={34} color={colors.cream} />
        </View>
        <View style={styles.formHeading}>
          <Text style={styles.formTitle}>Confira seu e-mail.</Text>
          <Text style={styles.formSubtitle}>
            Enviamos um link para <Text style={styles.emailStrong}>{confirmationEmail}</Text>. Abra o link
            para confirmar o acesso e depois volte para entrar.
          </Text>
        </View>
        {resendMessage ? <Text style={styles.helperMessage}>{resendMessage}</Text> : null}
        <Button
          icon="solar:letter-bold"
          label="Reenviar confirmação"
          loading={resending}
          onPress={() => void resend()}
          variant="secondary"
        />
        <Button label="Já confirmei, ir para o login" onPress={onBack} variant="ghost" />
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backButton}>
        <IconifyIcon icon="solar:arrow-left-linear" size={20} color={colors.ink} />
        <Text style={styles.backText}>Voltar ao login</Text>
      </Pressable>

      <View style={styles.formHeading}>
        <Text style={styles.formTitle}>Abrir a casa.</Text>
        <Text style={styles.formSubtitle}>Crie o primeiro acesso. Ele será o gerente do restaurante.</Text>
      </View>

      <Controller
        control={control}
        name="name"
        render={({ field: { onBlur, onChange, value } }) => (
          <TextField
            autoCapitalize="words"
            error={errors.name?.message}
            label="Nome do gerente"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Seu nome"
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { onBlur, onChange, value } }) => (
          <TextField
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email?.message}
            keyboardType="email-address"
            label="E-mail"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="gerente@restaurante.com"
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onBlur, onChange, value } }) => (
          <TextField
            autoComplete="new-password"
            error={errors.password?.message}
            label="Senha"
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder="Mínimo de 8 caracteres"
            secureTextEntry
            value={value}
          />
        )}
      />

      {errors.root?.message ? <Text style={styles.formError}>{errors.root.message}</Text> : null}

      <Button
        icon="solar:shop-2-bold"
        label="Criar acesso de gerente"
        loading={isSubmitting}
        onPress={submit}
      />
    </View>
  );
}

export default function LoginScreen() {
  const [showSetup, setShowSetup] = useState(false);

  return (
    <LinearGradient colors={[colors.ink, '#204C3E']} style={styles.page}>
      <StatusBar style="light" />
      <View style={[styles.decorativeDisc, styles.noPointerEvents]} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.brand}>
              <View style={styles.brandIcon}>
                <IconifyIcon icon="solar:chef-hat-bold" size={28} color={colors.cream} />
              </View>
              <View>
                <Text style={styles.brandName}>Mesa Boa</Text>
                <Text style={styles.brandCaption}>SALÃO EM MOVIMENTO</Text>
              </View>
            </View>

            <View style={styles.ticket}>
              <View style={styles.ticketNotchLeft} />
              <View style={styles.ticketNotchRight} />
              {showSetup ? (
                <SetupForm onBack={() => setShowSetup(false)} />
              ) : (
                <LoginForm onShowSetup={() => setShowSetup(true)} />
              )}
            </View>

            <Text style={styles.footer}>Uma operação simples deixa mais tempo para receber bem.</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
    gap: spacing.xxl,
  },
  decorativeDisc: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 54,
    borderColor: 'rgba(230, 184, 74, 0.12)',
    top: -100,
    right: -120,
  },
  noPointerEvents: { pointerEvents: 'none' },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    alignSelf: 'center',
  },
  brandIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.tomato,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-3deg' }],
  },
  brandName: {
    color: colors.cream,
    fontFamily: fonts.display,
    fontSize: 31,
    lineHeight: 34,
    letterSpacing: -1,
  },
  brandCaption: {
    color: colors.sage,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.7,
  },
  ticket: {
    position: 'relative',
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
    padding: spacing.xl,
    overflow: 'hidden',
  },
  ticketNotchLeft: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.inkSoft,
    left: -12,
    top: 116,
  },
  ticketNotchRight: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.inkSoft,
    right: -12,
    top: 116,
  },
  form: { gap: spacing.lg },
  formHeading: { gap: spacing.sm, marginBottom: spacing.xs },
  formTitle: {
    color: colors.ink,
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 39,
    letterSpacing: -1,
  },
  formSubtitle: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
  },
  formError: {
    color: colors.danger,
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  formNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#F7DDD5',
  },
  formNoticeCopy: { flex: 1, gap: spacing.xs },
  resendLink: {
    color: colors.ink,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  successNotice: { backgroundColor: '#DDEBDD' },
  successText: { flex: 1, color: colors.success, fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 18 },
  confirmationIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    transform: [{ rotate: '-3deg' }],
  },
  emailStrong: { color: colors.ink, fontFamily: fonts.bodyBold },
  helperMessage: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 18 },
  setupLink: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  setupLinkText: { color: colors.muted, fontFamily: fonts.body, fontSize: 13 },
  setupLinkStrong: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 13 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start' },
  backText: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 13 },
  footer: {
    maxWidth: 320,
    alignSelf: 'center',
    color: colors.sage,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
