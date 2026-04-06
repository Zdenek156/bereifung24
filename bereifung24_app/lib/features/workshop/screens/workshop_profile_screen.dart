import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/workshop_profile.dart';
import '../providers/workshop_provider.dart';

class WorkshopProfileScreen extends ConsumerWidget {
  const WorkshopProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(workshopProfileProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: profileAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Fehler: $e')),
          data: (profile) => ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
            children: [
              // Header
              Text(
                'Profil',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 20),

              // Workshop card
              _WorkshopInfoCard(profile: profile),
              const SizedBox(height: 16),

              // Landing Page Share Card
              _LandingPageShareCard(),
              const SizedBox(height: 16),

              // Vacations
              _VacationSection(),
              const SizedBox(height: 16),

              // Opening Hours
              if (profile.openingHours != null) ...[
                _OpeningHoursCard(openingHours: profile.openingHours!),
                const SizedBox(height: 16),
              ],

              // Appearance / Dark Mode
              _AppearanceCard(),
              const SizedBox(height: 16),

              // Legal footer + Logout
              const Divider(),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  'Rechtliches',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Center(
                child: Wrap(
                  alignment: WrapAlignment.center,
                  children: [
                    _legalLink(context, 'AGB', '/profile/agb'),
                    _dot(isDark),
                    _legalLink(context, 'Datenschutz', '/profile/datenschutz'),
                    _dot(isDark),
                    _legalLink(context, 'Impressum', '/profile/impressum'),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    ref.read(authStateProvider.notifier).logout();
                  },
                  icon: const Icon(Icons.logout, size: 18),
                  label: const Text('Abmelden'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFEF4444),
                    side: const BorderSide(color: Color(0xFFEF4444)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _legalLink(BuildContext context, String label, String path) {
    return GestureDetector(
      onTap: () => context.push(path),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
        child: Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Color(0xFF64748B),
            decoration: TextDecoration.underline,
          ),
        ),
      ),
    );
  }

  Widget _dot(bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: Text(
        ' \u00b7 ',
        style: TextStyle(
          fontSize: 12,
          color: isDark ? Colors.white24 : const Color(0xFFCBD5E1),
        ),
      ),
    );
  }
}

class _WorkshopInfoCard extends StatelessWidget {
  final WorkshopProfile profile;
  const _WorkshopInfoCard({required this.profile});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: const Color(0xFF0284C7).withValues(alpha: 0.1),
                backgroundImage:
                    profile.logoUrl != null && profile.logoUrl!.isNotEmpty
                        ? NetworkImage(
                            profile.logoUrl!.startsWith('http')
                                ? profile.logoUrl!
                                : 'https://www.bereifung24.de${profile.logoUrl}',
                          )
                        : null,
                child: profile.logoUrl == null || profile.logoUrl!.isEmpty
                    ? Text(
                        profile.companyName.isNotEmpty
                            ? profile.companyName[0]
                            : '?',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0284C7),
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            profile.companyName,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 17,
                            ),
                          ),
                        ),
                        if (profile.isVerified) ...[
                          const SizedBox(width: 6),
                          const Icon(Icons.verified,
                              color: Color(0xFF10B981), size: 18),
                        ],
                      ],
                    ),
                    if (profile.fullAddress.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        profile.fullAddress,
                        style: TextStyle(
                          fontSize: 13,
                          color:
                              isDark ? Colors.white54 : const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (profile.email.isNotEmpty) _infoRow('📧', profile.email),
          if (profile.phone != null) _infoRow('📞', profile.phone!),
          if (profile.website != null && profile.website!.isNotEmpty)
            _infoRow('🌐', profile.website!),
        ],
      ),
    );
  }

  Widget _infoRow(String emoji, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 14)),
          const SizedBox(width: 8),
          Expanded(
            child: Builder(builder: (context) {
              final isDark = Theme.of(context).brightness == Brightness.dark;
              return Text(
                value,
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.white70 : Colors.black87,
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}

class _LandingPageShareCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lpAsync = ref.watch(workshopLandingPageProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return lpAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (e, __) {
        debugPrint('Landing page error: $e');
        return _buildNoLandingPage(isDark);
      },
      data: (lp) {
        if (lp == null) return _buildNoLandingPage(isDark);
        final slug = (lp['slug'] ?? lp['Slug'] ?? '').toString();
        final isActive = lp['isActive'] == true || lp['is_active'] == true;
        if (slug.isEmpty) return _buildNoLandingPage(isDark);

        final url = 'https://bereifung24.de/$slug';

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Text('🔗', style: TextStyle(fontSize: 20)),
                  const SizedBox(width: 8),
                  Text(
                    'Ihre Landing Page',
                    style: TextStyle(
                      color: isDark ? Colors.white : Colors.black87,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                url,
                style: TextStyle(
                  color: isDark ? Colors.white60 : const Color(0xFF64748B),
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: isActive
                          ? const Color(0xFF10B981).withValues(alpha: 0.15)
                          : const Color(0xFFEF4444).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      isActive ? 'Aktiv' : 'Inaktiv',
                      style: TextStyle(
                        color: isActive
                            ? const Color(0xFF10B981)
                            : const Color(0xFFEF4444),
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Share.share(
                          'Besuchen Sie unsere Seite und buchen Sie direkt online: $url',
                        );
                      },
                      icon: const Icon(Icons.share, size: 18),
                      label: const Text('Seite teilen'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0284C7),
                        foregroundColor: Colors.white,
                        minimumSize: const Size(0, 48),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  ElevatedButton(
                    onPressed: () => _showQrDialog(context, url),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isDark
                          ? const Color(0xFF334155)
                          : const Color(0xFFF1F5F9),
                      foregroundColor: isDark ? Colors.white : Colors.black87,
                      minimumSize: const Size(48, 48),
                      padding: const EdgeInsets.symmetric(
                          vertical: 12, horizontal: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: const Icon(Icons.qr_code_2, size: 22),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildNoLandingPage(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        children: [
          const Text('🔗', style: TextStyle(fontSize: 28)),
          const SizedBox(height: 8),
          Text(
            'Keine Landing Page',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 15,
              color: isDark ? Colors.white : Colors.black87,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Ihre Landing Page wird über das Admin-Portal erstellt und verwaltet.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              color: isDark ? Colors.white60 : const Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }

  void _showQrDialog(BuildContext context, String url) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
        title: const Text('QR-Code', textAlign: TextAlign.center),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: QrImageView(
                data: url,
                version: QrVersions.auto,
                size: 220,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              url,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: isDark ? Colors.white54 : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Schließen'),
          ),
        ],
      ),
    );
  }
}

class _VacationSection extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vacationsAsync = ref.watch(workshopVacationsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('🏖️', style: TextStyle(fontSize: 20)),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Urlaub / Betriebsferien',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add_circle_outline,
                    color: Color(0xFF0284C7)),
                onPressed: () => _showAddVacation(context, ref),
              ),
            ],
          ),
          const SizedBox(height: 8),
          vacationsAsync.when(
            loading: () => const Center(
                child: Padding(
              padding: EdgeInsets.all(12),
              child: CircularProgressIndicator(strokeWidth: 2),
            )),
            error: (e, _) => Text('Fehler: $e',
                style: const TextStyle(color: Color(0xFFEF4444))),
            data: (vacations) {
              if (vacations.isEmpty) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Text(
                    'Keine Urlaubszeiten eingetragen',
                    style: TextStyle(
                      color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                      fontSize: 13,
                    ),
                  ),
                );
              }
              return Column(
                children: vacations
                    .map((v) => _VacationTile(
                          vacation: v,
                          onDelete: () => _deleteVacation(context, ref, v.id),
                        ))
                    .toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  void _showAddVacation(BuildContext context, WidgetRef ref) async {
    final now = DateTime.now();
    final range = await showDateRangePicker(
      context: context,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
      locale: const Locale('de', 'DE'),
    );
    if (range == null || !context.mounted) return;

    final reasonController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Urlaubszeit hinzufügen'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${DateFormat('dd.MM.yyyy').format(range.start)} - ${DateFormat('dd.MM.yyyy').format(range.end)}',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              decoration: const InputDecoration(
                labelText: 'Grund (optional)',
                hintText: 'z.B. Betriebsferien',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Abbrechen'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Speichern'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    try {
      await createVacation(
        startDate: range.start,
        endDate: range.end,
        reason: reasonController.text.trim().isEmpty
            ? null
            : reasonController.text.trim(),
      );
      ref.invalidate(workshopVacationsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Urlaubszeit gespeichert ✅')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Fehler: $e')));
      }
    }
  }

  void _deleteVacation(BuildContext context, WidgetRef ref, String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Urlaubszeit löschen?'),
        content: const Text('Diese Urlaubszeit wird unwiderruflich gelöscht.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Abbrechen'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
            ),
            child: const Text('Löschen'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    try {
      await deleteVacation(id);
      ref.invalidate(workshopVacationsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Urlaubszeit gelöscht')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Fehler: $e')));
      }
    }
  }
}

class _VacationTile extends StatelessWidget {
  final dynamic vacation;
  final VoidCallback onDelete;
  const _VacationTile({required this.vacation, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dateFormat = DateFormat('dd.MM.yyyy');
    final isActive = vacation.isActive;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: isActive
            ? const Color(0xFFFEF3C7).withValues(alpha: isDark ? 0.15 : 1)
            : isDark
                ? const Color(0xFF0F172A)
                : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isActive
              ? const Color(0xFFF59E0B).withValues(alpha: 0.4)
              : isDark
                  ? const Color(0xFF334155)
                  : const Color(0xFFE2E8F0),
        ),
      ),
      child: Row(
        children: [
          Text(isActive ? '🟡' : '📅', style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${dateFormat.format(vacation.startDate)} - ${dateFormat.format(vacation.endDate)}',
                  style: const TextStyle(
                      fontWeight: FontWeight.w600, fontSize: 13),
                ),
                if (vacation.reason != null && vacation.reason!.isNotEmpty)
                  Text(
                    vacation.reason!,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                    ),
                  ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline,
                size: 18, color: Color(0xFFEF4444)),
            onPressed: onDelete,
          ),
        ],
      ),
    );
  }
}

class _OpeningHoursCard extends StatelessWidget {
  final Map<String, dynamic> openingHours;
  const _OpeningHoursCard({required this.openingHours});

  static const _dayNames = {
    'monday': 'Montag',
    'tuesday': 'Dienstag',
    'wednesday': 'Mittwoch',
    'thursday': 'Donnerstag',
    'friday': 'Freitag',
    'saturday': 'Samstag',
    'sunday': 'Sonntag',
  };

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Text('🕐', style: TextStyle(fontSize: 20)),
              SizedBox(width: 8),
              Text(
                '\u00d6ffnungszeiten',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ..._dayNames.entries.map((entry) {
            final day = openingHours[entry.key];
            final closed = day == null || day['closed'] == true;
            return Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(
                children: [
                  SizedBox(
                    width: 100,
                    child: Text(
                      entry.value,
                      style: TextStyle(
                        fontSize: 13,
                        color:
                            isDark ? Colors.white54 : const Color(0xFF64748B),
                      ),
                    ),
                  ),
                  Text(
                    closed ? 'Geschlossen' : '${day['open']} - ${day['close']}',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: closed ? FontWeight.w400 : FontWeight.w600,
                      color: closed
                          ? (isDark ? Colors.white30 : const Color(0xFFCBD5E1))
                          : null,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _AppearanceCard extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final themeMode = ref.watch(themeModeProvider);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Text('🎨', style: TextStyle(fontSize: 20)),
              SizedBox(width: 8),
              Text(
                'Darstellung',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(
                isDark ? Icons.dark_mode : Icons.light_mode,
                size: 20,
                color: isDark ? Colors.white54 : const Color(0xFF64748B),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Dark Mode',
                  style: TextStyle(
                    fontSize: 14,
                    color: isDark ? Colors.white70 : Colors.black87,
                  ),
                ),
              ),
              Switch.adaptive(
                value: themeMode == ThemeMode.dark ||
                    (themeMode == ThemeMode.system && isDark),
                activeColor: const Color(0xFF0284C7),
                onChanged: (val) {
                  ref.read(themeModeProvider.notifier).setThemeMode(
                        val ? ThemeMode.dark : ThemeMode.light,
                      );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}
