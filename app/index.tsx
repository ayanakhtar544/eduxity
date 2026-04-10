// File: app/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router"; // 🚨 Redirect add kiya
import React, { useEffect } from "react";
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
import { useUserStore } from "../store/useUserStore"; // 🚨 User store import kiya

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
  
  // 🛡️ NAYA LOGIC: Local state ki jagah Global auth state use kar rahe hain
  const { user, authReady } = useUserStore();

  // 🚦 STEP 1: Jab tak Firebase load ho raha hai, tumhara loader dikhega
  if (!authReady) {
    return (
      <View style={styles.loaderScreen}>
        <EduxityLoader />
      </View>
    );
  }

  // 🚦 STEP 2: Agar user already logged in hai, toh sidha Home (tabs) me bhej do (Ye fix karega Baar-Baar Login wala issue)
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  // 🚦 STEP 3: Agar user naya hai ya log out kar chuka hai, toh tumhara ye mast ACTUAL ADVANCE WELCOME SCREEN dikhao 👇
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
            onPress={() => router.push("/(auth)/auth")} // 🚨 Ensure it points to correct auth route
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
    backgroundColor: "#f8fafc",
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
    color: "#4f46e5", 
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
    bottom: 50, 
    paddingHorizontal: 30,
  },
  mainButtonWrapper: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
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