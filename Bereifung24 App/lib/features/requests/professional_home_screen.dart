import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/professional_widgets.dart';
import '../../providers/app_providers.dart';

final selectedIndexProvider = StateProvider<int>((ref) => 0);

class ProfessionalHomeScreen extends ConsumerWidget {
  const ProfessionalHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedIndex = ref.watch(selectedIndexProvider);

    final screens = const [
      RequestsTab(),
      AppointmentsTab(),
      VehiclesTab(),
      SettingsTab(),
    ];

    return Scaffold(
      body: screens[selectedIndex],
      bottomNavigationBar: _buildBottomNavBar(context, ref, selectedIndex),
    );
  }

  Widget _buildBottomNavBar(BuildContext context, WidgetRef ref, int selectedIndex) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(
                context,
                ref,
                icon: Icons.description_rounded,
                label: 'Anfragen',
                index: 0,
                isSelected: selectedIndex == 0,
              ),
              _buildNavItem(
                context,
                ref,
                icon: Icons.event_rounded,
                label: 'Termine',
                index: 1,
                isSelected: selectedIndex == 1,
              ),
              _buildNavItem(
                context,
                ref,
                icon: Icons.directions_car_rounded,
                label: 'Fahrzeuge',
                index: 2,
                isSelected: selectedIndex == 2,
              ),
              _buildNavItem(
                context,
                ref,
                icon: Icons.settings_rounded,
                label: 'Einstellungen',
                index: 3,
                isSelected: selectedIndex == 3,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
    BuildContext context,
    WidgetRef ref, {
    required IconData icon,
    required String label,
    required int index,
    required bool isSelected,
  }) {
    return GestureDetector(
      onTap: () => ref.read(selectedIndexProvider.notifier).state = index,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withOpacity(0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isSelected ? AppColors.primary : AppColors.textSecondary,
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? AppColors.primary : AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ======================== REQUESTS TAB ========================
class RequestsTab extends ConsumerStatefulWidget {
  const RequestsTab({super.key});

  @override
  ConsumerState<RequestsTab> createState() => _RequestsTabState();
}

class _RequestsTabState extends ConsumerState<RequestsTab> {
  void _refreshRequests() {
    ref.refresh(tireRequestsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final requestsAsync = ref.watch(tireRequestsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: () async => _refreshRequests(),
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 120,
              floating: false,
              pinned: true,
              backgroundColor: AppColors.primary,
              elevation: 0,
              flexibleSpace: FlexibleSpaceBar(
                title: const Text(
                  'Meine Anfragen',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                  ),
                ),
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        AppColors.primary,
                        AppColors.primary.withOpacity(0.8),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ProfessionalButton(
                      text: 'Neue Anfrage erstellen',
                      icon: Icons.add_rounded,
                      onPressed: () {
                        Navigator.pushNamed(context, '/create-request');
                      },
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Aktuelle Anfragen',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
            requestsAsync.when(
              loading: () => SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(
                    color: AppColors.primary,
                  ),
                ),
              ),
              error: (error, stack) => SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 60,
                        color: AppColors.error,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Fehler beim Laden',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        error.toString(),
                        style: TextStyle(
                          fontSize: 14,
                          color: AppColors.textSecondary,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: _refreshRequests,
                        child: const Text('Erneut versuchen'),
                      ),
                    ],
                  ),
                ),
              ),
              data: (requests) {
                if (requests.isEmpty) {
                  return SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            width: 100,
                            height: 100,
                            decoration: BoxDecoration(
                              color: AppColors.primary.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.description_outlined,
                              size: 50,
                              color: AppColors.primary,
                            ),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            'Keine Anfragen',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Erstellen Sie Ihre erste Reifenservice-Anfrage',
                            style: TextStyle(
                              fontSize: 14,
                              color: AppColors.textSecondary,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final request = requests[index];
                        String serviceName = request.seasonLabel;
                        if (request.width == 0) {
                          if (request.additionalNotes?.contains('RÄDER UMSTECKEN') == true) {
                            serviceName = 'Räder umstecken';
                          } else if (request.additionalNotes?.contains('BREMSEN-SERVICE') == true) {
                            serviceName = 'Bremsen-Service';
                          } else if (request.additionalNotes?.contains('BATTERIE-SERVICE') == true) {
                            serviceName = 'Batterie-Service';
                          } else if (request.additionalNotes?.contains('REIFENREPARATUR') == true) {
                            serviceName = 'Reifenreparatur';
                          } else if (request.additionalNotes?.contains('MOTORRADREIFEN') == true) {
                            serviceName = 'Motorradreifen';
                          } else {
                            serviceName = 'Sonstiger Service';
                          }
                        } else {
                          serviceName = '${request.seasonLabel} ${request.tireSize}';
                        }

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: ServiceCard(
                            title: serviceName,
                            subtitle: 'Erstellt am: ${_formatDate(request.createdAt)} • ${request.offers?.length ?? 0} Angebote',
                            icon: Icons.tire_repair_rounded,
                            status: request.status,
                            onTap: () {
                              Navigator.pushNamed(
                                context,
                                '/request-details',
                                arguments: request.id,
                              );
                            },
                          ),
                        );
                      },
                      childCount: requests.length,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}.${date.month}.${date.year}';
  }
}

// ======================== APPOINTMENTS TAB ========================
class AppointmentsTab extends StatelessWidget {
  const AppointmentsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 120,
            floating: false,
            pinned: true,
            backgroundColor: AppColors.primary,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              title: const Text(
                'Meine Termine',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                ),
              ),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.primary,
                      AppColors.primary.withOpacity(0.8),
                    ],
                  ),
                ),
              ),
            ),
          ),
          SliverFillRemaining(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.event_outlined,
                      size: 50,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Keine Termine',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Buchen Sie einen Termin für Ihren Service',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ======================== VEHICLES TAB ========================
class VehiclesTab extends StatelessWidget {
  const VehiclesTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 120,
            floating: false,
            pinned: true,
            backgroundColor: AppColors.primary,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              title: const Text(
                'Meine Fahrzeuge',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                ),
              ),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.primary,
                      AppColors.primary.withOpacity(0.8),
                    ],
                  ),
                ),
              ),
            ),
          ),
          SliverFillRemaining(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.directions_car_outlined,
                      size: 50,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Keine Fahrzeuge',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Fügen Sie Ihr erstes Fahrzeug hinzu',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ======================== SETTINGS TAB ========================
class SettingsTab extends StatelessWidget {
  const SettingsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 120,
            floating: false,
            pinned: true,
            backgroundColor: AppColors.primary,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              title: const Text(
                'Einstellungen',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.5,
                ),
              ),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.primary,
                      AppColors.primary.withOpacity(0.8),
                    ],
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSettingsGroup(
                    'Konto',
                    [
                      _buildSettingsItem(
                        Icons.person_outline,
                        'Profil bearbeiten',
                        () {},
                      ),
                      _buildSettingsItem(
                        Icons.lock_outline,
                        'Passwort ändern',
                        () {},
                      ),
                      _buildSettingsItem(
                        Icons.email_outlined,
                        'E-Mail ändern',
                        () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  _buildSettingsGroup(
                    'Benachrichtigungen',
                    [
                      _buildSettingsItem(
                        Icons.notifications_outlined,
                        'Push-Benachrichtigungen',
                        () {},
                      ),
                      _buildSettingsItem(
                        Icons.email_outlined,
                        'E-Mail-Benachrichtigungen',
                        () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  _buildSettingsGroup(
                    'Support',
                    [
                      _buildSettingsItem(
                        Icons.help_outline,
                        'Hilfe & FAQ',
                        () {},
                      ),
                      _buildSettingsItem(
                        Icons.chat_outlined,
                        'Kontakt',
                        () {},
                      ),
                      _buildSettingsItem(
                        Icons.info_outline,
                        'Über Bereifung24',
                        () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  _buildSettingsGroup(
                    'Rechtliches',
                    [
                      _buildSettingsItem(
                        Icons.description_outlined,
                        'Datenschutz',
                        () {},
                      ),
                      _buildSettingsItem(
                        Icons.gavel_outlined,
                        'AGB',
                        () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  ProfessionalButton(
                    text: 'Abmelden',
                    icon: Icons.logout_rounded,
                    isOutlined: true,
                    color: AppColors.error,
                    onPressed: () {
                      Navigator.pushNamedAndRemoveUntil(
                        context,
                        '/auth',
                        (route) => false,
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsGroup(String title, List<Widget> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 12),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.textSecondary,
              letterSpacing: 0.5,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: items,
          ),
        ),
      ],
    );
  }

  Widget _buildSettingsItem(IconData icon, String title, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Row(
            children: [
              Icon(
                icon,
                size: 24,
                color: AppColors.primary,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              Icon(
                Icons.arrow_forward_ios_rounded,
                size: 16,
                color: AppColors.textSecondary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
