import 'dart:io';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../profile/presentation/screens/legal_screen.dart';
import '../../providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _streetCtrl = TextEditingController();
  final _zipCodeCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _agreeTerms = false;

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    _phoneCtrl.dispose();
    _streetCtrl.dispose();
    _zipCodeCtrl.dispose();
    _cityCtrl.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    if (!_agreeTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(S.of(context)!.acceptTerms)),
      );
      return;
    }

    final success = await ref.read(authStateProvider.notifier).register(
          email: _emailCtrl.text.trim(),
          password: _passwordCtrl.text,
          firstName: _firstNameCtrl.text.trim(),
          lastName: _lastNameCtrl.text.trim(),
          phone:
              _phoneCtrl.text.trim().isNotEmpty ? _phoneCtrl.text.trim() : null,
          street: _streetCtrl.text.trim(),
          zipCode: _zipCodeCtrl.text.trim(),
          city: _cityCtrl.text.trim(),
        );

    if (success && mounted) {
      context.go('/home');
    }
  }

  Future<void> _googleSignIn() async {
    try {
      final googleSignIn = GoogleSignIn(scopes: ['email', 'profile']);
      try {
        await googleSignIn.disconnect();
      } catch (_) {}
      final googleUser = await googleSignIn.signIn();
      if (googleUser == null) return;

      final googleAuth = await googleUser.authentication;
      final idToken = googleAuth.idToken;
      if (idToken == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(S.of(context)!.googleRegisterFailed)),
          );
        }
        return;
      }

      final googleFirstName = googleUser.displayName?.split(' ').first;
      final googleLastName =
          googleUser.displayName?.split(' ').skip(1).join(' ');

      // Login first without address — server returns existing user data
      final success = await ref.read(authStateProvider.notifier).socialLogin(
            'google',
            idToken,
            firstName: googleFirstName,
            lastName: googleLastName,
          );

      if (!success) {
        if (mounted) {
          final error = ref.read(authStateProvider).error;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(error ?? S.of(context)!.googleRegisterFailed)),
          );
        }
        return;
      }

      // Check if user already has a complete address
      final user = ref.read(authStateProvider).user;
      if (user != null &&
          (user.street == null ||
              user.street!.isEmpty ||
              user.zipCode == null ||
              user.zipCode!.isEmpty ||
              user.city == null ||
              user.city!.isEmpty)) {
        final result = await _showProfileDialog(
          firstName: googleFirstName,
          lastName: googleLastName,
          nameProvided: true,
        );
        if (result != null) {
          try {
            await ApiClient().updateProfile({
              if (result['phone'] != null && result['phone']!.isNotEmpty)
                'phone': result['phone'],
              'street': result['street'],
              'zipCode': result['zipCode'],
              'city': result['city'],
            });
          } catch (e) {
            debugPrint('Profile update failed: $e');
          }
        }
      }

      if (mounted) context.go('/home');
    } catch (e) {
      debugPrint('Google Sign-In error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(S.of(context)!.googleRegisterFailed)),
        );
      }
    }
  }

  Future<void> _appleSignIn() async {
    try {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      final idToken = credential.identityToken;
      if (idToken == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(S.of(context)!.appleRegisterFailed)),
          );
        }
        return;
      }

      String? appleFirstName = credential.givenName;
      String? appleLastName = credential.familyName;

      // Login first — server returns existing user data
      final success = await ref.read(authStateProvider.notifier).socialLogin(
            'apple',
            idToken,
            firstName: appleFirstName,
            lastName: appleLastName,
          );

      if (!success) {
        if (mounted) {
          final error = ref.read(authStateProvider).error;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(error ?? S.of(context)!.appleRegisterFailed)),
          );
        }
        return;
      }

      // Check server user data — only ask for name if server has no real name
      final user = ref.read(authStateProvider).user;
      final serverFirstName = user?.firstName ?? '';
      final serverHasName = serverFirstName.isNotEmpty &&
          !serverFirstName.contains('@') &&
          serverFirstName != 'Apple';
      final serverHasAddress = user != null &&
          user.street != null &&
          user.street!.isNotEmpty &&
          user.zipCode != null &&
          user.zipCode!.isNotEmpty &&
          user.city != null &&
          user.city!.isNotEmpty;

      if (!serverHasName || !serverHasAddress) {
        final result = await _showProfileDialog(
          firstName: serverHasName ? serverFirstName : (appleFirstName ?? ''),
          lastName:
              serverHasName ? (user?.lastName ?? '') : (appleLastName ?? ''),
          nameProvided: serverHasName,
          askForEmail: false,
          addressOptional: serverHasAddress,
        );
        if (result != null) {
          try {
            await ApiClient().updateProfile({
              if (!serverHasName) ...{
                'firstName': result['firstName'],
                'lastName': result['lastName'],
              },
              if (result['phone'] != null && result['phone']!.isNotEmpty)
                'phone': result['phone'],
              if (!serverHasAddress) ...{
                'street': result['street'],
                'zipCode': result['zipCode'],
                'city': result['city'],
              },
            });
          } catch (e) {
            debugPrint('Profile update failed: $e');
          }
        }
      }

      if (mounted) context.go('/home');
    } catch (e) {
      debugPrint('Apple Sign-In error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(S.of(context)!.appleRegisterFailed)),
        );
      }
    }
  }

  /// Shows a dialog to collect name and address for Apple Sign-In users.
  /// [nameProvided] = true if Apple already provided the name (first login).
  Future<Map<String, String>?> _showProfileDialog({
    String? firstName,
    String? lastName,
    bool nameProvided = false,
    bool askForEmail = false,
    bool addressOptional = false,
  }) async {
    final firstNameCtrl = TextEditingController(text: firstName ?? '');
    final lastNameCtrl = TextEditingController(text: lastName ?? '');
    final phoneCtrl = TextEditingController();
    final streetCtrl = TextEditingController();
    final zipCtrl = TextEditingController();
    final cityCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    final result = await showDialog<Map<String, String>>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Text(nameProvided
            ? S.of(context)!.completeAddress
            : S.of(context)!.completeProfile),
        content: SingleChildScrollView(
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  askForEmail
                      ? S.of(context)!.appleNameNotProvided
                      : nameProvided
                          ? S.of(context)!.addressNeeded
                          : S.of(context)!.appleNameNotProvided,
                  style: const TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 16),
                if (askForEmail) ...[
                  TextFormField(
                    controller: emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      labelText: S.of(context)!.emailRequired,
                      prefixIcon: const Icon(Icons.email_outlined),
                    ),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) {
                        return S.of(context)!.requiredField;
                      }
                      if (!v.contains('@') || !v.contains('.'))
                        return S.of(context)!.invalidEmail;
                      if (v.contains('privaterelay.appleid.com'))
                        return S.of(context)!.enterValidEmail;
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                ],
                if (!nameProvided) ...[
                  TextFormField(
                    controller: firstNameCtrl,
                    textCapitalization: TextCapitalization.words,
                    decoration:
                        InputDecoration(labelText: '${S.of(context)!.firstName} *'),
                    validator: (v) =>
                        v == null || v.trim().isEmpty ? S.of(context)!.requiredField : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: lastNameCtrl,
                    textCapitalization: TextCapitalization.words,
                    decoration:
                        InputDecoration(labelText: '${S.of(context)!.lastName} *'),
                    validator: (v) =>
                        v == null || v.trim().isEmpty ? S.of(context)!.requiredField : null,
                  ),
                  const SizedBox(height: 12),
                ],
                TextFormField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    labelText: S.of(context)!.phoneOptional,
                    prefixIcon: const Icon(Icons.phone_outlined),
                  ),
                ),
                if (!addressOptional) ...[
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: streetCtrl,
                    textCapitalization: TextCapitalization.words,
                    decoration: InputDecoration(
                      labelText: S.of(context)!.street,
                      prefixIcon: const Icon(Icons.home_outlined),
                    ),
                    validator: (v) =>
                        v == null || v.trim().isEmpty ? S.of(context)!.requiredField : null,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      SizedBox(
                        width: 100,
                        child: TextFormField(
                          controller: zipCtrl,
                          keyboardType: TextInputType.number,
                          decoration:
                              InputDecoration(labelText: S.of(context)!.zip),
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) {
                              return S.of(context)!.requiredField;
                            }
                            if (v.trim().length != 5) {
                              return S.of(context)!.requiredField;
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          controller: cityCtrl,
                          textCapitalization: TextCapitalization.words,
                          decoration: InputDecoration(labelText: S.of(context)!.city),
                          validator: (v) => v == null || v.trim().isEmpty
                              ? S.of(context)!.requiredField
                              : null,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(S.of(context)!.cancel),
          ),
          FilledButton(
            onPressed: () {
              if (formKey.currentState!.validate()) {
                Navigator.pop(ctx, {
                  'firstName': firstNameCtrl.text.trim(),
                  'lastName': lastNameCtrl.text.trim(),
                  'phone': phoneCtrl.text.trim(),
                  'street': streetCtrl.text.trim(),
                  'zipCode': zipCtrl.text.trim(),
                  'city': cityCtrl.text.trim(),
                  if (askForEmail) 'email': emailCtrl.text.trim(),
                });
              }
            },
            child: Text(S.of(context)!.next),
          ),
        ],
      ),
    );

    firstNameCtrl.dispose();
    lastNameCtrl.dispose();
    phoneCtrl.dispose();
    streetCtrl.dispose();
    zipCtrl.dispose();
    cityCtrl.dispose();
    emailCtrl.dispose();

    return result;
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(S.of(context)!.register),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/login'),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 16),

                Text(
                  S.of(context)!.register,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  S.of(context)!.registerAtB24,
                  style: Theme.of(context)
                      .textTheme
                      .bodyMedium
                      ?.copyWith(color: Colors.grey[600]),
                ),

                const SizedBox(height: 24),

                // Social login buttons (platform-specific)
                if (Platform.isAndroid)
                  OutlinedButton(
                    onPressed:
                        authState.isLoading ? null : () => _googleSignIn(),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SvgPicture.asset('assets/images/google_logo.svg',
                            height: 20, width: 20),
                        const SizedBox(width: 12),
                        Text(S.of(context)!.registerWithGoogle),
                      ],
                    ),
                  ),

                if (Platform.isIOS) ...[
                  OutlinedButton(
                    onPressed:
                        authState.isLoading ? null : () => _appleSignIn(),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SvgPicture.asset('assets/images/apple_logo.svg',
                            height: 20, width: 20),
                        const SizedBox(width: 12),
                        Text(S.of(context)!.registerWithApple),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed:
                        authState.isLoading ? null : () => _googleSignIn(),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SvgPicture.asset('assets/images/google_logo.svg',
                            height: 20, width: 20),
                        const SizedBox(width: 12),
                        Text(S.of(context)!.registerWithGoogle),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 24),

                // Divider
                Row(
                  children: [
                    const Expanded(child: Divider()),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(S.of(context)!.or,
                          style: TextStyle(color: Colors.grey[600])),
                    ),
                    const Expanded(child: Divider()),
                  ],
                ),

                const SizedBox(height: 24),

                // Error
                if (authState.error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Text(authState.error!,
                        style: TextStyle(color: Colors.red.shade700)),
                  ),
                  const SizedBox(height: 16),
                ],

                // Name row
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _firstNameCtrl,
                        textCapitalization: TextCapitalization.words,
                        decoration: InputDecoration(
                            labelText: S.of(context)!.firstName),
                        validator: (v) => v == null || v.trim().isEmpty
                          ? S.of(context)!.requiredField
                            : null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _lastNameCtrl,
                        textCapitalization: TextCapitalization.words,
                        decoration:
                            InputDecoration(labelText: S.of(context)!.lastName),
                        validator: (v) => v == null || v.trim().isEmpty
                          ? S.of(context)!.requiredField
                            : null,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                TextFormField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    labelText: S.of(context)!.email,
                    prefixIcon: const Icon(Icons.email_outlined),
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) {
                      return S.of(context)!.requiredField;
                    }
                    if (!v.contains('@')) return S.of(context)!.invalidEmail;
                    return null;
                  },
                ),

                const SizedBox(height: 16),

                TextFormField(
                  controller: _phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    labelText: S.of(context)!.phoneOptional,
                    prefixIcon: const Icon(Icons.phone_outlined),
                  ),
                ),

                const SizedBox(height: 24),

                // Address section
                Row(
                  children: [
                    Text(
                      S.of(context)!.address,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    const SizedBox(width: 8),
                    Tooltip(
                      message: S.of(context)!.addressInfoText,
                      triggerMode: TooltipTriggerMode.tap,
                      child: Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          color: Colors.blue.shade100,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text('i',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.blue.shade700,
                              )),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  S.of(context)!.addressInfoText,
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
                const SizedBox(height: 12),

                TextFormField(
                  controller: _streetCtrl,
                  textCapitalization: TextCapitalization.words,
                  decoration: InputDecoration(
                    labelText: S.of(context)!.street,
                    prefixIcon: const Icon(Icons.home_outlined),
                  ),
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? S.of(context)!.requiredField : null,
                ),

                const SizedBox(height: 16),

                Row(
                  children: [
                    SizedBox(
                      width: 120,
                      child: TextFormField(
                        controller: _zipCodeCtrl,
                        keyboardType: TextInputType.number,
                        decoration:
                            InputDecoration(labelText: S.of(context)!.zip),
                        validator: (v) {
                          if (v == null || v.trim().isEmpty)
                            return S.of(context)!.requiredField;
                          if (v.trim().length != 5) return S.of(context)!.requiredField;
                          return null;
                        },
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
                            ? S.of(context)!.requiredField
                            : null,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                TextFormField(
                  controller: _passwordCtrl,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: S.of(context)!.password,
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(_obscurePassword
                          ? Icons.visibility_off
                          : Icons.visibility),
                      onPressed: () =>
                          setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return S.of(context)!.requiredField;
                    if (v.length < 8) return S.of(context)!.requiredField;
                    return null;
                  },
                ),

                const SizedBox(height: 16),

                TextFormField(
                  controller: _confirmPasswordCtrl,
                  obscureText: _obscureConfirm,
                  decoration: InputDecoration(
                    labelText: S.of(context)!.confirmPassword,
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(_obscureConfirm
                          ? Icons.visibility_off
                          : Icons.visibility),
                      onPressed: () =>
                          setState(() => _obscureConfirm = !_obscureConfirm),
                    ),
                  ),
                  validator: (v) {
                    if (v != _passwordCtrl.text) {
                      return S.of(context)!.passwordsNoMatch;
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 16),

                // Terms checkbox
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Checkbox(
                      value: _agreeTerms,
                      onChanged: (v) =>
                          setState(() => _agreeTerms = v ?? false),
                    ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Text.rich(
                          TextSpan(
                            style:
                                Theme.of(context).textTheme.bodySmall?.copyWith(
                                      color: Theme.of(context).brightness ==
                                              Brightness.dark
                                          ? Colors.white70
                                          : null,
                                    ),
                            children: [
                              TextSpan(text: '${S.of(context)!.acceptTerms}: '),
                              TextSpan(
                                text: S.of(context)!.agb,
                                style: TextStyle(
                                  color: B24Colors.primaryLight,
                                  decoration: TextDecoration.underline,
                                ),
                                recognizer: TapGestureRecognizer()
                                  ..onTap = () => Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => const AGBScreen(),
                                        ),
                                      ),
                              ),
                              TextSpan(text: S.of(context)!.andThe),
                              TextSpan(
                                text: S.of(context)!.datenschutz,
                                style: TextStyle(
                                  color: B24Colors.primaryLight,
                                  decoration: TextDecoration.underline,
                                ),
                                recognizer: TapGestureRecognizer()
                                  ..onTap = () => Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) =>
                                              const DatenschutzScreen(),
                                        ),
                                      ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                FilledButton(
                  onPressed: authState.isLoading ? null : _register,
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: authState.isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : Text(S.of(context)!.register,
                          style: const TextStyle(fontSize: 16)),
                ),

                const SizedBox(height: 24),

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(S.of(context)!.hasAccount,
                        style: TextStyle(color: Colors.grey[600])),
                    TextButton(
                      onPressed: () => context.go('/login'),
                      child: Text(S.of(context)!.login),
                    ),
                  ],
                ),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
