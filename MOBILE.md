# Build mobile natif (Capacitor)

Quranify peut être empaqueté en application Android et iOS avec **Capacitor**, incluant un widget d'écran d'accueil synchronisé avec la lecture en cours.

## Prérequis

- Node.js 20+
- **Android** : Android Studio, JDK 17+
- **iOS** (macOS uniquement) : Xcode 15+, compte développeur Apple

## Commandes

```bash
npm run cap:sync      # build web + copie vers android/ et ios/
npm run cap:android   # ouvre Android Studio
npm run cap:ios       # ouvre Xcode (macOS)
```

## Widget Android

1. Compilez et installez l'app sur un appareil ou émulateur.
2. Appui long sur l'écran d'accueil → **Widgets** → **Quranify**.
3. Le widget affiche la sourate, le récitateur et la progression de la dernière lecture.
4. Un appui ouvre l'app sur l'onglet Sourates.

Le plugin natif `WidgetBridge` écrit dans `quranify_widget_prefs` et rafraîchit `QuranifyWidgetProvider`.

## Widget iOS (WidgetKit)

Sur macOS, dans Xcode :

1. Ouvrez `ios/App/App.xcodeproj`.
2. **File → Add Target → Widget Extension** (ou ajoutez manuellement le dossier `ios/QuranifyWidget/`).
3. Activez **App Groups** pour l'app principale et l'extension : `group.com.quranify.app`.
4. Ajoutez `WidgetBridgePlugin.swift` au target App.
5. Partagez `WidgetSharedStore.swift` entre l'app et l'extension.
6. Build & run sur appareil iOS 14+.

## Comparateur A/B

Onglet **Comparer** dans la barre de navigation :

- Choisissez une sourate et deux récitateurs (voix A / voix B).
- Lecture exclusive : une seule voix à la fois.
- **Basculer A ↔ B** conserve la position de lecture pour comparer instantanément.

URL directe : `/?tab=compare`

## Deep link widget

- Android : `quranify://surah/{id}` (intent sur `MainActivity`)
- iOS : configurez le scheme `quranify` dans Info.plist si besoin

## TWA (Play Store)

Pour publier la PWA via **Trusted Web Activity** sans widget natif, utilisez [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) avec l'URL de production. Les widgets nécessitent toutefois Capacitor ou du code natif.
