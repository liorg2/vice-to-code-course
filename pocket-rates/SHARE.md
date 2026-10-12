# Sharing Pocket Rates

Do not upload this to an app store, and do not create a paid account, unless you decide to.

1. Same Wi-Fi, a friend with Android: they install Expo Go and scan the QR code from `npx expo start`. Your computer has to stay on. `npx expo start --tunnel` can cross networks and needs `@expo/ngrok`. This does not work for a friend's iPhone: since SDK 57, Expo Go on iPhone only opens projects from the account it is logged in to, and you should not share your Expo login.
2. Android file: an EAS Build with the `preview` profile in `eas.json` makes an APK a friend can install from a link. It needs a free Expo account and uses the monthly free build allowance. There is no Google developer fee. Run it only after you approve it: `npx eas-cli build --platform android --profile preview`.
3. iPhone: a friend installing your own build needs a paid Apple Developer account. The free option is the web version from `npx expo start`, opened in Safari.

The icon and splash in a dev session are the Expo Go chrome. They show as this app's own images only in a real build.
