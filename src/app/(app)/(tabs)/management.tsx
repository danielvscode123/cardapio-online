import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { IconifyIcon } from '@/components/ui/iconify-icon';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { colors, fonts, radius, shadow, spacing } from '@/constants/theme';
import {
  useCreateEmployee,
  useDeleteEmployee,
  useEmployees,
  useSetEmployeeActive,
  useUpdateEmployee,
} from '@/features/management/queries';
import { Employee } from '@/features/management/types';
import { useAuth } from '@/providers/auth-provider';

const employeeSchema = z.object({
  name: z.string().trim().min(2, 'Digite o nome do funcionário.'),
  email: z.email('Digite um e-mail válido.'),
  password: z.string().min(8, 'Use pelo menos 8 caracteres.'),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

const editEmployeeSchema = z.object({
  name: z.string().trim().min(2, 'Digite o nome do funcionário.'),
  email: z.email('Digite um e-mail válido.'),
  password: z.string().refine(
    (password) => password.length === 0 || password.length >= 8,
    'Use pelo menos 8 caracteres ou deixe em branco.',
  ),
});

type EditEmployeeForm = z.infer<typeof editEmployeeSchema>;

type EmployeeActionProps = {
  accessibilityLabel: string;
  color?: string;
  disabled: boolean;
  icon: `${string}:${string}`;
  label: string;
  loading?: boolean;
  onPress: () => void;
};

function EmployeeAction({
  accessibilityLabel,
  color = colors.ink,
  disabled,
  icon,
  label,
  loading = false,
  onPress,
}: EmployeeActionProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.employeeAction,
        disabled && styles.actionDisabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <IconifyIcon color={color} icon={icon} size={18} />
      )}
      <Text style={[styles.employeeActionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function EmployeeCard({
  employee,
  loadingAction,
  onDelete,
  onEdit,
  onToggle,
}: {
  employee: Employee;
  loadingAction: 'delete' | 'toggle' | null;
  onDelete: () => void;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const busy = loadingAction !== null;

  return (
    <View style={styles.employeeCard}>
      <View style={styles.employeeMain}>
        <View style={[styles.avatar, !employee.active && styles.avatarInactive]}>
          <Text style={styles.avatarText}>{employee.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.employeeCopy}>
          <Text numberOfLines={1} style={styles.employeeName}>{employee.name}</Text>
          <Text numberOfLines={1} style={styles.employeeEmail}>{employee.email}</Text>
          <View style={styles.employeeRole}>
            <View style={[styles.statusDot, { backgroundColor: employee.active ? colors.success : colors.muted }]} />
            <Text style={styles.employeeRoleText}>{employee.active ? 'Funcionário ativo' : 'Acesso suspenso'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.employeeDivider} />
      <View style={styles.employeeActions}>
        <EmployeeAction
          accessibilityLabel={`Editar ${employee.name}`}
          disabled={busy}
          icon="solar:pen-2-bold-duotone"
          label="Editar"
          onPress={onEdit}
        />
        <EmployeeAction
          accessibilityLabel={employee.active ? `Suspender ${employee.name}` : `Ativar ${employee.name}`}
          color={employee.active ? colors.success : colors.muted}
          disabled={busy}
          icon={employee.active ? 'solar:shield-check-bold' : 'solar:shield-cross-bold'}
          label={employee.active ? 'Suspender' : 'Ativar'}
          loading={loadingAction === 'toggle'}
          onPress={onToggle}
        />
        <EmployeeAction
          accessibilityLabel={`Excluir ${employee.name}`}
          color={colors.danger}
          disabled={busy}
          icon="solar:trash-bin-trash-bold-duotone"
          label="Excluir"
          loading={loadingAction === 'delete'}
          onPress={onDelete}
        />
      </View>
    </View>
  );
}

function NewEmployeeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const createEmployee = useCreateEmployee();
  const { control, handleSubmit, reset } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const close = () => {
    if (createEmployee.isPending) return;
    reset();
    onClose();
  };

  const submit = handleSubmit(async (values) => {
    try {
      await createEmployee.mutateAsync(values);
      close();
      Alert.alert('Funcionário adicionado', `${values.name} já pode entrar no aplicativo.`);
    } catch (error) {
      Alert.alert('Não foi possível cadastrar', error instanceof Error ? error.message : 'Tente novamente.');
    }
  });

  return (
    <Modal animationType="slide" onRequestClose={close} transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <SafeAreaView edges={['bottom']} style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalEyebrow}>NOVO ACESSO</Text>
              <Text style={styles.modalTitle}>Adicionar funcionário</Text>
            </View>
            <Pressable accessibilityLabel="Fechar" onPress={close} style={styles.closeButton}>
              <IconifyIcon icon="solar:close-circle-linear" size={26} color={colors.ink} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                <TextField
                  autoCapitalize="words"
                  error={error?.message}
                  label="Nome"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Ex.: Marina Souza"
                  value={value}
                />
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                <TextField
                  autoCapitalize="none"
                  autoComplete="email"
                  error={error?.message}
                  keyboardType="email-address"
                  label="E-mail de acesso"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="funcionario@restaurante.com"
                  value={value}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                <TextField
                  autoCapitalize="none"
                  error={error?.message}
                  label="Senha inicial"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Mínimo de 8 caracteres"
                  secureTextEntry
                  value={value}
                />
              )}
            />
          </View>

          <View style={styles.accessNote}>
            <IconifyIcon icon="solar:info-circle-bold" size={20} color={colors.ink} />
            <Text style={styles.accessNoteText}>
              O perfil Funcionário terá acesso às áreas Garçom, Cozinha e Caixa.
            </Text>
          </View>

          <Button
            icon="solar:user-plus-bold-duotone"
            label="Criar acesso"
            loading={createEmployee.isPending}
            onPress={() => void submit()}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function EditEmployeeModal({
  employee,
  onClose,
}: {
  employee: Employee | null;
  onClose: () => void;
}) {
  const updateEmployee = useUpdateEmployee();
  const { control, handleSubmit, reset } = useForm<EditEmployeeForm>({
    resolver: zodResolver(editEmployeeSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  useEffect(() => {
    if (employee) {
      reset({ name: employee.name, email: employee.email, password: '' });
    }
  }, [employee, reset]);

  const close = () => {
    if (updateEmployee.isPending) return;
    onClose();
  };

  const submit = handleSubmit(async (values) => {
    if (!employee) return;

    try {
      await updateEmployee.mutateAsync({
        userId: employee.id,
        name: values.name,
        email: values.email,
        password: values.password || undefined,
      });
      close();
      Alert.alert('Dados atualizados', `O acesso de ${values.name} foi atualizado.`);
    } catch (error) {
      Alert.alert('Não foi possível editar', error instanceof Error ? error.message : 'Tente novamente.');
    }
  });

  return (
    <Modal animationType="slide" onRequestClose={close} transparent visible={employee !== null}>
      <View style={styles.modalBackdrop}>
        <SafeAreaView edges={['bottom']} style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={styles.modalHeading}>
              <Text style={styles.modalEyebrow}>EDITAR ACESSO</Text>
              <Text numberOfLines={1} style={styles.modalTitle}>Dados do funcionário</Text>
            </View>
            <Pressable accessibilityLabel="Fechar" onPress={close} style={styles.closeButton}>
              <IconifyIcon icon="solar:close-circle-linear" size={26} color={colors.ink} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                <TextField
                  autoCapitalize="words"
                  error={error?.message}
                  label="Nome"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Nome do funcionário"
                  value={value}
                />
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                <TextField
                  autoCapitalize="none"
                  autoComplete="email"
                  error={error?.message}
                  keyboardType="email-address"
                  label="E-mail de acesso"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="funcionario@restaurante.com"
                  value={value}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
                <TextField
                  autoCapitalize="none"
                  autoComplete="new-password"
                  error={error?.message}
                  label="Nova senha (opcional)"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Deixe em branco para manter"
                  secureTextEntry
                  value={value}
                />
              )}
            />
          </View>

          <View style={styles.accessNote}>
            <IconifyIcon icon="solar:info-circle-bold" size={20} color={colors.ink} />
            <Text style={styles.accessNoteText}>
              Ao alterar o e-mail ou a senha, os novos dados passam a valer no próximo login.
            </Text>
          </View>

          <Button
            icon="solar:diskette-bold-duotone"
            label="Salvar alterações"
            loading={updateEmployee.isPending}
            onPress={() => void submit()}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

export default function ManagementScreen() {
  const { profile } = useAuth();
  const employeesQuery = useEmployees();
  const setActive = useSetEmployeeActive();
  const deleteEmployee = useDeleteEmployee();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (profile?.role !== 'manager') {
    return <Redirect href="/(app)/(tabs)/waiter" />;
  }

  const employees = employeesQuery.data ?? [];
  const activeCount = employees.filter((employee) => employee.active).length;

  const handleToggle = (employee: Employee) => {
    const nextActive = !employee.active;
    Alert.alert(
      nextActive ? 'Reativar acesso' : 'Suspender acesso',
      nextActive
        ? `${employee.name} poderá entrar novamente no aplicativo.`
        : `${employee.name} perderá o acesso ao aplicativo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: nextActive ? 'Reativar' : 'Suspender',
          style: nextActive ? 'default' : 'destructive',
          onPress: async () => {
            setUpdatingId(employee.id);
            try {
              await setActive.mutateAsync({ userId: employee.id, active: nextActive });
            } catch (error) {
              Alert.alert('Não foi possível atualizar', error instanceof Error ? error.message : 'Tente novamente.');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ],
    );
  };

  const handleDelete = (employee: Employee) => {
    Alert.alert(
      'Excluir funcionário?',
      `${employee.name} perderá o acesso e sairá da equipe. Os pedidos e pagamentos lançados por essa pessoa continuarão no histórico.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(employee.id);
            try {
              await deleteEmployee.mutateAsync(employee.id);
              Alert.alert('Funcionário excluído', `O acesso de ${employee.name} foi removido.`);
            } catch (error) {
              Alert.alert('Não foi possível excluir', error instanceof Error ? error.message : 'Tente novamente.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <>
      <Screen
        contentContainerStyle={styles.screenContent}
        header={<AppHeader eyebrow="CONFIGURAÇÕES DA CASA" title="Gestão" />}
        scroll={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>EQUIPE ATIVA</Text>
            <Text style={styles.heroValue}>{activeCount}</Text>
            <Text style={styles.heroText}>de {employees.length} funcionários cadastrados</Text>
          </View>
          <View style={styles.heroIcon}>
            <IconifyIcon icon="solar:users-group-two-rounded-bold-duotone" size={52} color={colors.mustard} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>ACESSOS</Text>
            <Text style={styles.sectionTitle}>Funcionários</Text>
          </View>
          <Pressable onPress={() => setModalVisible(true)} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <IconifyIcon icon="solar:user-plus-bold" size={19} color={colors.white} />
            <Text style={styles.addButtonText}>Adicionar</Text>
          </Pressable>
        </View>

        {employeesQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.tomato} size="large" />
          </View>
        ) : employeesQuery.isError ? (
          <View style={styles.center}>
            <Text style={styles.errorTitle}>A equipe não carregou.</Text>
            <Button label="Tentar novamente" onPress={() => void employeesQuery.refetch()} variant="ghost" />
          </View>
        ) : (
          <FlatList
            contentContainerStyle={employees.length ? styles.employeeList : styles.emptyList}
            data={employees}
            keyExtractor={(employee) => employee.id}
            ListEmptyComponent={
              <EmptyState
                accent={colors.mustard}
                description="Adicione o primeiro funcionário para compartilhar a operação do restaurante."
                icon="solar:user-plus-bold-duotone"
                title="Sua equipe começa aqui"
              />
            }
            refreshControl={
              <RefreshControl
                colors={[colors.tomato]}
                onRefresh={() => void employeesQuery.refetch()}
                refreshing={employeesQuery.isRefetching}
                tintColor={colors.tomato}
              />
            }
            renderItem={({ item }) => (
              <EmployeeCard
                employee={item}
                loadingAction={
                  deletingId === item.id
                    ? 'delete'
                    : updatingId === item.id
                      ? 'toggle'
                      : null
                }
                onDelete={() => handleDelete(item)}
                onEdit={() => setSelectedEmployee(item)}
                onToggle={() => handleToggle(item)}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Screen>

      <NewEmployeeModal onClose={() => setModalVisible(false)} visible={modalVisible} />
      <EditEmployeeModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingBottom: 82 },
  hero: {
    marginBottom: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroCopy: { flex: 1 },
  heroEyebrow: { color: colors.sage, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.4 },
  heroValue: { color: colors.cream, fontFamily: fonts.display, fontSize: 47, lineHeight: 52 },
  heroText: { color: colors.sage, fontFamily: fonts.body, fontSize: 11 },
  heroIcon: {
    width: 78,
    height: 78,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inkSoft,
    transform: [{ rotate: '3deg' }],
  },
  sectionHeader: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionEyebrow: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.2 },
  sectionTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 28 },
  addButton: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.tomato,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 11 },
  center: { flex: 1, minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 24 },
  employeeList: { gap: spacing.md, paddingBottom: spacing.xl },
  emptyList: { flexGrow: 1 },
  employeeCard: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
    gap: spacing.md,
    ...shadow.card,
  },
  employeeMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  avatarInactive: { backgroundColor: colors.muted },
  avatarText: { color: colors.cream, fontFamily: fonts.display, fontSize: 22 },
  employeeCopy: { minWidth: 0, flex: 1 },
  employeeName: { color: colors.ink, fontFamily: fonts.bodyBold, fontSize: 14 },
  employeeEmail: { color: colors.muted, fontFamily: fonts.body, fontSize: 10 },
  employeeRole: { marginTop: 5, flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  employeeRoleText: { color: colors.muted, fontFamily: fonts.bodyBold, fontSize: 9 },
  employeeDivider: { height: 1, backgroundColor: colors.line },
  employeeActions: { flexDirection: 'row', gap: spacing.sm },
  employeeAction: {
    minHeight: 42,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.canvas,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  employeeActionText: { fontFamily: fonts.bodyBold, fontSize: 10 },
  actionDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(18, 36, 30, 0.55)' },
  modalSheet: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: colors.canvas,
    gap: spacing.xl,
  },
  modalHandle: { alignSelf: 'center', width: 46, height: 5, borderRadius: 3, backgroundColor: colors.line },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalHeading: { minWidth: 0, flex: 1, paddingRight: spacing.md },
  modalEyebrow: { color: colors.tomato, fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1.3 },
  modalTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 28 },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
  form: { gap: spacing.lg },
  accessNote: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#E5D9AE',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  accessNoteText: { flex: 1, color: colors.ink, fontFamily: fonts.body, fontSize: 11, lineHeight: 16 },
});
