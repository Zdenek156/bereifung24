import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../../data/models/models.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../auth/providers/auth_provider.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _firstNameCtrl;
  late final TextEditingController _lastNameCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _streetCtrl;
  late final TextEditingController _zipCodeCtrl;
  late final TextEditingController _cityCtrl;
  bool _isSaving = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authStateProvider).user;
    _firstNameCtrl = TextEditingController(text: user?.firstName ?? '');
    _lastNameCtrl = TextEditingController(text: user?.lastName ?? '');
    _phoneCtrl = TextEditingController(text: user?.phone ?? '');
    _streetCtrl = TextEditingController(text: user?.street ?? '');
    _zipCodeCtrl = TextEditingController(text: user?.zipCode ?? '');
    _cityCtrl = TextEditingController(text: user?.city ?? '');
    _loadProfileFromDB();
  }

  Future<void> _loadProfileFromDB() async {
    try {
      final response = await ApiClient().getProfile();
      if (!mounted) return;
      final data = response.data;
      final user = User.fromJson(data is Map<String, dynamic> ? data : {});
      _firstNameCtrl.text = user.firstName ?? '';
      _lastNameCtrl.text = user.lastName ?? '';
      _phoneCtrl.text = user.phone ?? '';
      _streetCtrl.text = user.street ?? '';
      _zipCodeCtrl.text = user.zipCode ?? '';
      _cityCtrl.text = user.city ?? '';
    } catch (_) {
      // Keep initial values from auth state
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _phoneCtrl.dispose();
    _streetCtrl.dispose();
    _zipCodeCtrl.dispose();
    _cityCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);

    try {
      final data = {
        'firstName': _firstNameCtrl.text.trim(),
        'lastName': _lastNameCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        'street': _streetCtrl.text.trim(),
        'zipCode': _zipCodeCtrl.text.trim(),
        'city': _cityCtrl.text.trim(),
      };

      final response = await ApiClient().updateProfile(data);
      final updatedUser = User.fromJson(response.data['user'] ?? response.data);
      ref.read(authStateProvider.notifier).updateUser(updatedUser);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(S.of(context)!.profileUpdated),
              backgroundColor: Colors.green),
        );
        Navigator.pop(context);
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(S.of(context)!.errorSaving),
              backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authStateProvider).user;

    return Scaffold(
      appBar: AppBar(title: Text(S.of(context)!.editProfile)),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Section: Persönliche Daten
                    Text(S.of(context)!.personalData,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _firstNameCtrl,
                            textCapitalization: TextCapitalization.words,
                            decoration: InputDecoration(
                                labelText: S.of(context)!.firstName),
                            validator: (v) => v == null || v.trim().isEmpty
                                ? 'Pflichtfeld'
                                : null,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _lastNameCtrl,
                            textCapitalization: TextCapitalization.words,
                            decoration: InputDecoration(
                                labelText: S.of(context)!.lastName),
                            validator: (v) => v == null || v.trim().isEmpty
                                ? 'Pflichtfeld'
                                : null,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      initialValue: user?.email ?? '',
                      readOnly: true,
                      enabled: false,
                      decoration: const InputDecoration(
                        labelText: 'E-Mail',
                        helperText: 'E-Mail kann nicht geändert werden',
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        labelText: S.of(context)!.phoneNumber,
                      ),
                      validator: (v) =>
                          v == null || v.trim().isEmpty ? 'Pflichtfeld' : null,
                    ),

                    const SizedBox(height: 28),

                    // Section: Adresse
                    Text(S.of(context)!.address,
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _streetCtrl,
                      decoration: InputDecoration(
                        labelText: S.of(context)!.street,
                      ),
                      validator: (v) =>
                          v == null || v.trim().isEmpty ? 'Pflichtfeld' : null,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        SizedBox(
                          width: 120,
                          child: TextFormField(
                            controller: _zipCodeCtrl,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                                labelText: S.of(context)!.zipLabel),
                            validator: (v) => v == null || v.trim().isEmpty
                                ? 'Pflichtfeld'
                                : null,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _cityCtrl,
                            textCapitalization: TextCapitalization.words,
                            decoration:
                                InputDecoration(labelText: S.of(context)!.city),
                            validator: (v) => v == null || v.trim().isEmpty
                                ? 'Pflichtfeld'
                                : null,
                          ),
                        ),
                      ],
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
                          : Text(S.of(context)!.save,
                              style: const TextStyle(fontSize: 16)),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
