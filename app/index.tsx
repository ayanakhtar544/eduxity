// File: app/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import BrandLogo from "../components/ui/BrandLogo";
import EduxityLoader from "../components/ui/EduxityLoader";

const { width, height } = Dimensions.get("window");

// 🌟 Floating Background Element Component
const FloatingElement = ({
  size,
  color,
  startPos,
  duration,
  delay,
}: {
  size: number;
  color: string;
  startPos: { x: number; y: number };
  duration: number;
  delay: number;
}) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-30, {
          duration: duration,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: duration,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.floatingElement,
        animatedStyle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: startPos.x,
          top: startPos.y,
        },
      ]}
    />
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // 🛡️ Logic to prevent flash: Check auth and delay splash slightly
  useEffect(() => {
    const timer = setTimeout(() => setIsChecking(false), 800); // Thoda zyada time diya smooth transition ke liye
    return () => clearTimeout(timer);
  }, []);

  if (isChecking) {
    return (
      <View style={styles.loaderScreen}>
        <EduxityLoader />
      </View>
    );
  }

  // 👇 ACTUAL ADVANCE WELCOME SCREEN 👇
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* 🌌 Background Floating Blobs for a modern tech feel */}
      <View style={styles.backgroundBlobs}>
        <FloatingElement
          size={200}
          color="rgba(79, 70, 229, 0.05)"
          startPos={{ x: -50, y: height * 0.1 }}
          duration={4000}
          delay={0}
        />
        <FloatingElement
          size={300}
          color="rgba(236, 72, 153, 0.05)"
          startPos={{ x: width * 0.5, y: height * 0.6 }}
          duration={5000}
          delay={1000}
        />
        <FloatingElement
          size={150}
          color="rgba(16, 185, 129, 0.05)"
          startPos={{ x: width * 0.8, y: height * 0.2 }}
          duration={3500}
          delay={500}
        />
      </View>

      <View style={styles.content}>
        {/* 🚀 Animated Logo Section */}
        <Animated.View
          entering={FadeInDown.duration(800).springify().damping(12)}
          style={styles.logoWrapper}
        >
          <BrandLogo variant="hero" withGlow={true} />
        </Animated.View>

        {/* ✍️ Animated Typography Section */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(800).springify()}
          style={styles.textWrapper}
        >
          <Text style={styles.title}>
            Welcome to <Text style={styles.highlightText}>Eduxity</Text>
          </Text>
          <Text style={styles.subtitle}>
            Your all-in-one productivity hub. Build study circles, conquer
            tasks, and learn together.
          </Text>
        </Animated.View>

        {/* 🌟 Feature Highlights (Mini Cards) */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(800).springify()}
          style={styles.featuresRow}
        >
          <View style={styles.featurePill}>
            <Ionicons name="flash" size={16} color="#4f46e5" />
            <Text style={styles.featureText}>Fast</Text>
          </View>
          <View style={styles.featurePill}>
            <Ionicons name="people" size={16} color="#ec4899" />
            <Text style={styles.featureText}>Social</Text>
          </View>
          <View style={styles.featurePill}>
            <Ionicons name="school" size={16} color="#10b981" />
            <Text style={styles.featureText}>Smart</Text>
          </View>
        </Animated.View>

        {/* 🎯 Call to Action Section */}
        <Animated.View
          entering={FadeIn.delay(700).duration(800)}
          style={styles.ctaWrapper}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push("/auth")}
            style={styles.mainButtonWrapper}
          >
            <LinearGradient
              colors={["#4f46e5", "#3b82f6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainButtonGradient}
            >
              <Text style={styles.buttonText}>Get Started Now</Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color="#fff"
                style={styles.buttonIcon}
              />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Join thousands of students upgrading their study game.
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

// ==========================================
// 🎨 PREMIUM STYLING
// ==========================================
const styles = StyleSheet.create({
  loaderScreen: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8fafc", // Modern off-white slate
  },
  backgroundBlobs: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: -1,
  },
  floatingElement: {
    position: "absolute",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    zIndex: 1,
  },
  logoWrapper: {
    marginBottom: 40,
    alignItems: "center",
  },
  textWrapper: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -1,
  },
  highlightText: {
    color: "#4f46e5", // Brand Indigo
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500",
    paddingHorizontal: 10,
  },
  featuresRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 50,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  featureText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginLeft: 6,
  },
  ctaWrapper: {
    width: "100%",
    alignItems: "center",
    position: "absolute",
    bottom: 50, // Screen ke bottom me chipka rahega
    paddingHorizontal: 30,
  },
  mainButtonWrapper: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 20,
  },
  mainButtonGradient: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 10,
  },
  footerText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
  },
});
