import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Svg, { Circle, Path, Polygon, Line } from 'react-native-svg';
import { Trophy, Dribbble } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { theme } from '../../styles/theme';
import { getSports } from '../../api/sports';

// Custom Crisp Sports SVG Icons
function FootballIcon({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.5} stroke={color} strokeWidth={1.5} />
      <Polygon
        points="12,7 14.5,8.8 13.5,11.8 10.5,11.8 9.5,8.8"
        fill={color}
      />
      <Line x1={12} y1={7} x2={12} y2={2.5} stroke={color} strokeWidth={1.2} />
      <Line x1={14.5} y1={8.8} x2={19} y2={6.5} stroke={color} strokeWidth={1.2} />
      <Line x1={13.5} y1={11.8} x2={17.5} y2={15.5} stroke={color} strokeWidth={1.2} />
      <Line x1={10.5} y1={11.8} x2={6.5} y2={15.5} stroke={color} strokeWidth={1.2} />
      <Line x1={9.5} y1={8.8} x2={5} y2={6.5} stroke={color} strokeWidth={1.2} />
    </Svg>
  );
}

function FutsalIcon({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.5} stroke={color} strokeWidth={1.5} />
      <Circle cx={12} cy={12} r={3.5} fill={color} />
      <Line x1={12} y1={2.5} x2={12} y2={8.5} stroke={color} strokeWidth={1.2} />
      <Line x1={12} y1={15.5} x2={12} y2={21.5} stroke={color} strokeWidth={1.2} />
      <Line x1={2.5} y1={12} x2={8.5} y2={12} stroke={color} strokeWidth={1.2} />
      <Line x1={15.5} y1={12} x2={21.5} y2={12} stroke={color} strokeWidth={1.2} />
    </Svg>
  );
}

function VolleyballIcon({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.5} stroke={color} strokeWidth={1.5} />
      <Path
        d="M12 2.5C12 9 8 13.5 2.5 14"
        stroke={color}
        strokeWidth={1.3}
      />
      <Path
        d="M12 2.5C14.5 8 20 10.5 21.5 11"
        stroke={color}
        strokeWidth={1.3}
      />
      <Path
        d="M3.5 7.5C9.5 9 14.5 13.5 15.5 21.5"
        stroke={color}
        strokeWidth={1.3}
      />
    </Svg>
  );
}

function FutevoleiIcon({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.5} stroke={color} strokeWidth={1.5} />
      <Line x1={2.5} y1={14} x2={21.5} y2={14} stroke={color} strokeWidth={1.3} strokeDasharray="2 2" />
      <Path
        d="M12 2.5C12 9 8 13.5 2.5 14"
        stroke={color}
        strokeWidth={1.3}
      />
      <Path
        d="M12 2.5C14.5 8 20 10.5 21.5 11"
        stroke={color}
        strokeWidth={1.3}
      />
    </Svg>
  );
}

function BeachTennisIcon({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={10} r={7.5} stroke={color} strokeWidth={1.5} />
      <Circle cx={9.5} cy={8.5} r={1} fill={color} />
      <Circle cx={12.5} cy={8.5} r={1} fill={color} />
      <Circle cx={11} cy={11.5} r={1} fill={color} />
      <Line x1={16} y1={15} x2={21} y2={20} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={19} cy={6} r={2} stroke={color} strokeWidth={1.3} fill={color} />
    </Svg>
  );
}

function PadelIcon({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={10} r={7.5} stroke={color} strokeWidth={1.5} />
      <Circle cx={9} cy={8} r={0.8} fill={color} />
      <Circle cx={13} cy={8} r={0.8} fill={color} />
      <Circle cx={11} cy={10} r={0.8} fill={color} />
      <Circle cx={9} cy={12} r={0.8} fill={color} />
      <Circle cx={13} cy={12} r={0.8} fill={color} />
      <Line x1={16} y1={15} x2={21} y2={20} stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

function AllSportsIcon({ color }) {
  return <Trophy size={20} color={color} strokeWidth={1.8} />;
}

function DefaultSportIcon({ color }) {
  return <Dribbble size={20} color={color} strokeWidth={1.8} />;
}

const ICON_MAP = {
  VolleyballIcon,
  FutevoleiIcon,
  BeachTennisIcon,
  PadelIcon,
  'Vôlei': VolleyballIcon,
  'Volei': VolleyballIcon,
  'Futevôlei': FutevoleiIcon,
  'Futvolei': FutevoleiIcon,
  'Beach Tennis': BeachTennisIcon,
  'Padel': PadelIcon,
  AllSportsIcon,
};

export function SportChip({ selectedSport, onSelectSport }) {
  const { colors } = useTheme();
  const [categories, setCategories] = useState([
    { id: 'Todos', label: 'Todos', IconComponent: AllSportsIcon }
  ]);

  useEffect(() => {
    async function loadSportsData() {
      const sportsFromApi = await getSports();
      const mapped = sportsFromApi.map((s) => {
        const iconKey = s.icon || s.name;
        const IconComponent = ICON_MAP[iconKey] || ICON_MAP[s.name] || DefaultSportIcon;
        return {
          id: s.name,
          label: s.name,
          IconComponent,
        };
      });

      setCategories([{ id: 'Todos', label: 'Todos', IconComponent: AllSportsIcon }, ...mapped]);
    }

    loadSportsData();
  }, []);

  return (
    <View style={[styles.sectionContainer, { backgroundColor: colors.surface }]}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Esportes</Text>
      </View>

      {/* Horizontal Cards List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {categories.map((item) => {
          const isSelected = selectedSport === item.id;
          const { IconComponent } = item;
          const iconColor = isSelected ? colors.white : colors.textPrimary;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => onSelectSport(item.id)}
              style={[
                styles.card,
                isSelected ? styles.cardSelected : styles.cardUnselected,
                isSelected
                  ? { backgroundColor: colors.primary, shadowColor: colors.primary }
                  : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  isSelected ? styles.iconCircleSelected : styles.iconCircleDefault,
                ]}
              >
                <IconComponent color={iconColor} />
              </View>
              <Text
                style={[
                  styles.cardLabel,
                  { color: isSelected ? colors.white : colors.textPrimary, fontWeight: isSelected ? '700' : '600' },
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.h4,
    fontWeight: '700',
  },
  scrollContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  card: {
    width: 72,
    height: 82,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xs,
  },
  cardSelected: {
    ...theme.shadows.md,
  },
  cardUnselected: {
    ...theme.shadows.subtle,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconCircleDefault: {
    backgroundColor: 'transparent',
  },
  iconCircleSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardLabel: {
    fontSize: theme.typography.sizes.caption,
    textAlign: 'center',
  },
});

