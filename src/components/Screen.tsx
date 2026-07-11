import React from 'react';
import { ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { spacing, type } from '../theme/tokens';

interface ScreenProps {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  contentStyle?: ViewStyle;
}

export function Screen({
  title,
  subtitle,
  right,
  children,
  scroll = true,
  padded = true,
  contentStyle,
}: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const header = title ? (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        {subtitle ? (
          <Text style={[type.label, { color: colors.textFaint, textTransform: 'uppercase' }]}>
            {subtitle}
          </Text>
        ) : null}
        <Text style={[type.display, { color: colors.text }]}>{title}</Text>
      </View>
      {right}
    </View>
  ) : null;

  const inner = (
    <>
      {header}
      {children}
    </>
  );

  if (!scroll) {
    return (
      <View
        style={[
          styles.fill,
          { backgroundColor: colors.bg, paddingTop: insets.top + spacing.md },
          padded && styles.padded,
          contentStyle,
        ]}
      >
        {inner}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.fill, { backgroundColor: colors.bg }]}
      contentContainerStyle={[
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxxl * 2 },
        padded && styles.padded,
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {inner}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  padded: { paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
});
