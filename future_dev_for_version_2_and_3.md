# Future Development for Version 2 and 3

## 1. Eliminate "Unrecognized Developer" Play Protect Warnings
**Status:** Planned for Version 2/3

Currently, the `WebApkInstallerModule.kt` engine generates a brand new, random RSA-2048 private key directly on the user's phone to sign the dynamically minted PWAs. Because Google Play Protect has never seen this key, it flags the minted apps as originating from an "Unrecognized Developer" and forces the user to click "Install Anyway".

### The Solution: The Embedded Keystore Strategy
To ensure all locally minted PWAs install silently and are recognized globally by Google Play Protect, we will implement the following architecture:

1. **Create a Dedicated Minting Keystore:**
   Generate a completely separate, new keystore specifically for PWA minting (e.g., `pwa-minting.keystore`). **Do NOT use the main release keystore used for the Sanwitch Connect host app, to avoid severe security risks if decompiled.**

2. **Register the Key with Play Protect (Hidden):**
   - Build a dummy, blank Android app.
   - Sign it with `pwa-minting.keystore`.
   - Upload it to the **Internal Testing Track** on the Google Play Console.
   - *Result:* The app remains completely private and hidden from the public, but Google's backend scans it and officially associates the `pwa-minting.keystore` certificate with the Sanwitch Connect Developer Account.

3. **Embed the Keystore in the Kotlin Compiler:**
   - Place the `pwa-minting.keystore` inside the `assets/` folder of the Sanwitch Connect codebase.
   - Update `WebApkInstallerModule.kt` to extract this pre-compiled keystore instead of running `getOrCreatePersistentKeyPair()`.
   - Use this single, recognized master key inside the `ApkSigner` builder block to sign every PWA.

4. **Outcome:**
   When the user installs a standalone PWA, Android will read the V2 signature, check it against Google Play Protect's database, instantly recognize the Developer Account, and allow a completely frictionless installation with zero warnings.
