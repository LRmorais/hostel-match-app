import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SPACING } from '../utils/constants';

const SplashScreen: React.FC = () => {
  // Animation refs
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const titleTranslateY = useRef(new Animated.Value(50)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence of animations
    const animationSequence = Animated.sequence([
      // Logo animation
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),

      // Title animation
      Animated.parallel([
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),

      // Subtitle animation
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),

      // Loader animation
      Animated.timing(loaderOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start();
  }, []);

  const LogoIcon = () => (
    <Animated.View
      style={[
        styles.logoContainer,
        {
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        },
      ]}
    >
      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>H</Text>
      </View>
    </Animated.View>
  );

  const PulsingDot = () => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      // Start pulsing after other animations
      setTimeout(() => pulse.start(), 2000);
    }, []);

    return (
      <Animated.View
        style={[
          styles.pulsingDot,
          {
            opacity: loaderOpacity,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#FF8A5C', '#FF6B35', '#4ECDC4']}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
        style={styles.gradient}
      />

      {/* Overlay for better readability */}
      <View style={styles.overlay} />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo */}
        <LogoIcon />

        {/* App Title */}
        <Animated.Text
          style={[
            styles.title,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          Hostel Match
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          style={[
            styles.subtitle,
            { opacity: subtitleOpacity },
          ]}
        >
          Conecte-se com viajantes
        </Animated.Text>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <PulsingDot />
          <Animated.Text
            style={[
              styles.loadingText,
              { opacity: loaderOpacity },
            ]}
          >
            Preparando sua aventura...
          </Animated.Text>
        </View>
      </View>

      {/* Bottom branding */}
      <Animated.View
        style={[
          styles.brandingContainer,
          { opacity: subtitleOpacity },
        ]}
      >
        <Text style={styles.brandingText}>
          Conheça pessoas que estão vivendo{'\n'}a mesma viagem que você — agora.
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
  },
  logoContainer: {
    marginBottom: SPACING.XXL,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    textAlign: 'center',
    marginBottom: SPACING.MD,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: SPACING.XXL * 2,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: SPACING.XXL,
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.WHITE,
    marginBottom: SPACING.MD,
    shadowColor: COLORS.WHITE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '400',
  },
  brandingContainer: {
    position: 'absolute',
    bottom: SPACING.XXL + 20,
    left: SPACING.XL,
    right: SPACING.XL,
    alignItems: 'center',
  },
  brandingText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default SplashScreen;
