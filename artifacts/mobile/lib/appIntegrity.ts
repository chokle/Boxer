import { Platform } from 'react-native';
import * as AppIntegrity from '@expo/app-integrity';
import * as Crypto from 'expo-crypto';

let preparation: Promise<void> | undefined;
async function bounded<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Installation verification timed out. Please try again.')), 20_000);
    })]);
  } finally { if (timer) clearTimeout(timer); }
}
export async function getIntegrityToken(body: string): Promise<string> {
  const project = process.env.EXPO_PUBLIC_PLAY_CLOUD_PROJECT_NUMBER;
  if (Platform.OS !== 'android' || !project || !/^\d+$/.test(project)) {
    throw new Error('Verified AI coaching is available through the configured Google Play release. You can still use your profile and workout timer.');
  }
  preparation ??= AppIntegrity.prepareIntegrityTokenProviderAsync(project).catch(error => { preparation = undefined; throw error; });
  try { await bounded(preparation); } catch (error) { preparation = undefined; throw error; }
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, body);
  try { return await bounded(AppIntegrity.requestIntegrityCheckAsync(hash)); }
  catch (error) {
    preparation = undefined;
    throw new Error('Could not verify this installation. Please update Boxer AI from Google Play and try again.');
  }
}
