import { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants/theme';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  header?: ReactNode;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}>;

export function Screen({ children, scroll = true, header, contentContainerStyle }: ScreenProps) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {header}
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 112,
  },
  flex: {
    flex: 1,
  },
});
