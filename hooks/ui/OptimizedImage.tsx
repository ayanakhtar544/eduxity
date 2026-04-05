\import React from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface OptimizedImageProps {
  url: string;
  style?: any;
  blurhash?: string; // Generated on your backend when image is uploaded
}

export default function OptimizedImage({ url, style, blurhash }: OptimizedImageProps) {
  // A generic grey blurhash as fallback if you don't pass one from the database
  const defaultBlurhash = 'LKN]Rv%2Tw=w]~U@D*9FpiImWVIU';

  return (
    <Image
      style={[styles.image, style]}
      source={{ uri: url }}
      // expo-image natively understands blurhash strings passed to the placeholder prop!
      placeholder={blurhash || defaultBlurhash}
      contentFit="cover"
      transition={300} // Smooth 300ms fade-in effect
      cachePolicy="memory-disk" // 🔥 Crucial: Saves to hard drive so it loads instantly offline next time
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});