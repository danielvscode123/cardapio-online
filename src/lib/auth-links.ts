import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export function getAuthRedirectUrl() {
  if (Platform.OS === 'web' && typeof globalThis.location !== 'undefined') {
    return `${globalThis.location.origin}/activation`;
  }

  return Linking.createURL('/activation');
}
