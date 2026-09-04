import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing } from '@/constants/theme';

const pizzaImage = require('../../assets/images/pizza-splash.png');
const useNativeDriver = Platform.OS !== 'web';

type BrandSplashProps = {
  message?: string;
};

export function BrandSplash({ message = 'Preparando sua experiência…' }: BrandSplashProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [entrance] = useState(() => new Animated.Value(0));
  const [rotation] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0));
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      entrance.setValue(1);
      rotation.setValue(0);
      pulse.setValue(0.35);
      progress.setValue(0.6);
      return;
    }

    const entranceAnimation = Animated.timing(entrance, {
      duration: 550,
      easing: Easing.out(Easing.cubic),
      isInteraction: false,
      toValue: 1,
      useNativeDriver,
    });
    const rotationAnimation = Animated.loop(
      Animated.timing(rotation, {
        duration: 11000,
        easing: Easing.linear,
        isInteraction: false,
        toValue: 1,
        useNativeDriver,
      }),
    );
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          toValue: 1,
          useNativeDriver,
        }),
        Animated.timing(pulse, {
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          toValue: 0,
          useNativeDriver,
        }),
      ]),
    );
    const progressAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          duration: 1500,
          easing: Easing.inOut(Easing.cubic),
          isInteraction: false,
          toValue: 1,
          useNativeDriver,
        }),
        Animated.timing(progress, {
          duration: 0,
          isInteraction: false,
          toValue: 0,
          useNativeDriver,
        }),
      ]),
    );

    entranceAnimation.start();
    rotationAnimation.start();
    pulseAnimation.start();
    progressAnimation.start();

    return () => {
      entranceAnimation.stop();
      rotationAnimation.stop();
      pulseAnimation.stop();
      progressAnimation.stop();
    };
  }, [entrance, progress, pulse, reduceMotion, rotation]);

  const pizzaRotation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const pizzaScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.035],
  });
  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08],
  });
  const steamOffset = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [5, -7],
  });
  const progressOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-52, 52],
  });

  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <View pointerEvents="none" style={styles.ambientTop} />
      <View pointerEvents="none" style={styles.ambientBottom} />
      <View pointerEvents="none" style={[styles.crumb, styles.crumbOne]} />
      <View pointerEvents="none" style={[styles.crumb, styles.crumbTwo]} />
      <View pointerEvents="none" style={[styles.crumb, styles.crumbThree]} />

      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          style={[
            styles.header,
            {
              opacity: entrance,
              transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
            },
          ]}
        >
          <View style={styles.brandSeal}>
            <Text style={styles.brandInitials}>MB</Text>
          </View>
          <View>
            <Text style={styles.brandName}>MESA BOA</Text>
            <Text style={styles.brandCaption}>COMANDA INTELIGENTE</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.hero,
            {
              opacity: entrance,
              transform: [
                { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
              ],
            },
          ]}
        >
          <Text style={styles.eyebrow}>DO FORNO PARA A MESA</Text>

          <View style={styles.ovenStage}>
            <Animated.View
              style={[
                styles.ovenGlow,
                {
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.48] }),
                  transform: [{ scale: glowScale }],
                },
              ]}
            />
            <View style={styles.ovenRingOuter} />
            <View style={styles.ovenRingInner} />

            <Animated.View
              style={[
                styles.steam,
                {
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.72] }),
                  transform: [{ translateY: steamOffset }],
                },
              ]}
            >
              <View style={[styles.steamLine, styles.steamShort]} />
              <View style={styles.steamLine} />
              <View style={[styles.steamLine, styles.steamShort]} />
            </Animated.View>

            <Animated.Image
              accessibilityLabel="Pizza sendo preparada"
              source={pizzaImage}
              style={[
                styles.pizza,
                { transform: [{ rotate: pizzaRotation }, { scale: pizzaScale }] },
              ]}
            />
            <View style={styles.readyDot} />
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.title}>Quase no ponto.</Text>
            <Text style={styles.subtitle}>
              Organizando salão, cozinha e caixa para o serviço começar redondo.
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.statusCard, { opacity: entrance }]}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusLabel}>PREPARANDO</Text>
            <Text style={styles.statusNumber}>• • •</Text>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[styles.progressPulse, { transform: [{ translateX: progressOffset }] }]}
            />
          </View>
          <Text accessibilityLiveRegion="polite" style={styles.statusText}>{message}</Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.ink,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    justifyContent: 'space-between',
  },
  ambientTop: {
    position: 'absolute',
    width: 290,
    height: 290,
    top: -165,
    right: -105,
    borderRadius: 145,
    backgroundColor: colors.inkSoft,
    opacity: 0.82,
  },
  ambientBottom: {
    position: 'absolute',
    width: 220,
    height: 220,
    bottom: -132,
    left: -90,
    borderWidth: 34,
    borderColor: colors.inkSoft,
    borderRadius: 110,
    opacity: 0.58,
  },
  crumb: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.mustard,
    opacity: 0.55,
  },
  crumbOne: { top: '20%', left: '12%' },
  crumbTwo: { top: '27%', right: '14%', width: 4, height: 4 },
  crumbThree: { bottom: '24%', right: '9%', backgroundColor: colors.tomato },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  brandSeal: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(255, 249, 238, 0.22)',
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inkSoft,
  },
  brandInitials: {
    color: colors.mustard,
    fontFamily: fonts.display,
    fontSize: 15,
  },
  brandName: {
    color: colors.cream,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 2.1,
  },
  brandCaption: {
    marginTop: 2,
    color: colors.sage,
    fontFamily: fonts.body,
    fontSize: 8,
    letterSpacing: 1.25,
  },
  hero: {
    alignItems: 'center',
    marginVertical: 'auto',
  },
  eyebrow: {
    marginBottom: spacing.lg,
    color: colors.mustard,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 2.2,
  },
  ovenStage: {
    width: 226,
    height: 226,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ovenGlow: {
    position: 'absolute',
    width: 206,
    height: 206,
    borderRadius: 103,
    backgroundColor: colors.tomato,
  },
  ovenRingOuter: {
    position: 'absolute',
    width: 222,
    height: 222,
    borderWidth: 1,
    borderColor: 'rgba(230, 184, 74, 0.32)',
    borderRadius: 111,
  },
  ovenRingInner: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderWidth: 1,
    borderColor: 'rgba(255, 249, 238, 0.16)',
    borderRadius: 90,
    backgroundColor: 'rgba(23, 56, 45, 0.46)',
  },
  steam: {
    position: 'absolute',
    top: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  steamLine: {
    width: 3,
    height: 19,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
    transform: [{ rotate: '9deg' }],
  },
  steamShort: { height: 12, marginTop: 5, transform: [{ rotate: '-8deg' }] },
  pizza: {
    width: 154,
    height: 154,
  },
  readyDot: {
    position: 'absolute',
    width: 13,
    height: 13,
    right: 27,
    bottom: 45,
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: 7,
    backgroundColor: colors.success,
  },
  heroCopy: {
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    color: colors.cream,
    fontFamily: fonts.display,
    fontSize: 38,
    letterSpacing: -1.1,
    lineHeight: 44,
    textAlign: 'center',
  },
  subtitle: {
    maxWidth: 320,
    color: colors.sage,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  statusCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 249, 238, 0.14)',
    borderRadius: radius.lg,
    backgroundColor: colors.inkSoft,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statusLabel: {
    color: colors.mustard,
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    letterSpacing: 1.8,
  },
  statusNumber: {
    color: colors.tomato,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
  },
  progressTrack: {
    height: 3,
    overflow: 'hidden',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(201, 216, 196, 0.18)',
  },
  progressPulse: {
    alignSelf: 'center',
    width: 72,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.tomato,
  },
  statusText: {
    marginTop: spacing.md,
    color: colors.cream,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
});
