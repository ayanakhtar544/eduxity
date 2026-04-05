import React from 'react';
import { View, TouchableOpacity, Modal, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

export default function ImageViewerModal({ visibleImage, setVisibleImage }: any) {
  if (!visibleImage) return null;

  return (
    <Modal visible={visibleImage !== null} transparent={true} animationType="fade" onRequestClose={() => setVisibleImage(null)}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity 
          style={{ position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, right: 20, zIndex: 10, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }} 
          onPress={() => setVisibleImage(null)}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        
        <Image 
          source={{ uri: visibleImage }} 
          style={{ width: '100%', height: '80%' }} 
          contentFit="contain" 
          transition={300} 
        />
      </View>
    </Modal>
  );
}