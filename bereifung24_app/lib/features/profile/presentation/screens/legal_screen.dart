import 'package:flutter/material.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';
import '../../../../core/network/api_client.dart';

/// Dynamic legal screen that fetches HTML content from the API
/// and renders it as native Flutter widgets using HtmlWidget.
class DynamicLegalScreen extends StatefulWidget {
  final String legalKey; // 'agb', 'impressum', 'datenschutz'
  final String fallbackTitle;

  const DynamicLegalScreen({
    super.key,
    required this.legalKey,
    required this.fallbackTitle,
  });

  @override
  State<DynamicLegalScreen> createState() => _DynamicLegalScreenState();
}

class _DynamicLegalScreenState extends State<DynamicLegalScreen> {
  bool _loading = true;
  String? _error;
  String _title = '';
  String _html = '';
  String? _updatedAt;

  @override
  void initState() {
    super.initState();
    _loadContent();
  }

  Future<void> _loadContent() async {
    try {
      final response = await ApiClient().dio.get(
        '/public/legal/${widget.legalKey}',
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        setState(() {
          _title = data['title'] ?? widget.fallbackTitle;
          _html = data['content'] ?? '';
          if (data['updatedAt'] != null) {
            final dt = DateTime.tryParse(data['updatedAt']);
            if (dt != null) {
              _updatedAt =
                  '${dt.day.toString().padLeft(2, '0')}.${dt.month.toString().padLeft(2, '0')}.${dt.year}';
            }
          }
          _loading = false;
        });
      } else {
        setState(() {
          _error = 'Inhalt konnte nicht geladen werden';
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error =
            'Verbindungsfehler. Bitte pr\u00fcfe deine Internetverbindung.';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_loading ? widget.fallbackTitle : _title)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.error_outline,
                            size: 48, color: Colors.grey[400]),
                        const SizedBox(height: 16),
                        Text(
                          _error!,
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                        const SizedBox(height: 16),
                        FilledButton(
                          onPressed: () {
                            setState(() {
                              _loading = true;
                              _error = null;
                            });
                            _loadContent();
                          },
                          child: const Text('Erneut versuchen'),
                        ),
                      ],
                    ),
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    if (_updatedAt != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Text(
                          'Stand: $_updatedAt',
                          style:
                              TextStyle(fontSize: 12, color: Colors.grey[500]),
                        ),
                      ),
                    HtmlWidget(
                      _html,
                      textStyle: const TextStyle(fontSize: 14, height: 1.5),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
    );
  }
}

// Convenience wrappers

class AGBScreen extends StatelessWidget {
  const AGBScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return const DynamicLegalScreen(
      legalKey: 'agb',
      fallbackTitle: 'Allgemeine Gesch\u00e4ftsbedingungen',
    );
  }
}

class DatenschutzScreen extends StatelessWidget {
  const DatenschutzScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return const DynamicLegalScreen(
      legalKey: 'datenschutz',
      fallbackTitle: 'Datenschutzerkl\u00e4rung',
    );
  }
}

class ImpressumScreen extends StatelessWidget {
  const ImpressumScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return const DynamicLegalScreen(
      legalKey: 'impressum',
      fallbackTitle: 'Impressum',
    );
  }
}

