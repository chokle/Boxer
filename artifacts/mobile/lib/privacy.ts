export const PRIVACY_POLICY = `Boxer AI Privacy Policy
Last updated: October 5, 2026

Boxer AI stores your boxer profile, injuries, workout timers, session notes and analysis history on your device. These records remain until you choose Delete local data in Profile, clear the app's storage or uninstall it. Android backup is disabled for this app. Device storage is protected by your operating system; use a device lock.

AI coaching is optional. After you confirm a submission, selected photos, session notes, session title, match context, opponent style, stance, experience level and weight class are sent over HTTPS to the Boxer AI backend and OpenAI to generate feedback. Name, age, reach, height, body weight and injury records are excluded from the structured profile sent to AI. Information you include yourself in notes or photos will still be sent. Avoid including sensitive information or other people's identifiable photos without permission.

The coaching endpoint does not write your submission to the Boxer community database. AI results are saved in your device's history. Hosting and AI providers may process request data under their own policies; deleting local history does not delete their security logs or provider records. ${process.env.EXPO_PUBLIC_AI_PROVIDER_RETENTION || "Provider retention and contractual settings must be disclosed on the published policy before release."}

Community directories are read-only in the mobile app and are separate from your private local profile. Browsing contacts the Boxer backend. Requests disclose network metadata such as IP address and request timing to the hosting provider. Background photos are loaded from images.unsplash.com, which also receives network metadata when these images load. No advertising or advertising identifier integration is included in this version. Android app-integrity verification sends app/device security signals to Google to prevent abuse of paid coaching.

You can use the profile and timer without sending an AI request. Cancel the upload confirmation to keep a session private. Clear all saved Boxer data from Profile. No account is created by this version.

Boxer AI provides general fitness information, not medical care, diagnosis or treatment. Consult a qualified professional about injuries and exercise safety. AI estimates may be inaccurate and cannot replace a coach observing the whole session.

Publisher support: ${process.env.EXPO_PUBLIC_SUPPORT_EMAIL || "Pending publisher approval; not ready for release"}.
Published policy: ${process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || "Pending publication; not ready for release"}.`;
