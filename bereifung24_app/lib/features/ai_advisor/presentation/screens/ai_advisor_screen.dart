import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:wakelock_plus/wakelock_plus.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/services/location_service.dart';
import '../../../../core/services/speech_service.dart';
import '../../../../core/services/elevenlabs_tts_service.dart';
import '../../../../core/services/remote_logger.dart';
import '../../../../data/models/models.dart';
import '../../../vehicles/presentation/screens/vehicles_screen.dart';
import '../../../search/presentation/screens/search_screen.dart';
import '../../../home/presentation/screens/home_screen.dart'
    show homeVehicleIndexProvider, saveHomeVehicleIndex;
import '../../../auth/providers/auth_provider.dart';
import '../widgets/rollo_voice_mode.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../main.dart' show localeProvider;

// ══════════════════════════════════════
// 🤖 KI Reifen-Berater
// ══════════════════════════════════════

class _ChatMessage {
  final String role; // 'user' | 'ai'
  final String text;
  final String time;
  final List<_QuickChip>? chips;
  final List<_RecommendedTire>? recommendedTires;
  final List<Vehicle>? vehicleChoices;

  _ChatMessage({
    required this.role,
    required this.text,
    required this.time,
    this.chips,
    this.recommendedTires,
    this.vehicleChoices,
  });
}

class _RecommendedTire {
  final String brand;
  final String model;
  final String size;
  final String width;
  final String height;
  final String diameter;
  final String season;
  final String loadIndex;
  final String speedIndex;
  final String labelFuelEfficiency;
  final String labelWetGrip;
  final int labelNoise;
  final String articleId;
  final String? axle; // 'front' | 'rear' | null (normal tires)

  _RecommendedTire({
    required this.brand,
    required this.model,
    required this.size,
    required this.width,
    required this.height,
    required this.diameter,
    required this.season,
    required this.loadIndex,
    required this.speedIndex,
    required this.labelFuelEfficiency,
    required this.labelWetGrip,
    required this.labelNoise,
    required this.articleId,
    this.axle,
  });

  factory _RecommendedTire.fromJson(Map<String, dynamic> json) {
    return _RecommendedTire(
      brand: json['brand'] ?? '',
      model: json['model'] ?? '',
      size: json['size'] ?? '',
      width: json['width']?.toString() ?? '',
      height: json['height']?.toString() ?? '',
      diameter: json['diameter']?.toString() ?? '',
      season: json['season'] ?? '',
      loadIndex: json['loadIndex']?.toString() ?? '-',
      speedIndex: json['speedIndex']?.toString() ?? '-',
      labelFuelEfficiency: json['labelFuelEfficiency']?.toString() ?? '-',
      labelWetGrip: json['labelWetGrip']?.toString() ?? '-',
      labelNoise: (json['labelNoise'] as num?)?.toInt() ?? 0,
      articleId: json['articleId']?.toString() ?? '',
      axle: json['axle'] as String?,
    );
  }
}

class _QuickChip {
  final String id;
  final String label;
  _QuickChip(this.id, this.label);
}

class AIAdvisorScreen extends ConsumerStatefulWidget {
  const AIAdvisorScreen({super.key});

  @override
  ConsumerState<AIAdvisorScreen> createState() => _AIAdvisorScreenState();
}

class _AIAdvisorScreenState extends ConsumerState<AIAdvisorScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final _focusNode = FocusNode();
  final List<_ChatMessage> _messages = [];
  List<Map<String, dynamic>> _chatHistory = [];
  bool _isTyping = false;
  String? _vehicleId;
  _RecommendedTire? _selectedTire;
  _RecommendedTire? _selectedFrontTire;
  _RecommendedTire? _selectedRearTire;
  String? _pendingMessage; // stored when vehicle selection is needed first
  bool _vehicleSelectionShown = false; // track if we already asked for vehicle
  String _vehicleType = 'CAR'; // CAR, MOTORCYCLE, TRAILER

  // Voice
  bool _isListening = false;
  bool _isSpeaking = false;
  bool _ttsEnabled = false;
  bool _autoSpeak =
      false; // text chat should stay silent; voice mode handles speech
  String _partialSpeech = '';

  // Voice Mode (fullscreen immersive)
  bool _isVoiceMode = false;
  VoiceState _voiceState = VoiceState.idle;
  String _voiceStatusText = '';
  String? _lastAiText;
  Timer? _listeningTimeout; // safety timeout for stuck listening

  /// Map app locale to speech recognition locale ID
  String get _speechLocaleId {
    final lang = ref.read(localeProvider).languageCode;
    const map = {
      'de': 'de_DE',
      'en': 'en_US',
      'tr': 'tr_TR',
      'ru': 'ru_RU',
      'it': 'it_IT',
      'fr': 'fr_FR',
      'es': 'es_ES',
    };
    return map[lang] ?? 'de_DE';
  }

  // TTS init future (await before first speech)
  late final Future<void> _ttsInitFuture;

  @override
  void initState() {
    super.initState();
    _initChat();
    _ttsInitFuture = _initTts();
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    _listeningTimeout?.cancel();
    super.dispose();
  }

  Future<void> _initTts() async {
    try {
      final response = await ApiClient().getTtsConfig();
      final data = response.data;
      if (data['enabled'] == true && data['apiKey'] != null) {
        await ElevenLabsTtsService().init(
          apiKey: data['apiKey'],
          voiceId: data['voiceId'],
        );
        if (mounted) setState(() => _ttsEnabled = true);
      }
    } catch (e) {
      debugPrint('[TTS] Init failed: $e');
      // TTS not available — silently ignore
    }
  }

  Future<void> _stopSpeaking() async {
    await ElevenLabsTtsService().stop();
    setState(() => _isSpeaking = false);
  }

  // ── Voice Mode ──

  Future<void> _enterVoiceMode() async {
    try {
      await RemoteLogger.log('voice', 'enterVoiceMode tapped', data: {
        'platform': Platform.operatingSystem,
        'osVersion': Platform.operatingSystemVersion,
      });

      // Request microphone permission first
      final micStatus = await Permission.microphone.request();
      await RemoteLogger.log('voice', 'mic permission result: $micStatus');
      if (!micStatus.isGranted) {
        await RemoteLogger.error(
            'voice', 'mic permission NOT granted: $micStatus');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(S.of(context)!.micPermissionNeeded)),
          );
          // Open app settings so user can grant permission manually
          if (micStatus.isPermanentlyDenied || micStatus.isDenied) {
            await openAppSettings();
          }
        }
        return;
      }

      // iOS also requires speech recognition permission separately
      if (Platform.isIOS) {
        final speechStatus = await Permission.speech.request();
        await RemoteLogger.log(
            'voice', 'iOS speech permission result: $speechStatus');
        if (!speechStatus.isGranted) {
          await RemoteLogger.error(
              'voice', 'iOS speech permission NOT granted: $speechStatus');
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(S.of(context)!.speechPermissionNeeded)),
            );
            if (speechStatus.isPermanentlyDenied || speechStatus.isDenied) {
              await openAppSettings();
            }
          }
          return;
        }
      }

      // Pre-initialize speech service so it's ready when user taps mic
      final speechReady = await SpeechService().init();
      await RemoteLogger.log(
          'voice', 'speechService.init() result: $speechReady');

      if (!speechReady) {
        await RemoteLogger.error(
            'voice', 'speechService.init() returned false');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(S.of(context)!.speechInitFailed)),
          );
        }
        return;
      }

      // Stop TTS if playing
      if (_isSpeaking) await _stopSpeaking();

      // Keep screen awake during voice mode
      WakelockPlus.enable();

      setState(() {
        _isVoiceMode = true;
        _voiceState = VoiceState.speaking;
        _voiceStatusText = S.of(context)!.rolloGreeting;
        _partialSpeech = '';
        _isSpeaking = true;
      });

      // Wait for TTS to be initialized BEFORE greeting
      await _ttsInitFuture;
      if (!mounted || !_isVoiceMode) return;

      // Rollo greets the user — personalize with vehicle if available
      final selectedVehicle = ref.read(selectedVehicleProvider);
      final vehicleName = (selectedVehicle != null)
          ? '${selectedVehicle.make} ${selectedVehicle.model}'
          : null;
      final greeting = (vehicleName != null && vehicleName.trim().isNotEmpty)
          ? S.of(context)!.rolloIntroWithVehicle(vehicleName)
          : S.of(context)!.rolloIntroGeneric;
      setState(() {
        _messages
            .add(_ChatMessage(role: 'ai', text: greeting, time: _timeStr()));
        _lastAiText = greeting;
      });
      _scrollToBottom();

      if (!_ttsEnabled) {
        // TTS not available — go straight to idle listening state
        setState(() {
          _isSpeaking = false;
          _voiceState = VoiceState.idle;
          _voiceStatusText = S.of(context)!.tapToSpeak;
        });
      }

      // Small delay then speak — TTS is guaranteed initialized now
      await Future.delayed(const Duration(milliseconds: 300));
      if (!mounted || !_isVoiceMode) return;
      await ElevenLabsTtsService().speak(greeting);
      _waitForTtsFinish();
    } catch (e, stack) {
      await RemoteLogger.error('voice', 'enterVoiceMode EXCEPTION: $e', data: {
        'stack': stack.toString().split('\n').take(10).join('\n'),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${S.of(context)!.voiceModeError}: $e')),
        );
      }
    }
  }

  void _exitVoiceMode() {
    _stopSpeaking();
    _listeningTimeout?.cancel();
    if (_isListening) {
      SpeechService().stopListening();
    }
    // Allow screen to turn off again
    WakelockPlus.disable();
    setState(() {
      _isVoiceMode = false;
      _isListening = false;
      _voiceState = VoiceState.idle;
      _partialSpeech = '';
    });
  }

  /// Strip any English thinking/reasoning text that leaked through from Gemini 2.5 Flash
  String _cleanAiResponse(String text) {
    var cleaned = text;
    // Remove "TI: ..." or "Thinking: ..." prefixed blocks (usually English)
    cleaned = cleaned.replaceAll(
        RegExp(r'^(TI|Thinking|THINKING|Thought|Internal|Note):\s*.+?\n\n',
            dotAll: true),
        '');
    // Remove lines that are clearly English thinking (e.g. "The user wants...")
    cleaned = cleaned.replaceAll(
        RegExp(
            r'^(The user|I need to|I should|Let me|I will|Here is|Based on)\s.+?\n',
            multiLine: true),
        '');
    // Remove German license plates in parentheses, e.g. "(VAI MK6)" or "(LB RR6)"
    cleaned = cleaned.replaceAll(
        RegExp(r'\s*\([A-ZÄÖÜ]{1,3}[\s-][A-Z]{1,2}\s?\d{1,4}[HE]?\)'), '');
    return cleaned.trim();
  }

  Future<void> _voiceModeStartListening() async {
    if (_isListening) return;
    await RemoteLogger.log('voice', 'startListening called', data: {
      'isSpeaking': _isSpeaking,
      'platform': Platform.operatingSystem,
    });

    // Stop TTS if playing
    if (_isSpeaking) await _stopSpeaking();

    // On iOS: ensure audio session is released from playback mode
    // by explicitly stopping the player and giving iOS time to switch
    if (Platform.isIOS) {
      await ElevenLabsTtsService().stop();
      await Future.delayed(const Duration(milliseconds: 600));
      await RemoteLogger.log(
          'voice', 'iOS: audio session released, starting speech');
    }

    setState(() {
      _isListening = true;
      _voiceState = VoiceState.listening;
      _voiceStatusText = S.of(context)!.listening;
      _partialSpeech = '';
    });

    // Safety timeout: if no final result after 12 seconds, reset to idle
    _listeningTimeout?.cancel();
    _listeningTimeout = Timer(const Duration(seconds: 12), () {
      if (!mounted || !_isListening) return;
      debugPrint('[Voice] Listening timeout - resetting to idle');
      SpeechService().stopListening();
      setState(() {
        _isListening = false;
        _voiceState = VoiceState.idle;
        _voiceStatusText = S.of(context)!.tapToSpeak;
      });
      // If we have partial speech, send it
      if (_partialSpeech.trim().isNotEmpty) {
        _voiceModeSendMessage(_partialSpeech.trim());
        _partialSpeech = '';
      }
    });

    final success = await SpeechService().startListening(
      localeId: _speechLocaleId,
      onResult: (result) {
        if (!mounted) return;
        setState(() {
          _partialSpeech = result.recognizedWords;
        });
        if (result.finalResult) {
          _listeningTimeout?.cancel();
          setState(() => _isListening = false);
          if (_partialSpeech.trim().isNotEmpty) {
            _voiceModeSendMessage(_partialSpeech.trim());
            _partialSpeech = '';
          } else {
            setState(() {
              _voiceState = VoiceState.idle;
              _voiceStatusText = S.of(context)!.tapToSpeak;
            });
          }
        }
      },
    );

    if (!success && mounted) {
      await RemoteLogger.error('voice', 'startListening returned false', data: {
        'platform': Platform.operatingSystem,
      });
      setState(() {
        _isListening = false;
        _voiceState = VoiceState.idle;
        _voiceStatusText = S.of(context)!.speechNotAvailableMsg;
      });
    }
  }

  void _voiceModeStopAction() {
    _listeningTimeout?.cancel();
    if (_isListening) {
      SpeechService().stopListening();
      setState(() {
        _isListening = false;
        _voiceState = VoiceState.idle;
        _voiceStatusText = S.of(context)!.tapToSpeak;
      });
      // Send partial speech if any
      if (_partialSpeech.trim().isNotEmpty) {
        _voiceModeSendMessage(_partialSpeech.trim());
        _partialSpeech = '';
      }
    } else if (_isSpeaking) {
      _stopSpeaking();
      setState(() {
        _voiceState = VoiceState.idle;
        _voiceStatusText = S.of(context)!.tapToSpeak;
      });
    }
  }

  Future<void> _voiceModeSendMessage(String text) async {
    debugPrint('[voice] _voiceModeSendMessage called: "$text"');
    // Explicitly stop speech recognition to release audio session
    if (_isListening) {
      SpeechService().stopListening();
      setState(() => _isListening = false);
    }

    setState(() {
      _voiceState = VoiceState.thinking;
      _voiceStatusText = S.of(context)!.rolloThinking;
    });

    // Add user message to chat history
    setState(() {
      _messages
          .add(_ChatMessage(role: 'user', text: text.trim(), time: _timeStr()));
      _isTyping = true;
    });
    _scrollToBottom();

    try {
      // Vehicle selection — auto-select single vehicle or use existing
      if (_vehicleId == null && !_vehicleSelectionShown) {
        final lc = text.trim().toLowerCase();
        final needsVehicle = lc.contains('reifen') ||
            lc.contains('empfehlung') ||
            lc.contains('tire') ||
            lc.contains('werkstatt') ||
            lc.contains('montage') ||
            lc.contains('sommer') ||
            lc.contains('winter') ||
            lc.contains('ganzjahr');
        if (needsVehicle) {
          final vehiclesAsync = ref.read(vehiclesProvider);
          List<Vehicle> vehicleList = [];
          vehiclesAsync.whenData((vehicles) {
            vehicleList = vehicles;
          });
          if (vehicleList.length == 1) {
            _vehicleId = vehicleList.first.id;
            _vehicleType = vehicleList.first.vehicleType;
            ref.read(selectedVehicleProvider.notifier).state =
                vehicleList.first;
            ref.read(homeVehicleIndexProvider.notifier).state = 0;
            saveHomeVehicleIndex(0);
          } else if (vehicleList.length > 1) {
            // In voice mode: don't exit, let AI handle vehicle selection conversationally
            // Backend loads all vehicles, AI knows about them and will ask
            _vehicleSelectionShown = true;
          }
        }
      }

      double? lat, lng;
      try {
        final pos = await LocationService().getCurrentPosition();
        if (pos != null) {
          lat = pos.latitude;
          lng = pos.longitude;
        }
      } catch (_) {}

      debugPrint('[voice] calling API with vehicleId=$_vehicleId');
      final response = await ApiClient().sendAIChat(
        message: text.trim(),
        chatHistory: _chatHistory,
        vehicleId: _vehicleId,
        latitude: lat,
        longitude: lng,
        language: Localizations.localeOf(context).languageCode,
      );
      debugPrint(
          '[voice] API response received, status=${response.statusCode}');

      if (!mounted) return;

      final data = response.data;
      final aiText = _cleanAiResponse(
          data['response'] as String? ?? S.of(context)!.noResponseReceived);
      final newHistory = data['chatHistory'] as List? ?? [];
      debugPrint(
          '[voice] aiText (${aiText.length} chars): ${aiText.substring(0, aiText.length > 80 ? 80 : aiText.length)}...');

      // Parse recommended tires
      List<_RecommendedTire>? recTires;
      final rawTires = data['recommendedTires'] as List?;
      if (rawTires != null && rawTires.isNotEmpty) {
        recTires = rawTires
            .map((e) =>
                _RecommendedTire.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
        debugPrint('[voice] parsed ${recTires.length} recommended tires');
      } else {
        debugPrint('[voice] no recommendedTires in response');
      }

      // Sync selectedVehicleId from AI response (server knows which vehicle)
      final serverVehicleId = data['selectedVehicleId'] as String?;
      if (serverVehicleId != null && _vehicleId == null) {
        debugPrint(
            '[voice] server returned selectedVehicleId=$serverVehicleId');
        _vehicleId = serverVehicleId;
      }

      setState(() {
        _chatHistory =
            newHistory.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        _messages.add(_ChatMessage(
            role: 'ai',
            text: aiText,
            time: _timeStr(),
            recommendedTires: recTires));
        _isTyping = false;
        _lastAiText = aiText;
      });

      // Speak the response in voice mode
      debugPrint('[voice] ttsEnabled=$_ttsEnabled, isVoiceMode=$_isVoiceMode');
      if (_ttsEnabled && _isVoiceMode) {
        setState(() {
          _voiceState = VoiceState.speaking;
          _voiceStatusText = S.of(context)!.rolloSpeaking;
          _isSpeaking = true;
        });
        // Small delay to let Android release the audio session from speech recognition
        await Future.delayed(const Duration(milliseconds: 400));
        if (!mounted || !_isVoiceMode) return;
        debugPrint('[voice] calling TTS speak...');
        await ElevenLabsTtsService().speak(aiText);
        debugPrint('[voice] TTS speak returned, waiting for finish');
        // Wait for TTS to finish, then go back to idle
        _waitForTtsFinish();
      } else {
        debugPrint('[voice] TTS disabled or not in voice mode, going to idle');
        setState(() {
          _voiceState = VoiceState.idle;
          _voiceStatusText = S.of(context)!.tapToSpeak;
        });
      }
    } catch (e, stack) {
      debugPrint('[voice] ERROR in _voiceModeSendMessage: $e');
      debugPrint(
          '[voice] STACK: ${stack.toString().split('\n').take(5).join('\n')}');
      if (!mounted) return;
      setState(() {
        _messages.add(_ChatMessage(
          role: 'ai',
          text: S.of(context)!.aiErrorMessage,
          time: _timeStr(),
        ));
        _isTyping = false;
        _voiceState = VoiceState.idle;
        _voiceStatusText = S.of(context)!.tapToSpeak;
      });
    }
    _scrollToBottom();
  }

  void _waitForTtsFinish() {
    if (!mounted || !_isVoiceMode) return;
    if (ElevenLabsTtsService().isSpeaking) {
      Future.delayed(const Duration(milliseconds: 300), _waitForTtsFinish);
    } else {
      setState(() {
        _isSpeaking = false;
        _voiceState = VoiceState.idle;
        _voiceStatusText = S.of(context)!.tapToSpeak;
      });
      // Auto-restart listening after AI finishes speaking
      if (_isVoiceMode) {
        // iOS needs more time for audio session to switch from playback to recording
        final delay = Platform.isIOS ? 800 : 500;
        Future.delayed(Duration(milliseconds: delay), _voiceModeStartListening);
      }
    }
  }

  void _onVehicleSelected(Vehicle vehicle) {
    setState(() {
      _vehicleId = vehicle.id;
      _vehicleType = vehicle.vehicleType;
      _messages.add(_ChatMessage(
        role: 'user',
        text: '${vehicle.make} ${vehicle.model}',
        time: _timeStr(),
      ));
      _messages.add(_ChatMessage(
        role: 'ai',
        text: S.of(context)!.vehicleSelected(
            '${vehicle.make} ${vehicle.model}',
            vehicle.tireSizeWithIndex.isNotEmpty
                ? vehicle.tireSizeWithIndex
                : S.of(context)!.tireNotStoredLabel),
        time: _timeStr(),
      ));
    });
    // Sync to selectedVehicleProvider AND home vehicle card
    ref.read(selectedVehicleProvider.notifier).state = vehicle;
    // Update home screen vehicle card so it stays in sync
    final vehiclesAsync = ref.read(vehiclesProvider);
    if (vehiclesAsync is AsyncData<List<Vehicle>>) {
      final idx = vehiclesAsync.value.indexWhere((v) => v.id == vehicle.id);
      if (idx >= 0) {
        ref.read(homeVehicleIndexProvider.notifier).state = idx;
        saveHomeVehicleIndex(idx);
      }
    }
    _scrollToBottom();
    // If there was a pending message, send it now
    if (_pendingMessage != null) {
      final msg = _pendingMessage!;
      _pendingMessage = null;
      _sendMessage(msg);
    }
  }

  void _initChat() {
    setState(() {
      _messages.add(_ChatMessage(
        role: 'ai',
        text: S.of(context)!.rolloInitialGreeting,
        time: _timeStr(),
        chips: [
          _QuickChip('recommend', '🎯 ${S.of(context)!.tireRecommendation}'),
          _QuickChip('help', '❓ ${S.of(context)!.appHelp}'),
          _QuickChip('workshop', '🔧 ${S.of(context)!.findWorkshop}'),
          _QuickChip('free', '💬 ${S.of(context)!.askFreely}'),
        ],
      ));
    });
  }

  String _timeStr() {
    final t = DateTime.now();
    return '${t.hour}:${t.minute.toString().padLeft(2, '0')}';
  }

  Future<void> _sendMessage(String text) async {
    if (text.trim().isEmpty) return;
    _controller.clear();

    // Check if vehicle selection is needed for tire-related queries
    if (_vehicleId == null && !_vehicleSelectionShown) {
      final lc = text.trim().toLowerCase();
      final needsVehicle = lc.contains('reifen') ||
          lc.contains('empfehlung') ||
          lc.contains('tire') ||
          lc.contains('werkstatt') ||
          lc.contains('montage') ||
          lc.contains('sommer') ||
          lc.contains('winter') ||
          lc.contains('ganzjahr');
      if (needsVehicle) {
        final vehiclesAsync = ref.read(vehiclesProvider);
        List<Vehicle> vehicleList = [];
        vehiclesAsync.whenData((vehicles) {
          vehicleList = vehicles;
        });
        if (vehicleList.isEmpty) {
          setState(() {
            _messages.add(_ChatMessage(
                role: 'user', text: text.trim(), time: _timeStr()));
            _messages.add(_ChatMessage(
              role: 'ai',
              text: S.of(context)!.noVehicleForAi,
              time: _timeStr(),
            ));
          });
          _scrollToBottom();
          return;
        } else if (vehicleList.length == 1) {
          // Auto-select single vehicle silently
          final v = vehicleList.first;
          _vehicleId = v.id;
          _vehicleType = v.vehicleType;
          ref.read(selectedVehicleProvider.notifier).state = v;
          ref.read(homeVehicleIndexProvider.notifier).state = 0;
          saveHomeVehicleIndex(0);
        } else {
          // Multiple vehicles — ask user to pick, store message for later
          _vehicleSelectionShown = true;
          _pendingMessage = text.trim();
          setState(() {
            _messages.add(_ChatMessage(
                role: 'user', text: text.trim(), time: _timeStr()));
            _messages.add(_ChatMessage(
              role: 'ai',
              text: S.of(context)!.whichVehicle,
              time: _timeStr(),
              vehicleChoices: vehicleList,
            ));
          });
          _scrollToBottom();
          return;
        }
      }
    }

    setState(() {
      _messages
          .add(_ChatMessage(role: 'user', text: text.trim(), time: _timeStr()));
      _isTyping = true;
    });
    _scrollToBottom();

    try {
      // Get GPS for workshop context
      double? lat, lng;
      try {
        final pos = await LocationService().getCurrentPosition();
        if (pos != null) {
          lat = pos.latitude;
          lng = pos.longitude;
        }
      } catch (_) {}

      final response = await ApiClient().sendAIChat(
        message: text.trim(),
        chatHistory: _chatHistory,
        vehicleId: _vehicleId,
        latitude: lat,
        longitude: lng,
        language: Localizations.localeOf(context).languageCode,
      );

      if (!mounted) return;

      final data = response.data;
      final aiText = _cleanAiResponse(
          data['response'] as String? ?? S.of(context)!.noResponseReceived);
      final newHistory = data['chatHistory'] as List? ?? [];

      // Parse recommended tires
      List<_RecommendedTire>? recTires;
      final rawTires = data['recommendedTires'] as List?;
      if (rawTires != null && rawTires.isNotEmpty) {
        recTires = rawTires
            .map((e) =>
                _RecommendedTire.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      }

      // Sync selectedVehicleId from AI response (server knows which vehicle)
      final serverVehicleId = data['selectedVehicleId'] as String?;
      if (serverVehicleId != null && _vehicleId == null) {
        debugPrint('[chat] server returned selectedVehicleId=$serverVehicleId');
        _vehicleId = serverVehicleId;
      }

      setState(() {
        _chatHistory =
            newHistory.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        _messages.add(_ChatMessage(
            role: 'ai',
            text: aiText,
            time: _timeStr(),
            recommendedTires: recTires));
        _isTyping = false;
      });

      // Keep text chat silent. Speech output is handled only in voice mode.
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _messages.add(_ChatMessage(
          role: 'ai',
          text: S.of(context)!.aiErrorMessage,
          time: _timeStr(),
        ));
        _isTyping = false;
      });
    }
    _scrollToBottom();
  }

  void _onChipTapped(_QuickChip chip) {
    final chipMessages = {
      'recommend': S.of(context)!.chipRecommendMsg,
      'help': S.of(context)!.chipHelpMsg,
      'workshop': S.of(context)!.chipWorkshopMsg,
      'free': S.of(context)!.chipFreeMsg,
    };
    _sendMessage(chipMessages[chip.id] ?? chip.label);
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Voice Mode: fullscreen immersive
    if (_isVoiceMode) {
      // Collect recommended tires from last AI message
      List<_RecommendedTire>? lastTires;
      for (int i = _messages.length - 1; i >= 0; i--) {
        if (_messages[i].recommendedTires != null &&
            _messages[i].recommendedTires!.isNotEmpty) {
          lastTires = _messages[i].recommendedTires;
          break;
        }
      }

      final isMoto = _vehicleType == 'MOTORCYCLE';
      final hasMixed = lastTires != null &&
          lastTires.any((t) => t.axle == 'front') &&
          lastTires.any((t) => t.axle == 'rear');

      return RolloVoiceMode(
        voiceState: _voiceState,
        statusText: _voiceStatusText,
        partialSpeech: _partialSpeech.isNotEmpty ? _partialSpeech : null,
        lastAiText: _lastAiText,
        recommendedTires: lastTires,
        selectedTire: _selectedTire,
        selectedFrontTire: _selectedFrontTire,
        selectedRearTire: _selectedRearTire,
        isMotorcycle: isMoto,
        hasMixedTires: hasMixed,
        onClose: _exitVoiceMode,
        onMicTap: _voiceModeStartListening,
        onStopTap: _voiceModeStopAction,
        onTireSelected: (tire) {
          setState(() {
            final t = tire as _RecommendedTire;
            if (t.axle == 'front') {
              _selectedFrontTire = (_selectedFrontTire != null &&
                      _selectedFrontTire!.brand == t.brand &&
                      _selectedFrontTire!.model == t.model)
                  ? null
                  : t;
            } else if (t.axle == 'rear') {
              _selectedRearTire = (_selectedRearTire != null &&
                      _selectedRearTire!.brand == t.brand &&
                      _selectedRearTire!.model == t.model)
                  ? null
                  : t;
            } else {
              _selectedTire = (_selectedTire != null &&
                      _selectedTire!.brand == t.brand &&
                      _selectedTire!.model == t.model)
                  ? null
                  : t;
            }
          });
        },
        onTireSearch: (tire) {
          _exitVoiceMode();
          if (tire != null) {
            _navigateToSearch(tire as _RecommendedTire);
          } else if (_selectedFrontTire != null || _selectedRearTire != null) {
            _navigateToMixedSearch();
          }
        },
      );
    }

    return Scaffold(
      appBar: AppBar(
        backgroundColor: B24Colors.primaryBlue,
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Rollo AI',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline, size: 22),
            tooltip: S.of(context)!.deleteChat,
            onPressed: () {
              _stopSpeaking();
              setState(() {
                _messages.clear();
                _chatHistory.clear();
              });
              _initChat();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Chat messages
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              itemCount: _messages.length + (_isTyping ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length) return _buildTypingIndicator();
                return _buildMessageBubble(_messages[index], isDark);
              },
            ),
          ),

          // Input bar
          _buildInputBar(isDark),
        ],
      ),
    );
  }

  // ── Avatar Helpers ──

  Widget _aiAvatar() {
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
            color: B24Colors.primaryBlue.withValues(alpha: 0.2), width: 1.5),
        image: const DecorationImage(
          image: AssetImage('assets/images/services/ki_berater.jpg'),
          fit: BoxFit.cover,
        ),
      ),
    );
  }

  Widget _userAvatar() {
    final user = ref.watch(authStateProvider).user;
    final profileUrl = user?.profileImage;
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
            color: B24Colors.primaryBlue.withValues(alpha: 0.2), width: 1.5),
        image: profileUrl != null && profileUrl.isNotEmpty
            ? DecorationImage(
                image: NetworkImage(profileUrl.replaceAll('=s96-c', '=s200-c')),
                fit: BoxFit.cover,
              )
            : null,
      ),
      child: profileUrl == null || profileUrl.isEmpty
          ? Container(
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: B24Colors.primaryPale,
              ),
              child: const Icon(Icons.person,
                  size: 30, color: B24Colors.primaryBlue),
            )
          : null,
    );
  }

  // ── Message Bubble ──

  Widget _buildMessageBubble(_ChatMessage msg, bool isDark) {
    final isUser = msg.role == 'user';

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment:
            isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment:
                isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (!isUser) ...[_aiAvatar(), const SizedBox(width: 8)],
              Flexible(
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isUser
                        ? B24Colors.primaryBlue
                        : (isDark ? B24Colors.darkSurface : Colors.white),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(20),
                      topRight: const Radius.circular(20),
                      bottomLeft: Radius.circular(isUser ? 20 : 4),
                      bottomRight: Radius.circular(isUser ? 4 : 20),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color:
                            Colors.black.withValues(alpha: isDark ? 0.2 : 0.06),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: _RichTextContent(
                    text: msg.text,
                    isUser: isUser,
                    isDark: isDark,
                  ),
                ),
              ),
              if (isUser) ...[const SizedBox(width: 8), _userAvatar()],
            ],
          ),
          // Time + Speaker
          Padding(
            padding: EdgeInsets.only(
              top: 4,
              left: isUser ? 0 : 64,
              right: isUser ? 64 : 0,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment:
                  isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
              children: [
                Text(
                  msg.time,
                  style: TextStyle(
                    fontSize: 10,
                    color: isDark
                        ? B24Colors.darkTextSecondary
                        : B24Colors.textTertiary,
                  ),
                ),
              ],
            ),
          ),
          // Quick chips
          if (msg.chips != null && msg.chips!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: msg.chips!.map((chip) {
                return GestureDetector(
                  onTap: () => _onChipTapped(chip),
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: isDark
                          ? B24Colors.primaryBlue.withValues(alpha: 0.15)
                          : B24Colors.primaryPale,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: B24Colors.primaryBlue.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Text(
                      chip.label,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: B24Colors.primaryBlue,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
          // Vehicle choices
          if (msg.vehicleChoices != null &&
              msg.vehicleChoices!.isNotEmpty &&
              _vehicleId == null) ...[
            const SizedBox(height: 10),
            ...msg.vehicleChoices!.map((v) {
              final icon = v.vehicleType == 'MOTORCYCLE'
                  ? Icons.two_wheeler
                  : v.vehicleType == 'TRAILER'
                      ? Icons.rv_hookup
                      : Icons.directions_car;
              return Padding(
                padding: const EdgeInsets.only(bottom: 6, left: 40),
                child: GestureDetector(
                  onTap: () => _onVehicleSelected(v),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: isDark ? B24Colors.darkSurface : Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: B24Colors.primaryBlue.withValues(alpha: 0.3),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Icon(icon, color: B24Colors.primaryBlue, size: 24),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${v.make} ${v.model}',
                                style: const TextStyle(
                                    fontWeight: FontWeight.w600, fontSize: 14),
                              ),
                              if (v.tireSizeWithIndex.isNotEmpty)
                                Text(
                                  v.tireSizeWithIndex,
                                  style: TextStyle(
                                      fontSize: 12,
                                      color: isDark
                                          ? B24Colors.darkTextSecondary
                                          : Colors.grey[600]),
                                ),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right,
                            color: B24Colors.primaryBlue, size: 20),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ],
          // Recommended tire cards
          if (msg.recommendedTires != null &&
              msg.recommendedTires!.isNotEmpty) ...[
            const SizedBox(height: 10),
            ..._buildTireRecommendations(msg.recommendedTires!, isDark),
          ],
        ],
      ),
    );
  }

  // ── Tire Recommendations (grouped by axle for mixed tires) ──

  List<Widget> _buildTireRecommendations(
      List<_RecommendedTire> tires, bool isDark) {
    final frontTires = tires.where((t) => t.axle == 'front').toList();
    final rearTires = tires.where((t) => t.axle == 'rear').toList();
    final hasMixed = frontTires.isNotEmpty && rearTires.isNotEmpty;
    final isMoto = _vehicleType == 'MOTORCYCLE';
    final frontLabel =
        isMoto ? S.of(context)!.frontWheel : S.of(context)!.frontAxleFull;
    final rearLabel =
        isMoto ? S.of(context)!.rearWheel : S.of(context)!.rearAxleFull;

    if (hasMixed) {
      return [
        // Front section
        Padding(
          padding: const EdgeInsets.only(left: 40, bottom: 6),
          child: Text(
            '$frontLabel (${frontTires.first.size})',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color:
                  isDark ? B24Colors.darkTextSecondary : B24Colors.textTertiary,
            ),
          ),
        ),
        ...frontTires.map((tire) => _buildTireCard(tire, isDark)),
        const SizedBox(height: 8),
        // Rear section
        Padding(
          padding: const EdgeInsets.only(left: 40, bottom: 6),
          child: Text(
            '$rearLabel (${rearTires.first.size})',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color:
                  isDark ? B24Colors.darkTextSecondary : B24Colors.textTertiary,
            ),
          ),
        ),
        ...rearTires.map((tire) => _buildTireCard(tire, isDark)),
        // Search button — needs front + rear selection
        if (_selectedFrontTire != null || _selectedRearTire != null) ...[
          const SizedBox(height: 8),
          _buildMixedSearchButton(),
        ],
      ];
    } else {
      // Normal: all tires in one list
      return [
        ...tires.map((tire) => _buildTireCard(tire, isDark)),
        if (_selectedTire != null &&
            tires.any((t) =>
                t.brand == _selectedTire!.brand &&
                t.model == _selectedTire!.model)) ...[
          const SizedBox(height: 8),
          _buildSearchButton(_selectedTire!),
        ],
      ];
    }
  }

  Widget _buildSearchButton(_RecommendedTire t) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: () => _navigateToSearch(t),
        icon: const Icon(Icons.search, size: 18),
        label: Text(S.of(context)!.findWorkshopWithTire),
        style: ElevatedButton.styleFrom(
          backgroundColor: B24Colors.primaryBlue,
          foregroundColor: Colors.white,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }

  Widget _buildMixedSearchButton() {
    final hasFront = _selectedFrontTire != null;
    final hasRear = _selectedRearTire != null;
    final hasBoth = hasFront && hasRear;
    final label = hasBoth
        ? S.of(context)!.findWorkshopWithBothTires
        : hasFront
            ? S.of(context)!.findWorkshopWithFrontTire
            : S.of(context)!.findWorkshopWithRearTire;

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: () => _navigateToMixedSearch(),
        icon: const Icon(Icons.search, size: 18),
        label: Text(label),
        style: ElevatedButton.styleFrom(
          backgroundColor: B24Colors.primaryBlue,
          foregroundColor: Colors.white,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }

  void _navigateToMixedSearch() {
    _syncVehicleProvider();
    final t = _selectedFrontTire ?? _selectedRearTire!;
    final service =
        _vehicleType == 'MOTORCYCLE' ? 'MOTORCYCLE_TIRE' : 'TIRE_CHANGE';
    String url = '/search?service=$service'
        '&width=${Uri.encodeComponent(t.width)}'
        '&height=${Uri.encodeComponent(t.height)}'
        '&diameter=${Uri.encodeComponent(t.diameter)}'
        '&season=${Uri.encodeComponent(_seasonCode(t))}'
        '&loadIndex=${Uri.encodeComponent(t.loadIndex)}'
        '&speedIndex=${Uri.encodeComponent(t.speedIndex)}'
        '${t.articleId.isNotEmpty ? '&articleId=${Uri.encodeComponent(t.articleId)}' : ''}'
        '${t.brand.isNotEmpty ? '&tireBrand=${Uri.encodeComponent(t.brand)}' : ''}'
        '${t.model.isNotEmpty ? '&tireModel=${Uri.encodeComponent(t.model)}' : ''}';
    if (_selectedFrontTire != null && _selectedRearTire != null) {
      final r = _selectedRearTire!;
      url += '&rearWidth=${Uri.encodeComponent(r.width)}'
          '&rearHeight=${Uri.encodeComponent(r.height)}'
          '&rearDiameter=${Uri.encodeComponent(r.diameter)}'
          '&rearLoadIndex=${Uri.encodeComponent(r.loadIndex)}'
          '&rearSpeedIndex=${Uri.encodeComponent(r.speedIndex)}'
          '${r.articleId.isNotEmpty ? '&rearArticleId=${Uri.encodeComponent(r.articleId)}' : ''}'
          '${r.brand.isNotEmpty ? '&rearTireBrand=${Uri.encodeComponent(r.brand)}' : ''}'
          '${r.model.isNotEmpty ? '&rearTireModel=${Uri.encodeComponent(r.model)}' : ''}';
    }
    context.go(url);
  }

  void _syncVehicleProvider() {
    if (_vehicleId != null) {
      final vehiclesAsync = ref.read(vehiclesProvider);
      if (vehiclesAsync is AsyncData<List<Vehicle>>) {
        final idx = vehiclesAsync.value.indexWhere((v) => v.id == _vehicleId);
        if (idx >= 0) {
          final v = vehiclesAsync.value[idx];
          ref.read(selectedVehicleProvider.notifier).state = v;
          ref.read(homeVehicleIndexProvider.notifier).state = idx;
          saveHomeVehicleIndex(idx);
          _vehicleType = v.vehicleType;
        }
      }
    }
    // Fallback: match selected tire dimensions against ALL vehicles to identify vehicle
    if (_vehicleId == null) {
      final frontTire = _selectedFrontTire ?? _selectedTire;
      final rearTire = _selectedRearTire;
      if (frontTire != null) {
        final vehiclesAsync = ref.read(vehiclesProvider);
        if (vehiclesAsync is AsyncData<List<Vehicle>>) {
          final fw = int.tryParse(frontTire.width);
          final fd = int.tryParse(frontTire.diameter);
          final rw = rearTire != null ? int.tryParse(rearTire.width) : null;
          final rd = rearTire != null ? int.tryParse(rearTire.diameter) : null;

          // Pass 1: Try matching BOTH front+rear (most specific)
          if (rw != null && rd != null) {
            for (int i = 0; i < vehiclesAsync.value.length; i++) {
              final v = vehiclesAsync.value[i];
              final specs = [v.summerTires, v.winterTires, v.allSeasonTires]
                  .whereType<TireSpec>();
              for (final spec in specs) {
                if (spec.hasDifferentSizes) {
                  final frontOk = spec.width == fw && spec.diameter == fd;
                  final rearOk =
                      spec.rearWidth == rw && spec.rearDiameter == rd;
                  if (frontOk && rearOk) {
                    _vehicleId = v.id;
                    _vehicleType = v.vehicleType;
                    ref.read(selectedVehicleProvider.notifier).state = v;
                    ref.read(homeVehicleIndexProvider.notifier).state = i;
                    saveHomeVehicleIndex(i);
                    debugPrint(
                        '[sync] Matched BOTH front ${frontTire.width}R${frontTire.diameter} + rear ${rearTire!.width}R${rearTire.diameter} to ${v.displayName} (${v.vehicleType})');
                    break;
                  }
                }
              }
              if (_vehicleId != null) break;
            }
          }

          // Pass 2: Fallback to front-only match
          if (_vehicleId == null) {
            for (int i = 0; i < vehiclesAsync.value.length; i++) {
              final v = vehiclesAsync.value[i];
              final specs = [v.summerTires, v.winterTires, v.allSeasonTires]
                  .whereType<TireSpec>();
              for (final spec in specs) {
                final matchFront = spec.width == fw && spec.diameter == fd;
                final matchRear = spec.hasDifferentSizes &&
                    spec.rearWidth == fw &&
                    spec.rearDiameter == fd;
                if (matchFront || matchRear) {
                  _vehicleId = v.id;
                  _vehicleType = v.vehicleType;
                  ref.read(selectedVehicleProvider.notifier).state = v;
                  ref.read(homeVehicleIndexProvider.notifier).state = i;
                  saveHomeVehicleIndex(i);
                  debugPrint(
                      '[sync] Matched front-only ${frontTire.width}/${frontTire.height}R${frontTire.diameter} to ${v.displayName} (${v.vehicleType})');
                  break;
                }
              }
              if (_vehicleId != null) break;
            }
          }
        }
      }
    }
    // Final fallback: sync _vehicleType from selectedVehicleProvider
    if (_vehicleType == 'CAR' && _vehicleId == null) {
      final selected = ref.read(selectedVehicleProvider);
      if (selected != null) {
        _vehicleType = selected.vehicleType;
      }
    }
  }

  void _navigateToSearch(_RecommendedTire t) {
    _syncVehicleProvider();
    final seasonCode = _seasonCode(t);
    final service =
        _vehicleType == 'MOTORCYCLE' ? 'MOTORCYCLE_TIRE' : 'TIRE_CHANGE';
    context.go('/search?service=$service'
        '&width=${Uri.encodeComponent(t.width)}'
        '&height=${Uri.encodeComponent(t.height)}'
        '&diameter=${Uri.encodeComponent(t.diameter)}'
        '&season=${Uri.encodeComponent(seasonCode)}'
        '&loadIndex=${Uri.encodeComponent(t.loadIndex)}'
        '&speedIndex=${Uri.encodeComponent(t.speedIndex)}'
        '${t.articleId.isNotEmpty ? '&articleId=${Uri.encodeComponent(t.articleId)}' : ''}'
        '${t.brand.isNotEmpty ? '&tireBrand=${Uri.encodeComponent(t.brand)}' : ''}'
        '${t.model.isNotEmpty ? '&tireModel=${Uri.encodeComponent(t.model)}' : ''}');
  }

  String _seasonCode(_RecommendedTire t) {
    return t.season.toLowerCase().startsWith('s')
        ? 's'
        : t.season.toLowerCase().startsWith('w')
            ? 'w'
            : t.season.toLowerCase().startsWith('g')
                ? 'g'
                : t.season;
  }

  // ── Tire Recommendation Card ──

  Widget _buildTireCard(_RecommendedTire tire, bool isDark) {
    // For mixed tires: use axle-specific selection
    final bool isSelected;
    if (tire.axle == 'front') {
      isSelected = _selectedFrontTire != null &&
          _selectedFrontTire!.brand == tire.brand &&
          _selectedFrontTire!.model == tire.model;
    } else if (tire.axle == 'rear') {
      isSelected = _selectedRearTire != null &&
          _selectedRearTire!.brand == tire.brand &&
          _selectedRearTire!.model == tire.model;
    } else {
      isSelected = _selectedTire != null &&
          _selectedTire!.brand == tire.brand &&
          _selectedTire!.model == tire.model;
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 6, left: 40),
      child: GestureDetector(
        onTap: () {
          setState(() {
            if (tire.axle == 'front') {
              _selectedFrontTire = isSelected ? null : tire;
            } else if (tire.axle == 'rear') {
              _selectedRearTire = isSelected ? null : tire;
            } else {
              _selectedTire = isSelected ? null : tire;
            }
          });
        },
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: isSelected
                ? B24Colors.primaryBlue.withValues(alpha: 0.08)
                : (isDark ? B24Colors.darkSurface : Colors.white),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected
                  ? B24Colors.primaryBlue
                  : (isDark ? B24Colors.darkBorder : B24Colors.border),
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      '${tire.brand} ${tire.model}',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: isDark
                            ? B24Colors.darkTextPrimary
                            : B24Colors.textPrimary,
                      ),
                    ),
                  ),
                  if (isSelected)
                    const Icon(Icons.check_circle,
                        size: 18, color: B24Colors.primaryBlue),
                ],
              ),
              const SizedBox(height: 2),
              Text(
                '${tire.size} ${tire.loadIndex}${tire.speedIndex} · ${tire.season}',
                style: TextStyle(
                  fontSize: 11,
                  color: isDark
                      ? B24Colors.darkTextSecondary
                      : B24Colors.textTertiary,
                ),
              ),
              const SizedBox(height: 6),
              if (_vehicleType != 'MOTORCYCLE' &&
                  tire.labelFuelEfficiency != '-' &&
                  tire.labelWetGrip != '-' &&
                  tire.labelNoise > 0)
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    _euBadge('⛽', tire.labelFuelEfficiency, isDark),
                    _euBadge('💧', tire.labelWetGrip, isDark),
                    _euBadge('🔊', '${tire.labelNoise}dB', isDark),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _euBadge(String icon, String value, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: isDark ? B24Colors.darkBackground : B24Colors.background,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        '$icon $value',
        style: TextStyle(
          fontSize: 11,
          color: isDark ? B24Colors.darkTextSecondary : B24Colors.textTertiary,
        ),
      ),
    );
  }

  // ── Typing Indicator ──

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          _aiAvatar(),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark
                  ? B24Colors.darkSurface
                  : Colors.white,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
                bottomLeft: Radius.circular(4),
                bottomRight: Radius.circular(20),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(
                      alpha: Theme.of(context).brightness == Brightness.dark
                          ? 0.2
                          : 0.06),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const _TypingDots(),
          ),
        ],
      ),
    );
  }

  // ── Input Bar ──

  Widget _buildInputBar(bool isDark) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        12,
        8,
        12,
        8 + MediaQuery.of(context).padding.bottom,
      ),
      decoration: BoxDecoration(
        color: isDark ? B24Colors.darkSurface : Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Microphone button → launches Voice Mode
          GestureDetector(
            onTap: _isTyping ? null : _enterVoiceMode,
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [B24Colors.primaryBlue, B24Colors.primaryLight],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(22),
                boxShadow: [
                  BoxShadow(
                    color: B24Colors.primaryBlue.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              alignment: Alignment.center,
              child: const Icon(
                Icons.mic,
                color: Colors.white,
                size: 22,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: isDark ? B24Colors.darkBackground : B24Colors.background,
                borderRadius: BorderRadius.circular(24),
              ),
              child: TextField(
                controller: _controller,
                focusNode: _focusNode,
                maxLines: 3,
                minLines: 1,
                textInputAction: TextInputAction.send,
                onSubmitted: (text) => _sendMessage(text),
                decoration: InputDecoration(
                  hintText: S.of(context)!.askMeSomething,
                  hintStyle: TextStyle(
                    color: isDark
                        ? B24Colors.darkTextSecondary
                        : B24Colors.textTertiary,
                    fontSize: 14,
                  ),
                  border: InputBorder.none,
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
                style: TextStyle(
                  fontSize: 14,
                  color: isDark
                      ? B24Colors.darkTextPrimary
                      : B24Colors.textPrimary,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: _isTyping ? null : () => _sendMessage(_controller.text),
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color:
                    _isTyping ? B24Colors.textTertiary : B24Colors.primaryBlue,
                borderRadius: BorderRadius.circular(22),
              ),
              alignment: Alignment.center,
              child: const Icon(
                Icons.send_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Rich Text Content (Markdown-lite: bold + emoji) ──

class _RichTextContent extends StatelessWidget {
  final String text;
  final bool isUser;
  final bool isDark;

  const _RichTextContent({
    required this.text,
    required this.isUser,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final color = isUser
        ? Colors.white
        : (isDark ? B24Colors.darkTextPrimary : B24Colors.textPrimary);

    // Parse **bold** markdown
    final spans = <TextSpan>[];
    final pattern = RegExp(r'\*\*(.+?)\*\*');
    int lastEnd = 0;

    for (final match in pattern.allMatches(text)) {
      if (match.start > lastEnd) {
        spans.add(TextSpan(text: text.substring(lastEnd, match.start)));
      }
      spans.add(TextSpan(
        text: match.group(1),
        style: const TextStyle(fontWeight: FontWeight.w700),
      ));
      lastEnd = match.end;
    }
    if (lastEnd < text.length) {
      spans.add(TextSpan(text: text.substring(lastEnd)));
    }

    return RichText(
      text: TextSpan(
        style: TextStyle(
          fontSize: 14,
          height: 1.45,
          color: color,
        ),
        children: spans.isEmpty ? [TextSpan(text: text)] : spans,
      ),
    );
  }
}

// ── Typing Dots Animation ──

class _TypingDots extends StatefulWidget {
  const _TypingDots();

  @override
  State<_TypingDots> createState() => _TypingDotsState();
}

class _TypingDotsState extends State<_TypingDots>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(3, (i) {
            final delay = i * 0.2;
            final t = ((_controller.value - delay) % 1.0).clamp(0.0, 1.0);
            final opacity =
                0.3 + 0.7 * (t < 0.5 ? t * 2 : (1 - t) * 2).clamp(0.0, 1.0);
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: Opacity(
                opacity: opacity,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: B24Colors.primaryBlue,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            );
          }),
        );
      },
    );
  }
}
