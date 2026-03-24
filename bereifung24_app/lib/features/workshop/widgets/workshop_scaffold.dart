import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class WorkshopScaffold extends StatelessWidget {
  final Widget child;
  const WorkshopScaffold({super.key, required this.child});

  static const _tabs = [
    _TabItem(
        label: 'Dashboard', path: '/workshop', emoji: '📊', activeEmoji: '📊'),
    _TabItem(
        label: 'Kalender',
        path: '/workshop/calendar',
        emoji: '📅',
        activeEmoji: '📆'),
    _TabItem(
        label: 'Buchungen',
        path: '/workshop/bookings',
        emoji: '📋',
        activeEmoji: '📋'),
    _TabItem(
        label: 'Bewertungen',
        path: '/workshop/reviews',
        emoji: '⭐',
        activeEmoji: '🌟'),
    _TabItem(
        label: 'Profil',
        path: '/workshop/profile',
        emoji: '👤',
        activeEmoji: '👤'),
  ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    for (int i = _tabs.length - 1; i >= 0; i--) {
      if (location.startsWith(_tabs[i].path)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final index = _currentIndex(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          boxShadow: [
            BoxShadow(
              color: isDark
                  ? Colors.black.withValues(alpha: 0.3)
                  : Colors.black.withValues(alpha: 0.08),
              blurRadius: 12,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(_tabs.length, (i) {
                final tab = _tabs[i];
                final isActive = i == index;
                return GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: () {
                    Navigator.of(context, rootNavigator: true)
                        .popUntil((route) => route.isFirst);
                    context.go(tab.path);
                  },
                  child: SizedBox(
                    width: 64,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          isActive ? tab.activeEmoji : tab.emoji,
                          style: const TextStyle(fontSize: 24),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          tab.label,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight:
                                isActive ? FontWeight.w700 : FontWeight.w500,
                            color: isActive
                                ? const Color(0xFF0284C7)
                                : isDark
                                    ? const Color(0xFF94A3B8)
                                    : const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _TabItem {
  final String label;
  final String path;
  final String emoji;
  final String activeEmoji;

  const _TabItem({
    required this.label,
    required this.path,
    required this.emoji,
    required this.activeEmoji,
  });
}
