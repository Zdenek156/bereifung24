import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/services/analytics_service.dart';
import '../../../core/services/crash_reporting_service.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../data/models/models.dart';

// ── Auth State ──

class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;

  const AuthState({this.user, this.isLoading = false, this.error});

  bool get isAuthenticated => user != null;

  AuthState copyWith({User? user, bool? isLoading, String? error}) =>
      AuthState(
        user: user ?? this.user,
        isLoading: isLoading ?? this.isLoading,
        error: error,
      );
}

// ── Auth Notifier ──

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _api = ApiClient();

  AuthNotifier() : super(const AuthState(isLoading: true)) {
    _tryRestoreSession();
  }

  Future<void> _tryRestoreSession() async {
    try {
      final token = await SecureStorage.getAccessToken();
      final userData = await SecureStorage.getUserData();

      if (token != null && userData != null) {
        final user = User.fromJson(jsonDecode(userData));
        _setUserContext(user);
        state = AuthState(user: user);
      } else {
        state = const AuthState();
      }
    } catch (_) {
      state = const AuthState();
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.login(email, password);
      final data = response.data;

      await _saveTokens(data);
      final user = User.fromJson(data['user']);
      _setUserContext(user);
      AnalyticsService().logLogin('email');
      state = AuthState(user: user);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _extractError(e));
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
    String? street,
    String? zipCode,
    String? city,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        street: street,
        zipCode: zipCode,
        city: city,
      );
      final data = response.data;

      await _saveTokens(data);
      final user = User.fromJson(data['user']);
      _setUserContext(user);
      AnalyticsService().logSignUp('email');
      state = AuthState(user: user);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _extractError(e));
      return false;
    }
  }

  Future<bool> socialLogin(String provider, String idToken,
      {String? firstName, String? lastName}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.socialLogin(provider, idToken,
          firstName: firstName, lastName: lastName);
      final data = response.data;

      await _saveTokens(data);
      final user = User.fromJson(data['user']);
      _setUserContext(user);
      AnalyticsService().logLogin(provider);
      state = AuthState(user: user);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _extractError(e));
      return false;
    }
  }

  Future<bool> forgotPassword(String email) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _api.forgotPassword(email);
      state = state.copyWith(isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _extractError(e));
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _api.logout();
    } catch (_) {}
    await SecureStorage.clearAll();
    CrashReportingService().clearUser();
    AnalyticsService().setUserId('');
    state = const AuthState();
  }

  void updateUser(User user) {
    state = AuthState(user: user);
    SecureStorage.setUserData(jsonEncode(user.toJson()));
  }

  /// Fetch fresh profile from API and update local state + storage
  Future<void> fetchProfile() async {
    try {
      final response = await _api.getProfile();
      final data = response.data;
      final user = User.fromJson(data['user'] ?? data);
      _setUserContext(user);
      state = AuthState(user: user);
      await SecureStorage.setUserData(jsonEncode(user.toJson()));
    } catch (_) {
      // Keep existing state on error
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  // ── Helpers ──

  void _setUserContext(User user) {
    CrashReportingService().setUser(user.id, user.email);
    AnalyticsService().setUserId(user.id);
  }

  Future<void> _saveTokens(Map<String, dynamic> data) async {
    await SecureStorage.setAccessToken(data['accessToken']);
    await SecureStorage.setRefreshToken(data['refreshToken']);
    if (data['user'] != null) {
      await SecureStorage.setUserData(jsonEncode(data['user']));
    }
  }

  String _extractError(dynamic e) {
    debugPrint('Auth error: $e');
    if (e is Exception) {
      try {
        final dioError = e as dynamic;
        final response = dioError.response;
        if (response != null) {
          final data = response.data;
          if (data is Map && data['error'] != null) return data['error'].toString();
          if (data is String && data.isNotEmpty && data.length < 200) return data;
          return 'Server-Fehler (${response.statusCode})';
        }
        // Connection / timeout errors
        final msg = dioError.message?.toString() ?? '';
        if (msg.contains('SocketException') || msg.contains('Connection refused')) {
          return 'Keine Verbindung zum Server';
        }
        if (msg.contains('timeout') || msg.contains('Timeout')) {
          return 'Server antwortet nicht (Timeout)';
        }
      } catch (_) {}
    }
    return 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
  }
}

// ── Providers ──

final authStateProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier());
