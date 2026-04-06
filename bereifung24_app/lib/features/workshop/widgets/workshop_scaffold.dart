import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class WorkshopScaffold extends StatelessWidget {
  final Widget child;
  const WorkshopScaffold({super.key, required this.child});

  static const _tabs = [
    _TabItem(label: 'Dashboard', path: '/workshop', icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard),
    _TabItem(label: 'Kalender', path: '/workshop/calendar', icon: Icons.calendar_today_outlined, activeIcon: Icons.calendar_today),
    _TabItem(label: 'Buchungen', path: '/workshop/bookings', icon: Icons.assignment_outlined, activeIcon: Icons.assignment),
    _TabItem(label: 'Bewertungen', path: '/workshop/reviews', icon: Icons.star_outline, activeIcon: Icons.star),
    _TabItem(label: 'Profil', path: '/workshop/profile', icon: Icons.person_outline, activeIcon: Icons.person),
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
      extendBody: true,
      body: child,
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 8),
          child: Container(
            height: 64,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius: BorderRadius.circular(32),
              border: Border.all(
                color: isDark
                    ? Colors.white.withValues(alpha: 0.08)
                    : Colors.black.withValues(alpha: 0.06),
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: isDark
                      ? Colors.black.withValues(alpha: 0.4)
                      : Colors.black.withValues(alpha: 0.10),
                  blurRadius: 20,
                  spreadRadius: 0,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
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
                    width: 56,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: isActive
                                ? (isDark
                                    ? const Color(0xFF0284C7).withValues(alpha: 0.15)
                                    : const Color(0xFF0284C7).withValues(alpha: 0.10))
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Icon(
                            isActive ? tab.activeIcon : tab.icon,
                            size: 24,
                            color: isActive
                                ? const Color(0xFF0284C7)
                                : isDark
                                    ? const Color(0xFF94A3B8)
                                    : const Color(0xFF64748B),
                          ),
                        ),
                        const SizedBox(height: 2),
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: isActive ? 20 : 0,
                          height: 3,
                          decoration: BoxDecoration(
                            color: isActive ? const Color(0xFF0284C7) : Colors.transparent,
                            borderRadius: BorderRadius.circular(2),
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
  final IconData icon;
  final IconData activeIcon;

  const _TabItem({
    required this.label,
    required this.path,
    required this.icon,
    required this.activeIcon,
  });
}
