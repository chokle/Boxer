# Boxer AI Android release gates

The October 5 security fixes are source changes, not proof of deployment or Play acceptance. Keep the production release blocked until the gates below have receipts. The app remains account-free; paid coaching requires a genuine licensed Google Play install. Web/iOS coaching is unavailable through this Android admission path.

## Configure the existing publishing targets

- Expo project: `chokle/boxer-ai`, `b4008939-f94d-41dc-ab41-d969356cfebf`.
- Android package: `com.boxerai.app`. Preserve its existing Play signing identity. Production version codes are incremented remotely by EAS.
- Backend: `https://boxer-pzdn.onrender.com`. Do not infer deployment from a Git push; verify the deployed commit and HTTP behavior.

Link the app to the appropriate Google Cloud project in Play Console and enable the Play Integrity API. Grant the backend's service identity only the permissions required to decode this app's tokens. Configure Google Application Default Credentials in the backend environment using a supported service identity/secret mechanism; never commit a service-account key or put it in an `EXPO_PUBLIC_*` variable. Store publishing credentials only in EAS/Play's protected credential workflow.

Configure `EXPO_PUBLIC_PLAY_CLOUD_PROJECT_NUMBER` in the production EAS environment. Configure `PLAY_SIGNING_CERTIFICATE_SHA256` on the backend with the Google Play **app signing** certificate's base64url SHA-256 digest (not the upload-key certificate). Multiple approved digests may be comma-separated during a verified key rotation. To convert a colon-separated SHA-256 fingerprint, use `Buffer.from(fingerprint.replace(/:/g, ''), 'hex').toString('base64url')` locally; the fingerprint is public.

Apply `artifacts/api-server/migrations/20261005-ai-admission.sql` using the existing authenticated database migration workflow. The tables retain only daily counts and token hashes; expired token hashes are pruned on admitted requests, daily counts after seven days. They contain no profile, photo or note data. Back up the database and verify migration state before applying it; do not replace or reseed the community database.

Set `BOXER_AI_ENABLED=true` only after credentials, migration and a real Play-installed-device request pass. The default is fail-closed. `BOXER_AI_DAILY_LIMIT` defaults to 100 admitted requests globally and must be between 1 and 500. Each request has bounded inputs, at most 2500 completion tokens, no automatic model retry and a 45-second provider timeout. Also set provider-side monetary limits/alerts appropriate to the account. The request-count cap bounds application admission, not the provider's entire account spend. Google integrity tokens do not identify a boxer; these limits intentionally do not claim per-user billing or quotas.

The IP limiter uses Express's default untrusted-proxy setting. Behind a proxy it may group users conservatively. Configure a trusted proxy topology only after verifying that direct origin access and forwarded-header spoofing cannot bypass it. Model concurrency is capped at four per process; global request counts coordinate replicas through PostgreSQL. Provider errors do not refund the request-count budget.

## Privacy and data declarations

Publisher-approved values must be identical in production EAS and backend environments:

- `EXPO_PUBLIC_SUPPORT_EMAIL`: public support contact.
- `EXPO_PUBLIC_PRIVACY_POLICY_URL`: publicly reachable HTTPS policy, normally the deployed `/api/privacy` URL if this publisher approves it.
- `EXPO_PUBLIC_AI_PROVIDER_RETENTION`: verified description of actual hosting logs, AI-provider retention, training settings and deletion/contact handling. Do not guess zero retention from a code change. The API does not persist coaching submissions in the community database, but the operator/providers can retain logs.

The in-app policy and API policy have matching source text. The production EAS hook refuses missing disclosures and checks that the public URL includes the configured contact and retention text. It is an automated prerequisite, not legal approval or a Data safety attestation.

Complete Play Data safety and Health apps declarations based on actual application/SDK behavior. AI analysis sends selected photos, session notes, title, match context, opponent style, stance, experience and weight class to the backend and OpenAI after confirmation. Structured name, age, injury, height and body-weight fields remain local. User-written notes/photos can themselves contain sensitive data. Play Integrity sends security signals to Google. Unsplash background requests expose network metadata to that image host. Local deletion removes the app's profile/history/timer records, not the user's gallery or provider logs. No app account is currently created, so do not invent an account-deletion flow.

Photos are picked through the system UI and converted to bounded JPEGs. Video analysis is not offered. Unneeded camera, microphone, location, broad storage/media and overlay permissions are explicitly removed. The normal `MODIFY_AUDIO_SETTINGS` permission is retained because Expo AV routes the timer's audio through Android AudioManager; it does not enable microphone recording. Android backup and device-transfer extraction rules exclude app data. Inspect the final merged AAB: source manifest/configuration alone cannot prove these controls.

## Required acceptance evidence

1. Frozen lockfile install, mobile/API TypeScript, API build, `pnpm test:security`, `pnpm test:api-http`, and final Android export.
2. Generated Android project/configuration checks, then a signed production AAB with target API 36 (or a verified approved exception), expected signing/versionCode, release flags, merged permissions/exported components and actual native 16 KB alignment. Local prebuild is not an AAB inspection.
3. Live API: anonymous AI denied without a provider call; public directory writes denied; malformed/oversized requests rejected; licensed app accepted; replay rejected; budget/rate/concurrency limits proven across restarts and replicas. Use a controlled provider budget and isolated acceptance fixtures.
4. Real Play internal-track installation on a physical Android device: launch, system photo picker, disclosure/consent, successful real coaching, offline profile/timer, bell, deletion and relaunch, revoked/offline verification recovery, and accessibility/navigation.
5. Play Console privacy URL, Data safety/Health forms, listing/assets/content rating/target audience, signing and any account-specific testing/review requirements accepted. Do not claim approval before Console/device receipts.

## Residual dependency risk

The initial workspace audit reported 119 advisories. Compatible available updates removed all critical findings and most high findings. A subsequent audit still identified tooling risks, including Metro's `image-size@1.2.1` image parsing and advisories whose fixed `node-forge@1.4.1`/`braces@3.0.4` versions were not published in npm at the time of verification. Do not pin nonexistent versions or force a major parser upgrade into Metro without compatibility tests. Restrict build inputs to reviewed repository assets, protect build/signing credentials, and rerun dependency triage before release. These are not established Android-runtime vulnerabilities. Exact current counts and matched paths are in the durable repair evidence.

Primary references: [Expo SDK 54 App Integrity](https://docs.expo.dev/versions/v54.0.0/sdk/app-integrity/), [Google standard requests](https://developer.android.com/google/play/integrity/standard), [Google integrity verdicts](https://developer.android.com/google/play/integrity/verdicts), [Play user data](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en), [target API](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en), [16 KB pages](https://developer.android.com/guide/practices/page-sizes).
