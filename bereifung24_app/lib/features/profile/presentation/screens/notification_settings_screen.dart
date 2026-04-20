import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../l10n/app_localizations.dart';

class NotificationSettingsScreen extends ConsumerStatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  ConsumerState<NotificationSettingsScreen> createState() =>
      _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState
    extends ConsumerState<NotificationSettingsScreen> {
  final _api = ApiClient();
  bool _isLoading = true;
  bool _isSaving = false;

  bool _bookingConfirmation = true;
  bool _reminder = true;
  bool _season = true;
  bool _bookingUpdate = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      final response = await _api.getNotificationSettings();
      final data = response.data;
      setState(() {
        _bookingConfirmation = data['notifyBookingConfirmation'] ?? true;
        _reminder = data['notifyReminder'] ?? true;
        _season = data['notifySeason'] ?? true;
        _bookingUpdate = data['notifyBookingUpdate'] ?? true;
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _isSaving = true);
    try {
      await _api.updateNotificationSettings({
        'notifyBookingConfirmation': _bookingConfirmation,
        'notifyReminder': _reminder,
        'notifySeason': _season,
        'notifyBookingUpdate': _bookingUpdate,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(S.of(context)!.settingsSaved),
              backgroundColor: Colors.green),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Fehler beim Speichern'),
              backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(S.of(context)!.notifications)),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  'Push-Benachrichtigungen',
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                Text(
                  'Wähle welche Benachrichtigungen du erhalten möchtest.',
                  style: TextStyle(color: Colors.grey[600]),
                ),
                const SizedBox(height: 16),
                _NotificationTile(
                  icon: Icons.alarm,
                  title: S.of(context)!.appointmentReminder,
                  subtitle: S.of(context)!.appointmentReminderDesc,
                  value: _reminder,
                  onChanged: (v) => setState(() => _reminder = v),
                ),
                _NotificationTile(
                  icon: Icons.ac_unit,
                  title: S.of(context)!.seasonHint,
                  subtitle: S.of(context)!.seasonHintDesc,
                  value: _season,
                  onChanged: (v) => setState(() => _season = v),
                ),
                _NotificationTile(
                  icon: Icons.update,
                  title: S.of(context)!.bookingUpdates,
                  subtitle: S.of(context)!.bookingUpdatesDesc,
                  value: _bookingUpdate,
                  onChanged: (v) => setState(() => _bookingUpdate = v),
                ),
                const SizedBox(height: 32),
                FilledButton(
                  onPressed: _isSaving ? null : _save,
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isSaving
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Speichern', style: TextStyle(fontSize: 16)),
                ),
              ],
            ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _NotificationTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: SwitchListTile(
        secondary: Icon(icon, color: B24Colors.primaryBlue),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 13)),
        value: value,
        onChanged: (v) => onChanged(v),
      ),
    );
  }
}
