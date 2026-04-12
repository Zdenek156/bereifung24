import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:speech_to_text/speech_recognition_result.dart';
import 'remote_logger.dart';

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
    await RemoteLogger.log('speech', 'init() called', data: {'platform': Platform.operatingSystem});
    try {
      _isInitialized = await _speech.initialize(
        onError: (error) {
          RemoteLogger.error('speech', 'onError: ${error.errorMsg}', data: {
            'permanent': error.permanent,
            'platform': Platform.operatingSystem,
          });
          _isListening = false;
        },
        onStatus: (status) {
          RemoteLogger.log('speech', 'onStatus: $status');
          if (status == 'done' || status == 'notListening') {
            _isListening = false;
          }
        },
      );
      await RemoteLogger.log('speech', 'init result: $_isInitialized', data: {
        'platform': Platform.operatingSystem,
        'hasPermission': _speech.hasPermission,
      });
    } catch (e, stack) {
      await RemoteLogger.error('speech', 'init exception: $e', data: {
        'platform': Platform.operatingSystem,
        'stack': '$stack',
      });
      _isInitialized = false;
    }
    return _isInitialized;
  }

  /// Start listening - returns false if speech recognition not available
  Future<bool> startListening({
    required void Function(SpeechRecognitionResult result) onResult,
    String localeId = 'de_DE',
  }) async {
    await RemoteLogger.log('speech', 'startListening called', data: {
      'isInitialized': _isInitialized,
      'localeId': localeId,
      'platform': Platform.operatingSystem,
    });

    if (!_isInitialized) {
      final ok = await init();
      if (!ok) {
        await RemoteLogger.error('speech', 'Cannot start listening - init failed');
        return false;
      }
    }

    try {
      _isListening = true;
      await _speech.listen(
        onResult: (result) {
          RemoteLogger.log('speech', 'onResult', data: {
            'words': result.recognizedWords,
            'final': result.finalResult,
            'confidence': result.confidence,
          });
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
      await RemoteLogger.log('speech', 'Listening started successfully');
      return true;
    } catch (e, stack) {
      await RemoteLogger.error('speech', 'startListening exception: $e', data: {
        'platform': Platform.operatingSystem,
        'stack': '$stack',
      });
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
