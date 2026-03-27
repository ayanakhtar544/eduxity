import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

export default function ResourcePreview({ url }: { url: string }) {
  if (!url) return null;

  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getDrivePreviewUrl = (rawUrl: string) => {
    if (rawUrl.includes('drive.google.com')) {
      return rawUrl.replace('/view', '/preview').split('?')[0];
    }
    return rawUrl;
  };

  const videoId = getYoutubeVideoId(url);
  const isDrive = url.includes('drive.google.com');
  const previewUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : getDrivePreviewUrl(url);

  // 🔥 WEB PLATFORM FIX
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name={videoId ? "logo-youtube" : "cloud"} size={18} color={videoId ? "#ef4444" : "#15803d"} />
          <Text style={styles.headerText}>{videoId ? "YouTube Video" : "Drive Preview"}</Text>
        </View>
        
        {/* Web par iframe use hota hai */}
        <iframe
          src={previewUrl}
          style={{ width: '100%', height: 250, border: 'none' }}
          allowFullScreen
        />

        <TouchableOpacity style={styles.footerBtn} onPress={() => Linking.openURL(url)}>
          <Text style={styles.footerText}>Open in New Tab</Text>
          <Ionicons name="open-outline" size={16} color="#64748b" />
        </TouchableOpacity>
      </View>
    );
  }

  // 🔥 MOBILE PLATFORM (Android/iOS)
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name={videoId ? "logo-youtube" : "cloud"} size={18} color={videoId ? "#ef4444" : "#15803d"} />
        <Text style={styles.headerText}>{videoId ? "YouTube Video" : "Drive Preview"}</Text>
      </View>
      <View style={styles.webviewWrapper}>
        <WebView
          source={{ uri: previewUrl }}
          style={styles.webview}
          allowsFullscreenVideo={true}
          startInLoadingState={true}
          renderLoading={() => <ActivityIndicator color="#4f46e5" style={styles.loader} />}
        />
      </View>
      <TouchableOpacity style={styles.footerBtn} onPress={() => Linking.openURL(url)}>
        <Text style={styles.footerText}>Open Full Resource</Text>
        <Ionicons name="open-outline" size={16} color="#64748b" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 15, marginVertical: 10, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerText: { fontSize: 12, fontWeight: '800', color: '#475569', marginLeft: 8, textTransform: 'uppercase' },
  webviewWrapper: { height: 250, width: '100%', backgroundColor: '#000' },
  webview: { flex: 1 },
  loader: { position: 'absolute', top: '45%', left: '45%' },
  footerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 6 },
  footerText: { fontSize: 13, fontWeight: '700', color: '#64748b' }
});