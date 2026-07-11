import { ArrowClockwise, CheckCircle, Plus, X } from 'phosphor-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Card, SectionTitle } from '../src/components/Card';
import { Chip } from '../src/components/Chip';
import { Screen } from '../src/components/Screen';
import { SegmentedControl } from '../src/components/SegmentedControl';
import { computeTargets } from '../src/lib/nutrition';
import {
  addDays,
  buildDayPlan,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  GroceryItem,
  groceryList,
  todayKey,
} from '../src/lib/planner';
import { IngredientCategory } from '../src/lib/types';
import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme/ThemeContext';
import { radius, spacing, type } from '../src/theme/tokens';

export default function Groceries() {
  const { colors } = useTheme();
  const profile = useAppStore((s) => s.profile);
  const plans = useAppStore((s) => s.plans);
  const planNonces = useAppStore((s) => s.planNonces);
  const checked = useAppStore((s) => s.groceryChecked);
  const custom = useAppStore((s) => s.groceryCustom);
  const removed = useAppStore((s) => s.groceryRemoved);
  const toggleChecked = useAppStore((s) => s.toggleGroceryChecked);
  const addItem = useAppStore((s) => s.addGroceryItem);
  const removeItem = useAppStore((s) => s.removeGroceryItem);
  const resetGroceries = useAppStore((s) => s.resetGroceries);
  const markShoppingDone = useAppStore((s) => s.markShoppingDone);

  const [range, setRange] = useState<'3' | '7'>('7');
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<IngredientCategory>('produce');
  const [justShopped, setJustShopped] = useState(false);

  const sections = useMemo(() => {
    const targets = computeTargets(profile);
    const start = todayKey();
    const days = Array.from({ length: Number(range) }, (_, i) => addDays(start, i));
    // Use saved plans where they exist; preview deterministic ones for future days.
    const dayPlans = days.map(
      (d) => plans[d] ?? buildDayPlan(profile, targets, d, planNonces[d] ?? 0)
    );

    const removedSet = new Set(removed);
    const byCat = new Map<IngredientCategory, GroceryItem[]>();
    for (const section of groceryList(dayPlans)) {
      const kept = section.items.filter((i) => !removedSet.has(i.key));
      if (kept.length) byCat.set(section.category, kept);
    }
    // Merge in hand-added items.
    for (const c of custom) {
      const list = byCat.get(c.category) ?? [];
      list.push({ key: c.key, item: c.item, qty: c.qty, unit: c.unit, sources: [] });
      byCat.set(c.category, list);
    }

    return CATEGORY_ORDER.filter((c) => byCat.has(c)).map((category) => ({
      category,
      items: byCat.get(category)!.sort((a, b) => a.item.localeCompare(b.item)),
    }));
  }, [profile, plans, planNonces, range, custom, removed]);

  const totalCount = sections.reduce((n, s) => n + s.items.length, 0);
  const doneCount = sections.reduce(
    (n, s) => n + s.items.filter((i) => checked[i.key]).length,
    0
  );

  const submitNew = () => {
    const name = newName.trim();
    if (!name) return;
    addItem({ item: name, qty: 1, unit: '', category: newCat });
    setNewName('');
  };

  const finishShopping = () => {
    markShoppingDone(todayKey(), doneCount);
    setJustShopped(true);
    setTimeout(() => setJustShopped(false), 2500);
  };

  return (
    <Screen title="Groceries" subtitle={`Next ${range} days`}>
      <SegmentedControl
        options={[
          { value: '3', label: '3 days' },
          { value: '7', label: '7 days' },
        ]}
        value={range}
        onChange={setRange}
      />

      <Card style={{ gap: spacing.md, marginTop: spacing.md }}>
        <View>
          <Text style={[type.bodyMedium, { color: colors.text }]}>
            {doneCount} of {totalCount} checked off
          </Text>
          <Text style={[type.small, { color: colors.textFaint }]}>
            {justShopped
              ? `Saved to your history — ${doneCount} item${doneCount === 1 ? '' : 's'} today.`
              : 'Checkmarks are saved. Mark done to log a shopping trip, or refresh to start over.'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable
            onPress={finishShopping}
            hitSlop={8}
            accessibilityLabel="Mark shopping done"
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              paddingVertical: spacing.sm,
              borderRadius: radius.pill,
              backgroundColor: colors.accent,
            }}
          >
            <CheckCircle size={15} color={colors.onAccent} weight="fill" />
            <Text style={[type.smallMedium, { color: colors.onAccent }]}>Mark shopping done</Text>
          </Pressable>
          <Pressable
            onPress={resetGroceries}
            hitSlop={8}
            accessibilityLabel="Refresh grocery list"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radius.pill,
              backgroundColor: colors.accentSoft,
            }}
          >
            <ArrowClockwise size={15} color={colors.accent} />
            <Text style={[type.smallMedium, { color: colors.accent }]}>Refresh</Text>
          </Pressable>
        </View>
      </Card>

      {sections.map((section) => (
        <View key={section.category}>
          <SectionTitle>{CATEGORY_LABELS[section.category]}</SectionTitle>
          <Card style={{ gap: spacing.md, padding: spacing.md }}>
            {section.items.map((item) => {
              const done = !!checked[item.key];
              const reason =
                item.sources.length === 0
                  ? 'added by you'
                  : item.sources.length > 2
                    ? `for ${item.sources.slice(0, 2).join(', ')} +${item.sources.length - 2} more`
                    : `for ${item.sources.join(', ')}`;
              return (
                <View
                  key={item.key}
                  style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}
                >
                  <Pressable
                    onPress={() => toggleChecked(item.key)}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        marginTop: 2,
                        borderRadius: radius.sm,
                        borderWidth: 1.5,
                        borderColor: done ? colors.accent : colors.borderStrong,
                        backgroundColor: done ? colors.accent : 'transparent',
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          type.body,
                          {
                            color: done ? colors.textFaint : colors.text,
                            textDecorationLine: done ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {item.item}
                      </Text>
                      <Text style={[type.small, { color: colors.textFaint }]} numberOfLines={1}>
                        {reason}
                      </Text>
                    </View>
                    <Text style={[type.statSmall, { color: colors.textSecondary, marginTop: 2 }]}>
                      {item.qty}
                      {item.unit ? ` ${item.unit}` : ''}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => removeItem(item.key)}
                    hitSlop={8}
                    accessibilityLabel={`Remove ${item.item}`}
                    style={{ padding: 3, marginTop: 1 }}
                  >
                    <X size={15} color={colors.textFaint} />
                  </Pressable>
                </View>
              );
            })}
          </Card>
        </View>
      ))}

      <SectionTitle>Add an item</SectionTitle>
      <Card style={{ gap: spacing.md, padding: spacing.md }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
          }}
        >
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="e.g. Paper towels"
            placeholderTextColor={colors.textFaint}
            onSubmitEditing={submitNew}
            returnKeyType="done"
            style={[type.body, { color: colors.text, flex: 1, paddingVertical: spacing.md }]}
          />
          <Pressable
            onPress={submitNew}
            hitSlop={8}
            accessibilityLabel="Add grocery item"
            style={{
              width: 34,
              height: 34,
              borderRadius: radius.pill,
              backgroundColor: newName.trim() ? colors.accent : colors.track,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={18} color={newName.trim() ? colors.onAccent : colors.textFaint} weight="bold" />
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {CATEGORY_ORDER.map((c) => (
            <Chip
              key={c}
              label={CATEGORY_LABELS[c]}
              selected={newCat === c}
              onPress={() => setNewCat(c)}
            />
          ))}
        </View>
      </Card>
    </Screen>
  );
}
