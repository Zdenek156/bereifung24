import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';

class CacheService {
  static final CacheService _instance = CacheService._internal();
  factory CacheService() => _instance;
  CacheService._internal();

  static const _boxName = 'b24_cache';
  Box? _box;

  /// Initialize Hive — call in main() before runApp
  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(_boxName);
  }

  Box get _cacheBox {
    _box ??= Hive.box(_boxName);
    return _box!;
  }

  /// Store data with optional TTL (in minutes)
  Future<void> put(String key, dynamic data, {int ttlMinutes = 60}) async {
    final entry = {
      'data': jsonEncode(data),
      'expiry': DateTime.now()
          .add(Duration(minutes: ttlMinutes))
          .millisecondsSinceEpoch,
    };
    await _cacheBox.put(key, jsonEncode(entry));
  }

  /// Get cached data (returns null if expired or not found)
  dynamic get(String key) {
    try {
      final raw = _cacheBox.get(key);
      if (raw == null) return null;

      final entry = jsonDecode(raw) as Map<String, dynamic>;
      final expiry = entry['expiry'] as int;

      if (DateTime.now().millisecondsSinceEpoch > expiry) {
        _cacheBox.delete(key); // expired
        return null;
      }

      return jsonDecode(entry['data'] as String);
    } catch (e) {
      debugPrint('Cache get error for $key: $e');
      return null;
    }
  }

  /// Check if a key exists and is not expired
  bool has(String key) => get(key) != null;

  /// Delete a specific cache entry
  Future<void> delete(String key) async {
    await _cacheBox.delete(key);
  }

  /// Clear all cached data
  Future<void> clearAll() async {
    await _cacheBox.clear();
  }

  /// Cache keys for common data
  static String workshopsKey(String query) => 'workshops_$query';
  static String bookingsKey() => 'user_bookings';
  static String vehiclesKey() => 'user_vehicles';
  static String profileKey() => 'user_profile';
}
