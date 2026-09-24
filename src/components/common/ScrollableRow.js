import React, { useCallback, useRef, useState } from 'react';
import { Platform, StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

function hexToRgba(hex, alpha) {
  if (!hex || typeof hex !== 'string') return `rgba(255,255,255,${alpha})`;
  let h = hex.replace('#', '').trim();
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  }
  if (h.length !== 6) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(255,255,255,${alpha})`;
  }
  return `rgba(${r},${g},${b},${alpha})`;
}

const SCROLL_STEP = 240;
const END_THRESHOLD = 12;
const EDGE_WIDTH = 52;

export function ScrollableRow({
  children,
  contentContainerStyle,
  style,
  edgeColor,
  scrollViewProps = {},
  accessibilityLabel = 'Conteúdo com rolagem horizontal',
}) {
  const { colors } = useTheme();
  const bg = edgeColor || colors.surface;

  const flatContent = StyleSheet.flatten(contentContainerStyle) || {};
  const baseRightPad =
    flatContent.paddingRight ?? flatContent.paddingHorizontal ?? flatContent.padding ?? 16;

  const scrollRef = useRef(null);
  const metricsRef = useRef({ offsetX: 0, layoutWidth: 0, contentWidth: 0 });
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const recompute = useCallback((m) => {
    const { offsetX, layoutWidth, contentWidth } = m;
    const hasOverflow = contentWidth > layoutWidth + END_THRESHOLD;
    if (!hasOverflow || layoutWidth === 0) {
      setShowLeft(false);
      setShowRight(false);
      return;
    }
    setShowLeft(offsetX > END_THRESHOLD);
    setShowRight(offsetX + layoutWidth < contentWidth - END_THRESHOLD);
  }, []);

  const handleScroll = useCallback(
    (e) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      metricsRef.current = {
        offsetX: contentOffset?.x ?? 0,
        layoutWidth: layoutMeasurement?.width ?? metricsRef.current.layoutWidth,
        contentWidth: contentSize?.width ?? metricsRef.current.contentWidth,
      };
      recompute(metricsRef.current);
      scrollViewProps.onScroll?.(e);
    },
    [recompute, scrollViewProps]
  );

  const handleLayout = useCallback(
    (e) => {
      metricsRef.current.layoutWidth = e.nativeEvent.layout.width;
      recompute(metricsRef.current);
      scrollViewProps.onLayout?.(e);
    },
    [recompute, scrollViewProps]
  );

  const handleContentSizeChange = useCallback(
    (w) => {
      metricsRef.current.contentWidth = w;
      recompute(metricsRef.current);
      scrollViewProps.onContentSizeChange?.(w);
    },
    [recompute, scrollViewProps]
  );

  const scrollBy = useCallback(
    (direction) => {
      const step =
        metricsRef.current.layoutWidth > 0
          ? Math.round(metricsRef.current.layoutWidth * 0.8)
          : SCROLL_STEP;
      const nextX = Math.max(
        0,
        metricsRef.current.offsetX + (direction === 'right' ? step : -step)
      );
      if (Platform.OS === 'web') {
        try {
          scrollRef.current?.scrollTo?.({ x: nextX, animated: true });
        } catch {
          scrollRef.current?.scrollTo?.({ x: nextX });
        }
      } else {
        scrollRef.current?.scrollTo?.({ x: nextX, animated: true });
      }
    },
    []
  );

  const renderEdge = (side) => {
    const isRight = side === 'right';
    const visible = isRight ? showRight : showLeft;
    if (!visible) return null;
    const Icon = isRight ? ChevronRight : ChevronLeft;
    return (
      <View
        pointerEvents="box-none"
        style={[styles.edge, isRight ? styles.edgeRight : styles.edgeLeft, { width: EDGE_WIDTH }]}
      >
        <View pointerEvents="none" style={styles.fadeRow}>
          {(isRight ? [0, 0.35, 0.65, 0.92] : [0.92, 0.65, 0.35, 0]).map((alpha, idx) => (
            <View
              key={idx}
              style={[styles.fadeStrip, { backgroundColor: hexToRgba(bg, alpha) }]}
            />
          ))}
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={isRight ? 'Rolar para ver mais itens' : 'Rolar para ver itens anteriores'}
          onPress={() => scrollBy(isRight ? 'right' : 'left')}
          style={[
            styles.chevronBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Icon size={16} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View
      style={[styles.container, style]}
      onLayout={handleLayout}
      accessibilityLabel={accessibilityLabel}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        {...scrollViewProps}
        onScroll={handleScroll}
        onContentSizeChange={(w, h) => handleContentSizeChange(w, h)}
        contentContainerStyle={[
          contentContainerStyle,
          { paddingRight: baseRightPad + EDGE_WIDTH * 0.35 },
        ]}
      >
        {children}
      </ScrollView>
      {renderEdge('left')}
      {renderEdge('right')}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  edge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  edgeRight: {
    right: 0,
  },
  edgeLeft: {
    left: 0,
  },
  fadeRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  fadeStrip: {
    flex: 1,
  },
  chevronBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
});
