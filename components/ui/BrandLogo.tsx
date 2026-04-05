import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

const LOCAL_LOGO = require('../../assets/images/logo.png');


interface BrandLogoProps {
  // UI/UX Standards ke hisaab se fixed variants
  variant?: 'small' | 'medium' | 'large' | 'hero'; 
  withGlow?: boolean;
}

export default function BrandLogo({ variant = 'medium', withGlow = false }: BrandLogoProps) {
  
  // 📏 Dimensions strictly controlled based on industry standards
  let size = 36;
  switch (variant) {
    case 'small': size = 24; break;   // Bottom Tabs ya inline icons ke liye
    case 'medium': size = 36; break;  // Top Header navigation ke liye
    case 'large': size = 64; break;   // Profile avatar ya Bade cards ke liye
    case 'hero': size = 120; break;   // Loading Screen ya Splash ke liye
  }

  return (
    <View style={[
      styles.container, 
      { width: size, height: size, borderRadius: size / 2 }, 
      withGlow && styles.glow
    ]}>
      <Image 
         source={LOCAL_LOGO}
        style={[styles.logo, { borderRadius: size / 2 }]}
        contentFit="cover" // 'contain' se better 'cover' hai agar circle frame me fit karna hai
        transition={300} // Buttery smooth load
      />
    </View>
  );
}

// 🎨 ULTRA PREMIUM DESIGN
const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff', // Base white taaki dark mode ya transparent logo pop kare
    borderWidth: 1,
    borderColor: '#f1f5f9', // Ekdum patla, premium grey border (Apple style)
    overflow: 'visible', // Glow ko katne se bachata hai
  },
  logo: {
    width: '100%',
    height: '100%',
    // Extra protection taaki image bahar na nikle
    overflow: 'hidden', 
  },
  glow: {
    // Eduxity Brand Indigo Glow
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8, // Android ke liye solid elevation
  },
});