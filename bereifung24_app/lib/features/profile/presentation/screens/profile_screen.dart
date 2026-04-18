import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../auth/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);
    final user = authState.user;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
          child: Column(
            children: [
              const SizedBox(height: 16),

              // ── Profile header ──
              if (user?.profileImage != null && user!.profileImage!.isNotEmpty)
                CircleAvatar(
                  radius: 48,
                  backgroundImage: NetworkImage(user.profileImage!),
                  backgroundColor:
                      B24Colors.primaryBlue.withValues(alpha: 0.15),
                )
              else
                CircleAvatar(
                  radius: 48,
                  backgroundColor:
                      B24Colors.primaryBlue.withValues(alpha: 0.15),
                  child: Text(
                    (user?.firstName?.isNotEmpty == true)
                        ? user!.firstName![0].toUpperCase()
                        : '?',
                    style: const TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                      color: B24Colors.primaryBlue,
                    ),
                  ),
                ),
              const SizedBox(height: 12),
              Text(
                user?.fullName ?? 'Kein Name',
                style: Theme.of(context)
                    .textTheme
                    .titleLarge
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              Text(
                user?.email ?? '',
                style: TextStyle(color: Colors.grey[600]),
              ),

              const SizedBox(height: 32),

              // ── Settings list ──
              _SettingsSection(
                title: 'Konto',
                children: [
                  _SettingsTile(
                    icon: Icons.person_outline,
                    title: 'Profil bearbeiten',
                    onTap: () => context.push('/profile/edit'),
                  ),
                  _SettingsTile(
                    icon: Icons.notifications_outlined,
                    title: 'Benachrichtigungen',
                    onTap: () => context.push('/profile/notifications'),
                  ),
                  if (user?.googleId == null || user!.googleId!.isEmpty)
                    _SettingsTile(
                      icon: Icons.lock_outline,
                      title: 'Passwort ändern',
                      onTap: () => _showChangePasswordDialog(context),
                    ),
                ],
              ),

              const SizedBox(height: 16),

              _SettingsSection(
                title: 'App',
                children: [
                  _ThemeModeTile(),
                  _SettingsTile(
                    icon: Icons.info_outline,
                    title: 'Über Bereifung24',
                    onTap: () => launchUrl(
                      Uri.parse('https://bereifung24.de'),
                      mode: LaunchMode.externalApplication,
                    ),
                  ),
                  _SettingsTile(
                    icon: Icons.feedback_outlined,
                    title: 'Feedback geben',
                    onTap: () => context.push('/profile/feedback'),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              _SettingsSection(
                title: 'Gefahrenzone',
                children: [
                  _SettingsTile(
                    icon: Icons.logout,
                    title: 'Abmelden',
                    iconColor: Colors.red,
                    titleColor: Colors.red,
                    onTap: () => _confirmLogout(context, ref),
                  ),
                  _SettingsTile(
                    icon: Icons.delete_forever,
                    title: 'Konto löschen',
                    iconColor: Colors.red,
                    titleColor: Colors.red,
                    onTap: () => _confirmDelete(context, ref),
                  ),
                ],
              ),

              const SizedBox(height: 32),

              // ── Rechtliches ──
              Divider(color: Colors.grey.shade300),
              const SizedBox(height: 12),
              Text(
                'Rechtliches',
                style: TextStyle(
                  color: Colors.grey[500],
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  GestureDetector(
                    onTap: () => context.push('/profile/agb'),
                    child: Text(
                      'AGB',
                      style: TextStyle(
                        color: Colors.grey[500],
                        fontSize: 12,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                  Text('  ·  ',
                      style: TextStyle(color: Colors.grey[400], fontSize: 12)),
                  GestureDetector(
                    onTap: () => context.push('/profile/datenschutz'),
                    child: Text(
                      'Datenschutz',
                      style: TextStyle(
                        color: Colors.grey[500],
                        fontSize: 12,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                  Text('  ·  ',
                      style: TextStyle(color: Colors.grey[400], fontSize: 12)),
                  GestureDetector(
                    onTap: () => context.push('/profile/impressum'),
                    child: Text(
                      'Impressum',
                      style: TextStyle(
                        color: Colors.grey[500],
                        fontSize: 12,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Divider(color: Colors.grey.shade300),
              const SizedBox(height: 12),
              FutureBuilder<PackageInfo>(
                future: PackageInfo.fromPlatform(),
                builder: (context, snapshot) {
                  final version = snapshot.data?.version ?? '...';
                  return Text(
                    'Bereifung24 \u00b7 Version $version',
                    style: TextStyle(color: Colors.grey[400], fontSize: 12),
                  );
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  void _showChangePasswordDialog(BuildContext context) {
    final currentCtrl = TextEditingController();
    final newCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (ctx) {
        var loading = false;
        return StatefulBuilder(
          builder: (ctx, setState) => AlertDialog(
            title: const Text('Passwort ändern'),
            content: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: currentCtrl,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Aktuelles Passwort',
                      prefixIcon: Icon(Icons.lock_outline),
                    ),
                    validator: (v) =>
                        (v == null || v.isEmpty) ? 'Pflichtfeld' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: newCtrl,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Neues Passwort',
                      prefixIcon: Icon(Icons.lock),
                    ),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Pflichtfeld';
                      if (v.length < 8) return 'Mindestens 8 Zeichen';
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: confirmCtrl,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Passwort bestätigen',
                      prefixIcon: Icon(Icons.lock),
                    ),
                    validator: (v) {
                      if (v != newCtrl.text) {
                        return 'Passwörter stimmen nicht überein';
                      }
                      return null;
                    },
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: loading ? null : () => Navigator.pop(ctx),
                child: const Text('Abbrechen'),
              ),
              FilledButton(
                onPressed: loading
                    ? null
                    : () async {
                        if (!formKey.currentState!.validate()) return;
                        setState(() => loading = true);
                        try {
                          await ApiClient().changePassword(
                            currentCtrl.text,
                            newCtrl.text,
                          );
                          if (ctx.mounted) Navigator.pop(ctx);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Passwort erfolgreich geändert'),
                              ),
                            );
                          }
                        } catch (e) {
                          setState(() => loading = false);
                          if (ctx.mounted) {
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              SnackBar(
                                content: Text(
                                  e.toString().contains('falsch')
                                      ? 'Aktuelles Passwort ist falsch'
                                      : 'Fehler beim Ändern des Passworts',
                                ),
                              ),
                            );
                          }
                        }
                      },
                child: loading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Ändern'),
              ),
            ],
          ),
        );
      },
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Abmelden?'),
        content: const Text('Möchtest du dich wirklich abmelden?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Abbrechen'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authStateProvider.notifier).logout();
            },
            child: const Text('Abmelden'),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Konto löschen?'),
        content: const Text(
            'Dein Konto und alle Daten werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Abbrechen'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ApiClient().deleteAccount();
                await ref.read(authStateProvider.notifier).logout();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Konto wurde gelöscht')),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Löschen fehlgeschlagen. Bitte versuche es erneut.')),
                  );
                }
              }
            },
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Endgültig löschen'),
          ),
        ],
      ),
    );
  }
}

class _SettingsSection extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _SettingsSection({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            color: Colors.grey[500],
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: Colors.grey.shade200),
          ),
          child: Column(
            children: children,
          ),
        ),
      ],
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color? iconColor;
  final Color? titleColor;
  final VoidCallback onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    this.iconColor,
    this.titleColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: iconColor ?? B24Colors.primaryBlue, size: 22),
      title: Text(title, style: TextStyle(color: titleColor)),
      trailing: const Icon(Icons.chevron_right, size: 20),
      onTap: onTap,
    );
  }
}

class _ThemeModeTile extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final icon = switch (themeMode) {
      ThemeMode.dark => Icons.dark_mode,
      ThemeMode.light => Icons.light_mode,
      ThemeMode.system => Icons.auto_mode,
    };
    final label = switch (themeMode) {
      ThemeMode.dark => 'Dunkel',
      ThemeMode.light => 'Hell',
      ThemeMode.system => 'System',
    };

    return ListTile(
      leading: Icon(icon, color: B24Colors.primaryBlue, size: 22),
      title: const Text('Erscheinungsbild'),
      subtitle: Text(label),
      trailing: PopupMenuButton<ThemeMode>(
        initialValue: themeMode,
        onSelected: (mode) =>
            ref.read(themeModeProvider.notifier).setThemeMode(mode),
        itemBuilder: (context) => const [
          PopupMenuItem(
            value: ThemeMode.system,
            child: Row(
              children: [
                Icon(Icons.auto_mode, size: 20),
                SizedBox(width: 8),
                Text('System'),
              ],
            ),
          ),
          PopupMenuItem(
            value: ThemeMode.light,
            child: Row(
              children: [
                Icon(Icons.light_mode, size: 20),
                SizedBox(width: 8),
                Text('Hell'),
              ],
            ),
          ),
          PopupMenuItem(
            value: ThemeMode.dark,
            child: Row(
              children: [
                Icon(Icons.dark_mode, size: 20),
                SizedBox(width: 8),
                Text('Dunkel'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
