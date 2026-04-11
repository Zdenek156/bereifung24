import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:speech_to_text/speech_recognition_result.dart';

class SpeechService {
  static final SpeechService _instance = SpeechService._internal();
  factory SpeechService() => _instance;
  SpeechService._internal();

  final SpeechToText _speech = SpeechToText();
  bool _isInitialized = false;
  bool _isListening = false;

  bool get isListening => _isListening;

  /// Initialize speech recognition
  Future<bool> init() async {
    if (_isInitialized) return true;
    try {
      _isInitialized = await _speech.initialize(
        onError: (error) {
          debugPrint('[Speech] Error: ${error.errorMsg} (permanent: ${error.permanent})');
          _isListening = false;
        },
        onStatus: (status) {
          debugPrint('[Speech] Status: $status');
          if (status == 'done' || status == 'notListening') {
            _isListening = false;
          }
        },
      );
      debugPrint('[Speech] Initialized: $_isInitialized');
    } catch (e) {
      debugPrint('[Speech] Init exception: $e');
      _isInitialized = false;
    }
    return _isInitialized;
  }

  /// Start listening - returns false if speech recognition not available
  Future<bool> startListening({
    required void Function(SpeechRecognitionResult result) onResult,
    String localeId = 'de_DE',
  }) async {
    if (!_isInitialized) {
      final ok = await init();
      if (!ok) {
        debugPrint('[Speech] Cannot start listening - init failed');
        return false;
      }
    }

    try {
      _isListening = true;
      await _speech.listen(
        onResult: (result) {
          onResult(result);
          if (result.finalResult) {
            _isListening = false;
          }
        },
        localeId: localeId,
        listenMode: ListenMode.dictation,
        cancelOnError: true,
        partialResults: true,
      );
      debugPrint('[Speech] Listening started');
      return true;
    } catch (e) {
      debugPrint('[Speech] startListening exception: $e');
      _isListening = false;
      return false;
    }
  }

  /// Stop listening
  Future<void> stopListening() async {
    _isListening = false;
    await _speech.stop();
  }

  /// Cancel listening
  Future<void> cancel() async {
    _isListening = false;
    await _speech.cancel();
  }
}
