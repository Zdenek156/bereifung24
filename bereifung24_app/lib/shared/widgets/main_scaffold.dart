import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class MainScaffold extends StatelessWidget {
  final Widget child;
  const MainScaffold({super.key, required this.child});

  static const _tabs = [
    _TabItem(
        label: 'Home',
        path: '/home',
        icon: Icons.home_outlined,
        activeIcon: Icons.home),
    _TabItem(
        label: 'Suche',
        path: '/search',
        icon: Icons.search,
        activeIcon: Icons.search),
    _TabItem(
        label: 'Buchungen',
        path: '/bookings',
        icon: Icons.calendar_today_outlined,
        activeIcon: Icons.calendar_today),
    _TabItem(
        label: 'Fahrzeuge',
        path: '/vehicles',
        icon: Icons.directions_car_outlined,
        activeIcon: Icons.directions_car),
    _TabItem(
        label: 'Profil',
        path: '/profile',
        icon: Icons.person_outline,
        activeIcon: Icons.person),
  ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    for (int i = 0; i < _tabs.length; i++) {
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
      floatingActionButton: index != 0
          ? Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [Color(0xFF7C3AED), Color(0xFF0284C7)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF7C3AED).withValues(alpha: 0.4),
                    blurRadius: 16,
                    spreadRadius: 2,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: FloatingActionButton(
                onPressed: () => context.push('/ai-advisor'),
                backgroundColor: Colors.transparent,
                elevation: 0,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(28),
                  child: Image.asset(
                    'assets/images/services/ki_berater.jpg',
                    width: 56,
                    height: 56,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            )
          : null,
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
                                    ? const Color(0xFF0284C7)
                                        .withValues(alpha: 0.15)
                                    : const Color(0xFF0284C7)
                                        .withValues(alpha: 0.10))
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
                            color: isActive
                                ? const Color(0xFF0284C7)
                                : Colors.transparent,
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
