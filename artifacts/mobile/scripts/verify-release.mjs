// EAS invokes this guard only for the production profile. No credentials are printed.
if (process.env.EAS_BUILD_PROFILE === 'production') {
  const failures = [];
  const project = process.env.EXPO_PUBLIC_PLAY_CLOUD_PROJECT_NUMBER;
  const contact = process.env.EXPO_PUBLIC_SUPPORT_EMAIL;
  const policy = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
  const retention = process.env.EXPO_PUBLIC_AI_PROVIDER_RETENTION;
  if (!project || !/^\d+$/.test(project)) failures.push('linked Play Integrity cloud project number');
  if (!contact || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) failures.push('publisher-approved public support email');
  if (!policy || !policy.startsWith('https://')) failures.push('public HTTPS privacy policy URL');
  if (!retention || retention.length < 50) failures.push('verified hosting and AI retention disclosure');
  if (!failures.length) {
    try {
      const response = await fetch(policy, { redirect: 'error', signal: AbortSignal.timeout(10_000) });
      const text = await response.text();
      if (!response.ok || !text.includes(contact) || !text.includes(retention)) failures.push('published policy matching the build disclosures');
    } catch { failures.push('reachable published privacy policy'); }
  }
  if (failures.length) {
    console.error(`Production release blocked: configure ${failures.join('; ')}. See docs/playstore-release.md.`);
    process.exitCode = 1;
  }
}
