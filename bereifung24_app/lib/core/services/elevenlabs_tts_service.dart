import 'dart:async';
import 'dart:typed_data';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:just_audio/just_audio.dart';
import 'package:path_provider/path_provider.dart';

class ElevenLabsTtsService {
  static final ElevenLabsTtsService _instance =
      ElevenLabsTtsService._internal();
  factory ElevenLabsTtsService() => _instance;
  ElevenLabsTtsService._internal();

  final _player = AudioPlayer();
  final _dio = Dio();

  // ElevenLabs config - fetched from backend
  String? _apiKey;
  String _voiceId = 'pNInz6obpgDQGcFmaJgB'; // "Adam" - German male voice

  bool _isSpeaking = false;
  bool get isSpeaking => _isSpeaking;

  /// Initialize with API key from backend
  Future<void> init({required String apiKey, String? voiceId}) async {
    _apiKey = apiKey;
    if (voiceId != null) _voiceId = voiceId;
  }

  /// Speak text using ElevenLabs TTS
  Future<void> speak(String text) async {
    if (_apiKey == null || _apiKey!.isEmpty || text.trim().isEmpty) return;

    // Stop any current playback
    await stop();

    _isSpeaking = true;

    try {
      // Clean text: remove markdown bold, emojis for cleaner speech
      final cleanText = text
          .replaceAll(RegExp(r'\*\*(.+?)\*\*'), r'$1')
          .replaceAll(RegExp(r'[^\w\s.,!?äöüÄÖÜß€\-:;()]+'), ' ')
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

      if (response.statusCode == 200) {
        final bytes = response.data as List<int>;
        final tempDir = await getTemporaryDirectory();
        final file = File(
            '${tempDir.path}/tts_${DateTime.now().millisecondsSinceEpoch}.mp3');
        await file.writeAsBytes(Uint8List.fromList(bytes));

        await _player.setFilePath(file.path);
        _player.playerStateStream.listen((state) {
          if (state.processingState == ProcessingState.completed) {
            _isSpeaking = false;
            file.delete().catchError((_) => file); // cleanup
          }
        });
        await _player.play();
      }
    } catch (e) {
      _isSpeaking = false;
    }
  }

  /// Stop current playback
  Future<void> stop() async {
    _isSpeaking = false;
    await _player.stop();
  }

  void dispose() {
    _player.dispose();
    _dio.close();
  }
}
