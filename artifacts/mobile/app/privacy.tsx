import React from 'react';
import { ScrollView, Text, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { PRIVACY_POLICY } from '@/lib/privacy';

export default function PrivacyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ padding: 24, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
    <TouchableOpacity accessibilityRole="button" onPress={() => router.back()}><Text style={{ color: colors.primary, marginBottom: 24 }}>Back</Text></TouchableOpacity>
    <Text selectable style={{ color: colors.foreground, fontSize: 16, lineHeight: 25 }}>{PRIVACY_POLICY}</Text>
    {process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL && <TouchableOpacity accessibilityRole="link" onPress={() => void Linking.openURL(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL!)}><Text style={{ color: colors.primary, marginTop: 24 }}>Published privacy policy</Text></TouchableOpacity>}
    <TouchableOpacity accessibilityRole="link" onPress={() => void Linking.openURL('https://openai.com/policies/privacy-policy/')}><Text style={{ color: colors.primary, marginTop: 24 }}>OpenAI Privacy Policy</Text></TouchableOpacity>
  </ScrollView>;
}
