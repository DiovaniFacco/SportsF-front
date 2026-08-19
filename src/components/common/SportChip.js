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

function BasketballIcon({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.5} stroke={color} strokeWidth={1.5} />
      <Line x1={2.5} y1={12} x2={21.5} y2={12} stroke={color} strokeWidth={1.3} />
      <Line x1={12} y1={2.5} x2={12} y2={21.5} stroke={color} strokeWidth={1.3} />
      <Path
        d="M5 5C8.5 8.5 8.5 15.5 5 19"
        stroke={color}
        strokeWidth={1.3}
      />
      <Path
        d="M19 5C15.5 8.5 15.5 15.5 19 19"
        stroke={color}
        strokeWidth={1.3}
      />
    </Svg>
  );
}

function BeachTennisIcon({ color }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.5} stroke={color} strokeWidth={1.5} />
      <Line x1={12} y1={2.5} x2={12} y2={21.5} stroke={color} strokeWidth={1.3} />
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.3} />
      <Line x1={2.5} y1={12} x2={21.5} y2={12} stroke={color} strokeWidth={1.3} />
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
  FootballIcon,
  FutsalIcon,
  VolleyballIcon,
  BasketballIcon,
  BeachTennisIcon,
  TennisIcon: BeachTennisIcon,
  PadelIcon: BeachTennisIcon,
  AllSportsIcon,
};

export function SportChip({ selectedSport, onSelectSport }) {
  const [categories, setCategories] = useState([
    { id: 'Todos', label: 'Todos', IconComponent: AllSportsIcon }
  ]);

  useEffect(() => {
    async function loadSportsData() {
      const sportsFromApi = await getSports();
      const mapped = sportsFromApi.map((s) => {
        const iconKey = s.icon || 'DefaultSportIcon';
        const IconComponent = ICON_MAP[iconKey] || DefaultSportIcon;
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
    <View style={styles.sectionContainer}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Esportes</Text>
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
          const iconColor = isSelected ? theme.colors.white : theme.colors.textPrimary;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => onSelectSport(item.id)}
              style={[
                styles.card,
                isSelected ? styles.cardSelected : styles.cardDefault,
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
                  isSelected ? styles.labelSelected : styles.labelDefault,
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
    backgroundColor: theme.colors.surface,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  scrollContainer: {
    paddingHorizontal: theme.spacing.md,
    gap: 10,
  },
  card: {
    width: 76,
    height: 90,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  cardDefault: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardSelected: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconCircleDefault: {
    backgroundColor: 'transparent',
  },
  iconCircleSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  labelDefault: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  labelSelected: {
    color: theme.colors.white,
    fontWeight: '700',
  },
});
