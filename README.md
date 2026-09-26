<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Meridian Personal Systems

Meridian is a unified Material 3 personal operating system integrating Logbook (Journal), Study Ledger, Unbound Recovery, Finance Ledger, Pulse Biometric Check-in, Goals & Targets, and a Unified Telemetry Stream.

## Android Architecture (Kotlin & Jetpack Compose)

The native Android implementation is located in `/app` and features:
- **UI Framework**: 100% Jetpack Compose with Material 3 design system.
- **Theming**: Dynamic Material You Monet palettes (Botanical, Ocean, Terracotta, Lavender, Rose, Monochrome) and light/dark modes.
- **Architecture**: MVVM with unidirectional data flow via Kotlin Coroutines and StateFlow.
- **Local Persistence**: Offline-first Room Database (`MeridianDatabase`) with Kotlin Flow reactive queries.
- **Metrics Engine**:
  - **Life Composite Index**: Weighted formula across all 6 lifestyle dimensions.
  - **Today's Move Engine**: Dynamically identifies the system operating below baseline for compound yield.
  - **Life WAR Sabermetrics**: Wins Above Replacement calculation (Cognitive, Discipline, Capital, Vitality).
  - **Cross-Module Correlations**: Detects links between sleep/recovery and study/spending performance.
  - **Weekly Scoreboard**: Week-over-week differential telemetry.

## Core Modules & Features
1. **Overview**: Hero composite index gauge, Today's Move recommendation, Life WAR summary, Systems balance radar, and Cross-correlations.
2. **Logbook (Journal)**: Tagged reflections, full-text search, pinned notes, and quick thought capture.
3. **Study Ledger**: 200L Medical syllabus breakdown (Anatomy, Physiology, Biochemistry), interactive topic checklists, and sprint timer session logging.
4. **Unbound Recovery**: Clean time tracking counter, milestones (24h to 1yr), urge logs, and interactive 5-4-3-2-1 Sensory Grounding SOS protocol.
5. **Finance Ledger**: Multi-account balances, expense and income categorization, cash net flow, and transaction logs.
6. **Pulse Check-in**: Sleep duration & quality ratings, mood, energy, focus ratings, and daily recursive habit checklist.
7. **Goals & Targets**: Milestone targets, numerical step progress bars, and historical check-ins.
8. **Timeline Stream**: Chronological audit trail aggregating events across all modules.

## Building and Running
- **Android**: Open project in Android Studio (JDK 21, Android SDK 35+).
- **Web Preview**: Run `npm install` and `npm run dev` to preview the interactive web interface.

