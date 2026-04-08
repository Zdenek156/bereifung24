import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import '../../../../core/services/biometric_service.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _biometricAvailable = false;

  @override
  void initState() {
    super.initState();
    _checkBiometric();
  }

  Future<void> _checkBiometric() async {
    // Only offer biometric if user previously logged in (has stored token)
    final hasToken = await SecureStorage.getAccessToken();
    if (hasToken == null) return;

    final available = await BiometricService().isAvailable();
    if (mounted) setState(() => _biometricAvailable = available);
  }

  Future<void> _biometricLogin() async {
    final authenticated = await BiometricService().authenticate(
      reason: 'Melde dich mit Fingerabdruck oder Face ID an',
    );
    if (authenticated && mounted) {
      // Token is still valid — try to restore session
      context.go('/home');
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    final success = await ref.read(authStateProvider.notifier).login(
          _emailController.text.trim(),
          _passwordController.text,
        );

    if (success && mounted) {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 60),

                // Logo
                Center(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Image.asset(
                      'assets/images/b24_logo.png',
                      height: 80,
                      width: 80,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),

                const SizedBox(height: 24),
                Text(
                  'Bereifung24',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Melde dich an oder erstelle ein Konto',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: Colors.grey[600],
                      ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 40),

                // Error message
                if (authState.error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.error_outline, color: Colors.red.shade700),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            authState.error!,
                            style: TextStyle(color: Colors.red.shade700),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Email
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'E-Mail',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) {
                      return 'Bitte E-Mail eingeben';
                    }
                    if (!v.contains('@')) return 'Ungültige E-Mail';
                    return null;
                  },
                ),

                const SizedBox(height: 16),

                // Password
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _login(),
                  decoration: InputDecoration(
                    labelText: 'Passwort',
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
                    if (v == null || v.isEmpty) return 'Bitte Passwort eingeben';
                    return null;
                  },
                ),

                const SizedBox(height: 8),

                // Forgot password
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => context.push('/forgot-password'),
                    child: const Text('Passwort vergessen?'),
                  ),
                ),

                const SizedBox(height: 16),

                // Login button
                FilledButton(
                  onPressed: authState.isLoading ? null : _login,
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
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Anmelden', style: TextStyle(fontSize: 16)),
                ),

                const SizedBox(height: 24),

                // Divider
                Row(
                  children: [
                    const Expanded(child: Divider()),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text('oder',
                          style: TextStyle(color: Colors.grey[600])),
                    ),
                    const Expanded(child: Divider()),
                  ],
                ),

                const SizedBox(height: 24),

                // Social buttons (platform-specific)
                if (Platform.isAndroid)
                  OutlinedButton(
                    onPressed: authState.isLoading ? null : () => _googleSignIn(),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SvgPicture.asset('assets/images/google_logo.svg', height: 20, width: 20),
                        const SizedBox(width: 12),
                        const Text('Mit Google anmelden'),
                      ],
                    ),
                  ),

                if (Platform.isIOS) ...[
                  OutlinedButton(
                    onPressed: authState.isLoading ? null : () => _appleSignIn(),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SvgPicture.asset('assets/images/apple_logo.svg', height: 20, width: 20),
                        const SizedBox(width: 12),
                        const Text('Mit Apple anmelden'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: authState.isLoading ? null : () => _googleSignIn(),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SvgPicture.asset('assets/images/google_logo.svg', height: 20, width: 20),
                        const SizedBox(width: 12),
                        const Text('Mit Google anmelden'),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 32),

                // Biometric login
                if (_biometricAvailable) ...[                  
                  OutlinedButton.icon(
                    onPressed: _biometricLogin,
                    icon: const Icon(Icons.fingerprint, size: 24),
                    label: const Text('Mit Biometrie anmelden'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                // Register link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Noch kein Konto?',
                        style: TextStyle(color: Colors.grey[600])),
                    TextButton(
                      onPressed: () => context.go('/register'),
                      child: const Text('Registrieren'),
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

  Future<void> _googleSignIn() async {
    try {
      final googleSignIn = GoogleSignIn(scopes: ['email', 'profile']);
      // disconnect() revokes all tokens and forces fresh account picker
      try { await googleSignIn.disconnect(); } catch (_) {}
      final googleUser = await googleSignIn.signIn();
      if (googleUser == null) return; // User cancelled

      final googleAuth = await googleUser.authentication;
      final idToken = googleAuth.idToken;
      if (idToken == null) {
        debugPrint('Google Sign-In: idToken is null');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Google-Token konnte nicht abgerufen werden. Bitte versuche es erneut.')),
          );
        }
        return;
      }

      final googleFirstName = googleUser.displayName?.split(' ').first;
      final googleLastName = googleUser.displayName?.split(' ').skip(1).join(' ');

      // Ask for address before login
      final result = await _showProfileDialog(
        firstName: googleFirstName,
        lastName: googleLastName,
        nameProvided: true,
      );
      if (result == null) return; // User cancelled

      final success = await ref.read(authStateProvider.notifier).socialLogin(
        'google',
        idToken,
        firstName: googleFirstName,
        lastName: googleLastName,
        phone: result['phone'],
        street: result['street'],
        zipCode: result['zipCode'],
        city: result['city'],
      );

      if (mounted) {
        if (success) {
          context.go('/home');
        } else {
          final error = ref.read(authStateProvider).error;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(error ?? 'Google-Anmeldung fehlgeschlagen')),
          );
        }
      }
    } catch (e) {
      debugPrint('Google Sign-In error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Google-Anmeldung fehlgeschlagen: ${e.toString().length > 100 ? e.toString().substring(0, 100) : e}')),
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
        debugPrint('Apple Sign-In: identityToken is null');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Apple-Token konnte nicht abgerufen werden. Bitte versuche es erneut.')),
          );
        }
        return;
      }

      String? appleFirstName = credential.givenName;
      String? appleLastName = credential.familyName;
      String? phone;
      String? street;
      String? zipCode;
      String? city;
      String? realEmail;

      // Check if Apple provided a private relay email
      final appleEmail = credential.email ?? '';
      final isRelayEmail = appleEmail.contains('privaterelay.appleid.com');

      // Apple only provides name on first sign-in. If missing, ask user.
      if (appleFirstName == null || appleFirstName.isEmpty ||
          appleLastName == null || appleLastName.isEmpty ||
          isRelayEmail) {
        final result = await _showProfileDialog(
          firstName: appleFirstName,
          lastName: appleLastName,
          askForEmail: isRelayEmail,
        );
        if (result == null) return; // User cancelled
        appleFirstName = result['firstName'];
        appleLastName = result['lastName'];
        phone = result['phone'];
        street = result['street'];
        zipCode = result['zipCode'];
        city = result['city'];
        if (isRelayEmail && result['email'] != null && result['email']!.isNotEmpty) {
          realEmail = result['email'];
        }
      } else {
        // Name available (first Apple login) — still ask for address
        final result = await _showProfileDialog(
          firstName: appleFirstName,
          lastName: appleLastName,
          nameProvided: true,
          askForEmail: isRelayEmail,
        );
        if (result == null) return;
        phone = result['phone'];
        street = result['street'];
        zipCode = result['zipCode'];
        city = result['city'];
      }

      final success = await ref.read(authStateProvider.notifier).socialLogin(
        'apple',
        idToken,
        firstName: appleFirstName,
        lastName: appleLastName,
        phone: phone,
        street: street,
        zipCode: zipCode,
        city: city,
        email: realEmail,
      );

      if (mounted) {
        if (success) {
          context.go('/home');
        } else {
          final error = ref.read(authStateProvider).error;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(error ?? 'Apple-Anmeldung fehlgeschlagen')),
          );
        }
      }
    } catch (e) {
      debugPrint('Apple Sign-In error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Apple-Anmeldung fehlgeschlagen: ${e.toString().length > 100 ? e.toString().substring(0, 100) : e}')),
        );
      }
    }
  }

  /// Shows a dialog to collect name and address for social sign-in users.
  Future<Map<String, String>?> _showProfileDialog({
    String? firstName,
    String? lastName,
    bool nameProvided = false,
    bool askForEmail = false,
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
        title: Text(nameProvided ? 'Adresse vervollständigen' : 'Profil vervollständigen'),
        content: SingleChildScrollView(
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  askForEmail
                      ? 'Apple hat deine E-Mail-Adresse verborgen. Bitte gib deine echte E-Mail-Adresse an.'
                      : nameProvided
                          ? 'Bitte gib noch deine Adresse an, damit wir Werkstätten in deiner Nähe finden können.'
                          : 'Dein Name wurde nicht übermittelt. Bitte vervollständige dein Profil.',
                  style: const TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 16),
                if (askForEmail) ...[                  TextFormField(
                    controller: emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'E-Mail-Adresse *',
                      prefixIcon: Icon(Icons.email_outlined),
                    ),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Pflichtfeld';
                      if (!v.contains('@') || !v.contains('.')) return 'Ungültige E-Mail';
                      if (v.contains('privaterelay.appleid.com')) return 'Bitte echte E-Mail angeben';
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                ],
                if (!nameProvided) ...[
                  TextFormField(
                    controller: firstNameCtrl,
                    textCapitalization: TextCapitalization.words,
                    decoration: const InputDecoration(labelText: 'Vorname *'),
                    validator: (v) => v == null || v.trim().isEmpty ? 'Pflichtfeld' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: lastNameCtrl,
                    textCapitalization: TextCapitalization.words,
                    decoration: const InputDecoration(labelText: 'Nachname *'),
                    validator: (v) => v == null || v.trim().isEmpty ? 'Pflichtfeld' : null,
                  ),
                  const SizedBox(height: 12),
                ],
                TextFormField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Telefon (optional)',
                    prefixIcon: Icon(Icons.phone_outlined),
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: streetCtrl,
                  textCapitalization: TextCapitalization.words,
                  decoration: const InputDecoration(
                    labelText: 'Straße & Hausnummer *',
                    prefixIcon: Icon(Icons.home_outlined),
                  ),
                  validator: (v) => v == null || v.trim().isEmpty ? 'Pflichtfeld' : null,
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    SizedBox(
                      width: 100,
                      child: TextFormField(
                        controller: zipCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'PLZ *'),
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Pflicht';
                          if (v.trim().length != 5) return '5 Ziffern';
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: cityCtrl,
                        textCapitalization: TextCapitalization.words,
                        decoration: const InputDecoration(labelText: 'Stadt *'),
                        validator: (v) => v == null || v.trim().isEmpty ? 'Pflichtfeld' : null,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Abbrechen'),
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
            child: const Text('Weiter'),
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
}
