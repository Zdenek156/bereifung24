import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../l10n/app_localizations.dart';

class AboutScreen extends StatefulWidget {
  const AboutScreen({super.key});

  @override
  State<AboutScreen> createState() => _AboutScreenState();
}

class _AboutScreenState extends State<AboutScreen> {
  String _version = '';

  @override
  void initState() {
    super.initState();
    _loadVersion();
  }

  Future<void> _loadVersion() async {
    final info = await PackageInfo.fromPlatform();
    if (mounted) setState(() => _version = 'v${info.version}');
  }

  void _launch(String url) =>
      launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);

  void _call(String number) => launchUrl(Uri.parse('tel:$number'));

  void _mail(String address) => launchUrl(Uri.parse('mailto:$address'));

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final subtitleColor = isDark ? const Color(0xFF94A3B8) : Colors.grey[600];

    return Scaffold(
      appBar: AppBar(title: Text(S.of(context)!.aboutBereifung24)),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        children: [
          // ── Logo & Version ──
          const SizedBox(height: 16),
          Center(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: Image.asset(
                'assets/images/app_icon_512.png',
                width: 100,
                height: 100,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: Text(
              'Bereifung24',
              style: Theme.of(context)
                  .textTheme
                  .headlineSmall
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 4),
          Center(
            child: Text(
              S.of(context)!.tagline,
              style: TextStyle(fontSize: 14, color: subtitleColor),
            ),
          ),
          if (_version.isNotEmpty) ...[
            const SizedBox(height: 4),
            Center(
              child: Text(
                _version,
                style: TextStyle(fontSize: 12, color: subtitleColor),
              ),
            ),
          ],

          // ── Mission ──
          const SizedBox(height: 32),
          _SectionCard(
            children: [
              Text(
                S.of(context)!.mission,
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                S.of(context)!.missionText,
                style:
                    TextStyle(fontSize: 14, height: 1.6, color: subtitleColor),
              ),
            ],
          ),

          // ── Kontakt ──
          const SizedBox(height: 16),
          _SectionCard(
            children: [
              Text(
                S.of(context)!.contact,
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              _ContactTile(
                icon: Icons.phone_outlined,
                label: '07147 – 967 99 90',
                onTap: () => _call('+497147967990'),
              ),
              const Divider(height: 1),
              _ContactTile(
                icon: Icons.email_outlined,
                label: 'info@bereifung24.de',
                onTap: () => _mail('info@bereifung24.de'),
              ),
              const Divider(height: 1),
              _ContactTile(
                icon: Icons.language,
                label: 'www.bereifung24.de',
                onTap: () => _launch('https://www.bereifung24.de'),
              ),
            ],
          ),

          // ── Firmeninformationen ──
          const SizedBox(height: 16),
          _SectionCard(
            children: [
              Text(
                S.of(context)!.companyInfo,
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Text(
                'Bereifung24\n'
                'Jahnstraße 2\n'
                '71706 Markgröningen\n'
                'Deutschland',
                style:
                    TextStyle(fontSize: 14, height: 1.6, color: subtitleColor),
              ),
            ],
          ),

          // ── Social Media ──
          const SizedBox(height: 16),
          _SectionCard(
            children: [
              Text(
                S.of(context)!.followUs,
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _SocialButton(
                      icon: Icons.camera_alt_outlined,
                      label: 'Instagram',
                      onTap: () =>
                          _launch('https://www.instagram.com/bereifung24'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _SocialButton(
                      icon: Icons.facebook,
                      label: 'Facebook',
                      onTap: () =>
                          _launch('https://www.facebook.com/bereifung24'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _SocialButton(
                      iconWidget: const Text(
                        'in',
                        style: TextStyle(
                          color: Color(0xFF0284C7),
                          fontWeight: FontWeight.w800,
                          fontSize: 26,
                          height: 1,
                        ),
                      ),
                      label: 'LinkedIn',
                      onTap: () => _launch(
                          'https://www.linkedin.com/company/bereifung24'),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // ── Footer ──
          const SizedBox(height: 32),
          Center(
            child: Text(
              S.of(context)!.madeInDeutschland,
              style: TextStyle(fontSize: 12, color: subtitleColor),
            ),
          ),
          const SizedBox(height: 8),
          Center(
            child: TextButton(
              onPressed: () => showLicensePage(
                context: context,
                applicationName: 'Bereifung24',
                applicationVersion: _version,
                applicationIcon: Padding(
                  padding: const EdgeInsets.all(8),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.asset(
                      'assets/images/app_icon_512.png',
                      width: 64,
                      height: 64,
                    ),
                  ),
                ),
              ),
              child: Text(
                S.of(context)!.openSourceLicenses,
                style: TextStyle(fontSize: 12, color: subtitleColor),
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final List<Widget> children;
  const _SectionCard({required this.children});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : Colors.grey.shade200,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }
}

class _ContactTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _ContactTile(
      {required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Icon(icon, size: 20, color: const Color(0xFF0284C7)),
            const SizedBox(width: 12),
            Expanded(
              child: Text(label, style: const TextStyle(fontSize: 14)),
            ),
            const Icon(Icons.chevron_right, size: 18, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}

class _SocialButton extends StatelessWidget {
  final IconData? icon;
  final Widget? iconWidget;
  final String label;
  final VoidCallback onTap;
  const _SocialButton(
      {this.icon, this.iconWidget, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF334155) : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            iconWidget ??
                Icon(icon ?? Icons.link,
                    size: 28, color: const Color(0xFF0284C7)),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
