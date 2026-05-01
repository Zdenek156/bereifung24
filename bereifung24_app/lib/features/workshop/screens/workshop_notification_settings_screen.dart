import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../l10n/app_localizations.dart';

class WorkshopNotificationSettingsScreen extends ConsumerStatefulWidget {
  const WorkshopNotificationSettingsScreen({super.key});

  @override
  ConsumerState<WorkshopNotificationSettingsScreen> createState() =>
      _WorkshopNotificationSettingsScreenState();
}

class _WorkshopNotificationSettingsScreenState
    extends ConsumerState<WorkshopNotificationSettingsScreen> {
  final _api = ApiClient();
  bool _isLoading = true;
  bool _isSaving = false;

  bool _bookingReceived = true;
  bool _reviewReceived = true;
  bool _payoutReceived = true;
  bool _appointmentReminder = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      final response = await _api.getWorkshopNotificationSettings();
      final data = response.data as Map<String, dynamic>;
      setState(() {
        _bookingReceived = data['notifyWsBookingReceived'] ?? true;
        _reviewReceived = data['notifyWsReviewReceived'] ?? true;
        _payoutReceived = data['notifyWsPayoutReceived'] ?? true;
        _appointmentReminder = data['notifyWsAppointmentReminder'] ?? true;
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _isSaving = true);
    try {
      await _api.updateWorkshopNotificationSettings({
        'notifyWsBookingReceived': _bookingReceived,
        'notifyWsReviewReceived': _reviewReceived,
        'notifyWsPayoutReceived': _payoutReceived,
        'notifyWsAppointmentReminder': _appointmentReminder,
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
          SnackBar(
              content: Text(S.of(context)!.saveError),
              backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = S.of(context)!;
    return Scaffold(
      appBar: AppBar(
        title: Text(s.workshopNotificationSettings),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.canPop() ? context.pop() : context.go('/workshop/profile'),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  s.workshopNotificationSettingsDesc,
                  style: TextStyle(color: Colors.grey[600]),
                ),
                const SizedBox(height: 16),
                _NotificationTile(
                  icon: Icons.event_available,
                  title: s.workshopNotifBookingReceived,
                  subtitle: s.workshopNotifBookingReceivedDesc,
                  value: _bookingReceived,
                  onChanged: (v) => setState(() => _bookingReceived = v),
                ),
                _NotificationTile(
                  icon: Icons.star,
                  title: s.workshopNotifReviewReceived,
                  subtitle: s.workshopNotifReviewReceivedDesc,
                  value: _reviewReceived,
                  onChanged: (v) => setState(() => _reviewReceived = v),
                ),
                _NotificationTile(
                  icon: Icons.euro,
                  title: s.workshopNotifPayoutReceived,
                  subtitle: s.workshopNotifPayoutReceivedDesc,
                  value: _payoutReceived,
                  onChanged: (v) => setState(() => _payoutReceived = v),
                ),
                _NotificationTile(
                  icon: Icons.alarm,
                  title: s.workshopNotifAppointmentReminder,
                  subtitle: s.workshopNotifAppointmentReminderDesc,
                  value: _appointmentReminder,
                  onChanged: (v) => setState(() => _appointmentReminder = v),
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
                      : Text(s.save, style: const TextStyle(fontSize: 16)),
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isDark ? const Color(0xFF334155) : Colors.grey.shade200,
        ),
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
