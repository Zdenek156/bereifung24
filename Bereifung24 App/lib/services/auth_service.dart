import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/app_constants.dart';

class AuthService {
  final Dio _dio;
  static const String _tokenKey = 'auth_token';
  static const String _userIdKey = 'user_id';
  static const String _userEmailKey = 'user_email';
  static const String _userRoleKey = 'user_role';

  AuthService() : _dio = Dio(BaseOptions(
    baseUrl: AppConstants.apiBaseUrl.replaceAll('/api', ''),
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
  ));

  // Email/Password Sign In - Real API Implementation
  Future<bool> signInWithEmailAndPassword(
    String email,
    String password,
  ) async {
    try {
      final response = await _dio.post(
        '/api/mobile-auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data;
        final token = data['token'];
        final user = data['user'];

        // Save authentication data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_tokenKey, token);
        await prefs.setString(_userIdKey, user['id']);
        await prefs.setString(_userEmailKey, user['email']);
        await prefs.setString(_userRoleKey, user['role']);

        if (user['customerId'] != null) {
          await prefs.setString('customer_id', user['customerId']);
        }
        
        return true;
      }
      return false;
    } on DioException catch (e) {
      print('Login error: ${e.response?.data}');
      throw Exception(e.response?.data['error'] ?? 'Login fehlgeschlagen');
    }
  }

  // Email/Password Registration - Real API Implementation
  Future<bool> registerWithEmailAndPassword(
    String email,
    String password,
    String name,
  ) async {
    try {
      // TODO: Implement full registration with all fields
      await Future.delayed(const Duration(seconds: 1));
      return false; // Not implemented yet
    } catch (e) {
      throw Exception('Registration failed: $e');
    }
  }

  // Google Sign In - Real API Implementation
  Future<bool> signInWithGoogle() async {
    try {
      // TODO: Implement Google Sign-In
      await Future.delayed(const Duration(seconds: 1));
      return false; // Not implemented yet
    } catch (e) {
      throw Exception('Google sign in failed: $e');
    }
  }

  // Sign Out
  Future<void> signOut() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userIdKey);
    await prefs.remove(_userEmailKey);
    await prefs.remove(_userRoleKey);
    await prefs.remove('customer_id');
    await prefs.remove(AppConstants.keyAuthToken);
  }

  // Get auth token
  Future<String?> getAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey) ?? prefs.getString(AppConstants.keyAuthToken);
  }

  // Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await getAuthToken();
    return token != null && token.isNotEmpty;
  }
}
