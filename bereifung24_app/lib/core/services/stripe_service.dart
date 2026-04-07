import 'dart:async';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import '../config/app_config.dart';
import '../network/api_client.dart';

class StripeService {
  static final StripeService _instance = StripeService._internal();
  factory StripeService() => _instance;
  StripeService._internal();

  static bool _initialized = false;

  /// Initialize Stripe SDK — fetches publishable key from server
  static Future<void> init({bool force = false}) async {
    if (_initialized && !force) return;
    try {
      // Use full URL to avoid any baseUrl path resolution issues
      final url = '${AppConfig.apiBaseUrl}/config/stripe';
      debugPrint('Stripe init: fetching key from $url');
      final dio = Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {'Accept': 'application/json'},
      ));
      final response = await dio.get(url);
      debugPrint(
          'Stripe init: response status=${response.statusCode}, data=${response.data}');

      final data = response.data;
      String? key;
      if (data is Map) {
        key = data['publishableKey'] as String?;
      }

      if (key != null && key.isNotEmpty && key.startsWith('pk_')) {
        Stripe.publishableKey = key;
        // Required for Apple Pay on iOS
        Stripe.merchantIdentifier = 'merchant.de.bereifung24.bereifung24App';
        // Required for iOS redirect-based payment methods (3D Secure, PayPal, Klarna)
        Stripe.urlScheme = 'bereifung24';
        debugPrint('Stripe init: key set, calling applySettings...');
        await Stripe.instance.applySettings();
        _initialized = true;
        debugPrint('Stripe initialized successfully');
      } else {
        debugPrint('Stripe init: invalid key received: $key');
      }
    } catch (e, stack) {
      debugPrint('Stripe init failed: $e');
      debugPrint('Stack: $stack');
    }
  }

  static bool get isInitialized => _initialized;

  /// Create a payment for a booking and present the payment sheet.
  /// Returns the paymentIntentId on success, null if cancelled.
  Future<String?> processPayment({
    required String bookingId,
    required double amount,
    String currency = 'eur',
    String? paymentMethod,
  }) async {
    if (!_initialized) {
      // Try to init one more time (force re-fetch to ensure correct key)
      await init(force: true);
      if (!_initialized) {
        throw Exception(
            'Stripe ist nicht konfiguriert. Bitte versuche es später erneut.');
      }
    }
    try {
      // 1. Create payment intent on the server
      debugPrint('Stripe: Creating payment intent for amount=$amount, method=$paymentMethod');
      final response = await ApiClient().createPaymentIntent({
        'bookingId': bookingId,
        'amount': amount,
        'currency': currency,
      });

      final data = response.data;
      debugPrint('Stripe: PaymentIntent response: $data');
      final clientSecret = data['clientSecret'] as String?;
      final paymentIntentId = data['paymentIntentId'] as String?;
      if (clientSecret == null) throw Exception('No client secret');

      // Build payment method order based on user selection (selected first)
      final allMethods = ['card', 'paypal', 'klarna'];
      List<String>? methodOrder;
      if (paymentMethod != null) {
        final methodMap = {
          'card': 'card',
          'paypal': 'paypal',
          'klarna': 'klarna',
          'apple_pay': 'card', // Fallback to card (Apple Pay handled natively below)
          'google_pay': 'card', // Fallback to card (Google Pay handled natively below)
        };
        final selected = methodMap[paymentMethod] ?? 'card';
        methodOrder = [selected, ...allMethods.where((m) => m != selected)];
      }

      debugPrint('Stripe: Initializing payment sheet...');
      // 2. Initialize payment sheet
      // Note: Apple Pay works automatically via automatic_payment_methods
      // on the server side. Do NOT pass explicit applePay parameter —
      // it causes initPaymentSheet to hang on iOS when merchant validation
      // fails silently (provisioning profile / SDK version issue).
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: 'Bereifung24',
          // Required for iOS: return URL after 3D Secure / external auth
          returnURL: 'bereifung24://stripe-redirect',
          style: ThemeMode.system,
          paymentMethodOrder: methodOrder,
          // Google Pay on Android (explicit config needed)
          googlePay: Platform.isAndroid
              ? const PaymentSheetGooglePay(
                  merchantCountryCode: 'DE',
                  currencyCode: 'EUR',
                  testEnv: false,
                )
              : null,
          appearance: const PaymentSheetAppearance(
            colors: PaymentSheetAppearanceColors(
              primary: Color(0xFF0284C7),
            ),
            shapes: PaymentSheetShape(
              borderRadius: 12,
            ),
          ),
        ),
      );

      // 3. Present payment sheet (with timeout to prevent infinite spinner)
      debugPrint('Stripe: Presenting payment sheet...');
      await Stripe.instance.presentPaymentSheet()
          .timeout(const Duration(seconds: 120), onTimeout: () {
        throw Exception('Zahlung hat zu lange gedauert. Bitte versuche es erneut.');
      });
      debugPrint('Stripe: Payment completed successfully');

      return paymentIntentId ?? 'stripe_completed'; // payment succeeded
    } on StripeException catch (e) {
      debugPrint('Stripe: StripeException: ${e.error.code} - ${e.error.message}');
      if (e.error.code == FailureCode.Canceled) {
        return null; // user cancelled
      }
      rethrow;
    } catch (e) {
      debugPrint('Stripe: General error: $e');
      rethrow;
    }
  }
}
