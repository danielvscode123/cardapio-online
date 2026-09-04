import Storage from 'expo-sqlite/kv-store';
import { memo, useEffect, useState } from 'react';
import { ColorValue, StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { colors, radius } from '@/constants/theme';

type IconifyIconProps = {
  icon: `${string}:${string}`;
  size?: number;
  color?: ColorValue;
  accessibilityLabel?: string;
};

const svgMemoryCache = new Map<string, string>();
const requestsInFlight = new Map<string, Promise<string>>();

function getIconUrl(icon: IconifyIconProps['icon'], size: number, color: ColorValue) {
  const [prefix, ...nameParts] = icon.split(':');
  const name = nameParts.join(':');
  const encodedColor = encodeURIComponent(String(color));

  return `https://api.iconify.design/${encodeURIComponent(prefix)}/${encodeURIComponent(name)}.svg?width=${size}&height=${size}&color=${encodedColor}`;
}

async function loadSvg(icon: IconifyIconProps['icon'], size: number, color: ColorValue) {
  const cacheKey = `iconify:${icon}:${size}:${String(color)}`;
  const memoryValue = svgMemoryCache.get(cacheKey);
  if (memoryValue) {
    return memoryValue;
  }

  const storedValue = await Storage.getItem(cacheKey);
  if (storedValue) {
    svgMemoryCache.set(cacheKey, storedValue);
    return storedValue;
  }

  const activeRequest = requestsInFlight.get(cacheKey);
  if (activeRequest) {
    return activeRequest;
  }

  const request = fetch(getIconUrl(icon, size, color)).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Iconify returned ${response.status}`);
    }

    const svg = await response.text();
    svgMemoryCache.set(cacheKey, svg);
    await Storage.setItem(cacheKey, svg);
    return svg;
  });

  requestsInFlight.set(cacheKey, request);

  try {
    return await request;
  } finally {
    requestsInFlight.delete(cacheKey);
  }
}

function IconifyIconComponent({
  icon,
  size = 24,
  color = colors.ink,
  accessibilityLabel,
}: IconifyIconProps) {
  const [svg, setSvg] = useState(() =>
    svgMemoryCache.get(`iconify:${icon}:${size}:${String(color)}`),
  );

  useEffect(() => {
    let isMounted = true;

    loadSvg(icon, size, color)
      .then((value) => {
        if (isMounted) {
          setSvg(value);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSvg(undefined);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [color, icon, size]);

  if (!svg) {
    return (
      <View
        accessibilityLabel={accessibilityLabel}
        style={[styles.fallback, { width: size, height: size }]}
      />
    );
  }

  return (
    <View accessibilityLabel={accessibilityLabel}>
      <SvgXml xml={svg} width={size} height={size} />
    </View>
  );
}

export const IconifyIcon = memo(IconifyIconComponent);

const styles = StyleSheet.create({
  fallback: {
    borderRadius: radius.sm,
    backgroundColor: colors.line,
    opacity: 0.55,
  },
});
