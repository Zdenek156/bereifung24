import 'dart:async';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import '../config/app_config.dart';
import '../network/api_client.dart';
import 'remote_logger.dart';

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
      await RemoteLogger.log('stripe', 'init: fetching key from $url');
      final dio = Dio(BaseOptions(
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {'Accept': 'application/json'},
      ));
      final response = await dio.get(url);
      await RemoteLogger.log(
          'stripe', 'init: response status=${response.statusCode}');

      final data = response.data;
      String? key;
      if (data is Map) {
        key = data['publishableKey'] as String?;
      }

      if (key != null && key.isNotEmpty && key.startsWith('pk_')) {
        Stripe.publishableKey = key;
        Stripe.merchantIdentifier = 'merchant.de.bereifung24.bereifung24App';
        Stripe.urlScheme = 'bereifung24';
        await RemoteLogger.log(
            'stripe', 'init: key set, calling applySettings...');
        await Stripe.instance.applySettings();
        _initialized = true;
        await RemoteLogger.log('stripe', 'init: SUCCESS — initialized');
      } else {
        await RemoteLogger.error('stripe',
            'init: invalid key received: ${key?.substring(0, 10)}...');
      }
    } catch (e, stack) {
      await RemoteLogger.error('stripe', 'init FAILED: $e',
          data: {'stack': '$stack'});
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
      await RemoteLogger.log(
          'stripe', 'processPayment: not initialized, forcing init...');
      await init(force: true);
      if (!_initialized) {
        await RemoteLogger.error(
            'stripe', 'processPayment: STILL not initialized after force init');
        throw Exception(
            'Stripe ist nicht konfiguriert. Bitte versuche es später erneut.');
      }
    }
    try {
      // 1. Create payment intent on the server
      await RemoteLogger.log('stripe', 'step 1: Creating PaymentIntent', data: {
        'amount': amount,
        'method': paymentMethod,
        'platform': Platform.operatingSystem,
      });
      final response = await ApiClient().createPaymentIntent({
        'bookingId': bookingId,
        'amount': amount,
        'currency': currency,
      });

      final data = response.data;
      final clientSecret = data['clientSecret'] as String?;
      final paymentIntentId = data['paymentIntentId'] as String?;
      await RemoteLogger.log('stripe', 'step 1: PaymentIntent created', data: {
        'hasClientSecret': clientSecret != null,
        'paymentIntentId': paymentIntentId,
      });
      if (clientSecret == null) throw Exception('No client secret');

      // Build payment method order (card first, then alternatives)
      final allMethods = ['card', 'klarna', 'ideal', 'eps', 'amazon_pay'];
      List<String>? methodOrder;
      if (paymentMethod != null) {
        final methodMap = {
          'card': 'card',
          'klarna': 'klarna',
          'ideal': 'ideal',
          'eps': 'eps',
          'amazon_pay': 'amazon_pay',
          'apple_pay': 'card',
          'google_pay': 'card',
        };
        final selected = methodMap[paymentMethod] ?? 'card';
        methodOrder = [selected, ...allMethods.where((m) => m != selected)];
      }

      await RemoteLogger.log('stripe', 'step 2: Calling initPaymentSheet...',
          data: {
            'methodOrder': methodOrder,
            'hasApplePay': Platform.isIOS,
            'hasGooglePay': Platform.isAndroid,
            'returnURL': 'bereifung24://stripe-redirect',
          });
      // 2. Initialize payment sheet
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: 'Bereifung24',
          // Required for iOS: return URL after 3D Secure / external auth
          returnURL: 'bereifung24://stripe-redirect',
          style: ThemeMode.system,
          paymentMethodOrder: methodOrder,
          // Apple Pay on iOS
          applePay: Platform.isIOS
              ? const PaymentSheetApplePay(
                  merchantCountryCode: 'DE',
                )
              : null,
          // Google Pay on Android
          googlePay: Platform.isAndroid
              ? const PaymentSheetGooglePay(
                  merchantCountryCode: 'DE',
                  currencyCode: 'EUR',
                  testEnv: false,
                )
              : null,
          // German locale for button text ("Bezahlen" statt "Pay")
          // Label set dynamically via caller or defaults to system locale
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
      await RemoteLogger.log('stripe', 'step 2: initPaymentSheet DONE');

      // 3. Present payment sheet (with timeout to prevent infinite spinner)
      await RemoteLogger.log(
          'stripe', 'step 3: Calling presentPaymentSheet...');
      await Stripe.instance
          .presentPaymentSheet()
          .timeout(const Duration(seconds: 120), onTimeout: () {
        RemoteLogger.error('stripe', 'step 3: TIMEOUT after 120s');
        throw Exception(
            'Payment took too long. Please try again.');
      });
      await RemoteLogger.log(
          'stripe', 'step 3: presentPaymentSheet DONE — payment succeeded');

      return paymentIntentId ?? 'stripe_completed'; // payment succeeded
    } on StripeException catch (e) {
      await RemoteLogger.error(
          'stripe', 'StripeException: ${e.error.code} - ${e.error.message}',
          data: {
            'code': e.error.code.toString(),
            'message': e.error.message,
            'localizedMessage': e.error.localizedMessage,
          });
      if (e.error.code == FailureCode.Canceled) {
        return null; // user cancelled
      }
      rethrow;
    } catch (e, stack) {
      await RemoteLogger.error('stripe', 'General error: $e',
          data: {'stack': '$stack'});
      rethrow;
    }
  }
}
