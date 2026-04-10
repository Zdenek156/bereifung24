import 'dart:async';
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
    _isInitialized = await _speech.initialize(
      onError: (error) {
        _isListening = false;
      },
      onStatus: (status) {
        if (status == 'done' || status == 'notListening') {
          _isListening = false;
        }
      },
    );
    return _isInitialized;
  }

  /// Start listening - returns stream of partial results
  Future<void> startListening({
    required void Function(SpeechRecognitionResult result) onResult,
    String localeId = 'de_DE',
  }) async {
    if (!_isInitialized) {
      final ok = await init();
      if (!ok) return;
    }

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
