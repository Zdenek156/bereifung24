import 'dart:async';
import 'dart:typed_data';
import 'dart:io';
import 'package:audio_session/audio_session.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';
import 'package:path_provider/path_provider.dart';

class ElevenLabsTtsService {
  static final ElevenLabsTtsService _instance =
      ElevenLabsTtsService._internal();
  factory ElevenLabsTtsService() => _instance;
  ElevenLabsTtsService._internal();

  final _player = AudioPlayer();
  final _dio = Dio();
  StreamSubscription<PlayerState>? _playerSub;

  // ElevenLabs config - fetched from backend
  String? _apiKey;
  String _voiceId = 'pNInz6obpgDQGcFmaJgB'; // "Adam" - German male voice

  bool _isSpeaking = false;
  bool get isSpeaking => _isSpeaking;

  /// Initialize with API key from backend
  Future<void> init({required String apiKey, String? voiceId}) async {
    _apiKey = apiKey;
    if (voiceId != null) _voiceId = voiceId;
    debugPrint('[TTS] Initialized with voiceId=$_voiceId, apiKey length=${apiKey.length}');
  }

  /// Speak text using ElevenLabs TTS
  Future<void> speak(String text) async {
    if (_apiKey == null || _apiKey!.isEmpty || text.trim().isEmpty) {
      debugPrint('[TTS] speak() aborted: apiKey=${_apiKey == null ? "null" : "len=${_apiKey!.length}"}, text empty=${text.trim().isEmpty}');
      return;
    }
    debugPrint('[TTS] Speaking text (${text.length} chars)...');

    // Stop any current playback
    await stop();

    _isSpeaking = true;

    try {
      // Clean text: remove markdown and emojis, keep all readable text
      var cleanText = text;
      // Remove bold markers but keep content
      cleanText = cleanText.replaceAllMapped(
        RegExp(r'\*\*([^*]+)\*\*'),
        (m) => m.group(1) ?? '',
      );
      // Remove italic markers but keep content
      cleanText = cleanText.replaceAllMapped(
        RegExp(r'\*([^*]+)\*'),
        (m) => m.group(1) ?? '',
      );
      // Remove remaining markdown
      cleanText = cleanText
          .replaceAll(RegExp(r'#{1,3}\s'), '') // headers
          .replaceAll(RegExp(r'`[^`]+`'), '') // inline code
          .replaceAll(RegExp(r'- '), ', ') // list items → commas
          .replaceAllMapped(
            RegExp(r'\[([^\]]+)\]\([^)]+\)'),
            (m) => m.group(1) ?? '',
          ) // links
          .replaceAll(RegExp(r'[\u{1F300}-\u{1FAFF}]', unicode: true), '') // emojis
          .replaceAll(RegExp(r'[\u{2600}-\u{27BF}]', unicode: true), '') // symbols
          .replaceAll(RegExp(r'[\u{FE00}-\u{FEFF}]', unicode: true), '')
          .replaceAll(RegExp(r'[\u{200B}-\u{200F}]', unicode: true), '')
          .replaceAll(RegExp(r'\s+'), ' ')
          .trim();

      if (cleanText.isEmpty) {
        _isSpeaking = false;
        return;
      }

      final response = await _dio.post(
        'https://api.elevenlabs.io/v1/text-to-speech/$_voiceId',
        options: Options(
          headers: {
            'xi-api-key': _apiKey!,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
          },
          responseType: ResponseType.bytes,
        ),
        data: {
          'text': cleanText,
          'model_id': 'eleven_multilingual_v2',
          'voice_settings': {
            'stability': 0.5,
            'similarity_boost': 0.75,
            'style': 0.0,
            'use_speaker_boost': true,
          },
        },
      );

      debugPrint('[TTS] ElevenLabs response: ${response.statusCode}, data size: ${(response.data as List<int>).length} bytes');
      if (response.statusCode == 200) {
        final bytes = response.data as List<int>;
        final tempDir = await getTemporaryDirectory();
        final file = File(
            '${tempDir.path}/tts_${DateTime.now().millisecondsSinceEpoch}.mp3');
        await file.writeAsBytes(Uint8List.fromList(bytes));
        debugPrint('[TTS] Saved to ${file.path}, playing...');

        await _player.setFilePath(file.path);
        // Cancel any previous listener to avoid leaks
        await _playerSub?.cancel();
        _playerSub = _player.playerStateStream.listen((state) {
          if (state.processingState == ProcessingState.completed) {
            _isSpeaking = false;
            file.delete().catchError((_) => file); // cleanup
          }
        });
        await _player.play();
      }
    } catch (e, stack) {
      debugPrint('[TTS] Error: $e');
      debugPrint('[TTS] Stack: $stack');
      _isSpeaking = false;
    }
  }

  /// Stop current playback and release audio session on iOS
  Future<void> stop() async {
    _isSpeaking = false;
    await _player.stop();
    // On iOS: deactivate audio session so speech recognition can take over
    if (Platform.isIOS) {
      try {
        final session = await AudioSession.instance;
        await session.setActive(false);
        debugPrint('[TTS] iOS audio session deactivated');
      } catch (e) {
        debugPrint('[TTS] Error deactivating iOS audio session: $e');
      }
    }
  }

  void dispose() {
    _player.dispose();
    _dio.close();
  }
}
