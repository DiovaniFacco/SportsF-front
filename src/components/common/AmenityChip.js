import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  Shirt,
  Car,
  Lightbulb,
  UtensilsCrossed,
  Umbrella,
  ShoppingBag,
  Beer,
  Wifi,
  Check,
} from 'lucide-react';
import { theme } from '../../styles/theme';

const AMENITY_ICONS = [
  { keywords: ['vestiário', 'vestiario'], icon: Shirt },
  { keywords: ['estacionamento', 'parking', 'valet'], icon: Car },
  { keywords: ['iluminação', 'iluminacao', 'led'], icon: Lightbulb },
  { keywords: ['lanchonete', 'gourmet', 'restaurante', 'café', 'cafe'], icon: UtensilsCrossed },
  { keywords: ['coberta', 'coberto', 'teto'], icon: Umbrella },
  { keywords: ['loja', 'pro shop', 'shop'], icon: ShoppingBag },
  { keywords: ['bar', 'sunset', 'drink'], icon: Beer },
  { keywords: ['wi-fi', 'wifi', 'internet'], icon: Wifi },
];

function getAmenityIcon(label = '') {
  const normalized = label.toLowerCase();
  const match = AMENITY_ICONS.find((entry) =>
    entry.keywords.some((k) => normalized.includes(k))
  );
  return (match && match.icon) || Check;
}

export function AmenityChip({ label }) {
  const IconComponent = getAmenityIcon(label);

  return (
    <View style={styles.row}>
      <IconComponent size={13} color={theme.colors.textMuted} strokeWidth={1.75} />
      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '100%',
  },
  text: {
    fontSize: theme.typography.sizes.bodySmall,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
  },
});