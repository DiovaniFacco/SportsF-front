import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect } from 'react';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

/**
 * Custom hook for Google OAuth authentication across Web, Android, and iOS.
 */
export function useGoogleAuth() {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId || 'sfacco-google-client-id.apps.googleusercontent.com',
    webClientId: webClientId || undefined,
    androidClientId: androidClientId || undefined,
    iosClientId: iosClientId || undefined,
  });

  return {
    request,
    response,
    promptAsync,
    isConfigured: !!(webClientId || androidClientId || iosClientId),
  };
}
