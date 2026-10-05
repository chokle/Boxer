import { createHash } from 'node:crypto';
import { GoogleAuth } from 'google-auth-library';

export const PACKAGE_NAME = 'com.boxerai.app';
const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/playintegrity'] });

export interface IntegrityVerdict {
  requestDetails?: { requestPackageName?: string; requestHash?: string; timestampMillis?: string };
  appIntegrity?: { appRecognitionVerdict?: string; packageName?: string; certificateSha256Digest?: string[] };
  accountDetails?: { appLicensingVerdict?: string };
  deviceIntegrity?: { deviceRecognitionVerdict?: string[] };
}

export function isTrustedVerdict(verdict: IntegrityVerdict, rawBody: string, certificates: string[], now = Date.now()): boolean {
  const details = verdict.requestDetails;
  const timestamp = Number(details?.timestampMillis);
  return certificates.length > 0 &&
    details?.requestPackageName === PACKAGE_NAME &&
    details.requestHash === createHash('sha256').update(rawBody).digest('hex') &&
    Number.isFinite(timestamp) && timestamp <= now + 10_000 && timestamp >= now - 120_000 &&
    verdict.appIntegrity?.appRecognitionVerdict === 'PLAY_RECOGNIZED' &&
    verdict.appIntegrity.packageName === PACKAGE_NAME &&
    !!verdict.appIntegrity.certificateSha256Digest?.some(c => certificates.includes(c)) &&
    verdict.accountDetails?.appLicensingVerdict === 'LICENSED' &&
    !!verdict.deviceIntegrity?.deviceRecognitionVerdict?.includes('MEETS_DEVICE_INTEGRITY');
}

export async function verifyIntegrityToken(token: string, rawBody: string): Promise<boolean> {
  const certificates = (process.env.PLAY_SIGNING_CERTIFICATE_SHA256 ?? '').split(',').map(c => c.trim()).filter(Boolean);
  if (!certificates.length || !token || token.length > 16_384) return false;
  const client = await auth.getClient();
  const result = await client.request<{ tokenPayloadExternal?: IntegrityVerdict }>({
    url: `https://playintegrity.googleapis.com/v1/${PACKAGE_NAME}:decodeIntegrityToken`,
    method: 'POST',
    data: { integrity_token: token },
    timeout: 10_000,
    retry: false,
  });
  return !!result.data.tokenPayloadExternal && isTrustedVerdict(result.data.tokenPayloadExternal, rawBody, certificates);
}
