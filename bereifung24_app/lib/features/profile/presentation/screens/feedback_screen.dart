import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_theme.dart';

class FeedbackScreen extends ConsumerStatefulWidget {
  const FeedbackScreen({super.key});

  @override
  ConsumerState<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends ConsumerState<FeedbackScreen> {
  int _selectedRating = 0;
  final _commentController = TextEditingController();
  bool _isSubmitting = false;
  bool _submitted = false;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_selectedRating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Bitte wähle eine Bewertung')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      await ApiClient().submitFeedback(
        rating: _selectedRating,
        comment: _commentController.text.trim().isEmpty
            ? null
            : _commentController.text.trim(),
      );
      if (mounted) {
        setState(() => _submitted = true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Fehler beim Senden. Bitte versuche es erneut.'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_submitted) {
      return Scaffold(
        appBar: AppBar(title: const Text('Feedback')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_rounded,
                    color: Colors.green,
                    size: 48,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Vielen Dank!',
                  style: Theme.of(context)
                      .textTheme
                      .headlineSmall
                      ?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Dein Feedback hilft uns, Bereifung24 noch besser zu machen.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: isDark ? Colors.grey[400] : Colors.grey[600],
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 32),
                FilledButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Zurück'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Feedback geben')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Text(
              'Wie zufrieden bist du mit Bereifung24?',
              style: Theme.of(context)
                  .textTheme
                  .titleLarge
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Deine Meinung ist uns wichtig! Bewerte uns und hinterlasse optional einen Kommentar.',
              style: TextStyle(
                color: isDark ? Colors.grey[400] : Colors.grey[600],
                fontSize: 14,
              ),
            ),

            const SizedBox(height: 32),

            // Smiley rating
            Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  final rating = index + 1;
                  final isSelected = _selectedRating == rating;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedRating = rating),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.symmetric(horizontal: 6),
                      width: isSelected ? 60 : 52,
                      height: isSelected ? 60 : 52,
                      decoration: BoxDecoration(
                        color: isSelected
                            ? _ratingColor(rating).withValues(alpha: 0.15)
                            : isDark
                                ? Colors.grey[800]
                                : Colors.grey[100],
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isSelected
                              ? _ratingColor(rating)
                              : Colors.transparent,
                          width: 2.5,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          _ratingEmoji(rating),
                          style: TextStyle(
                            fontSize: isSelected ? 30 : 26,
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ),

            if (_selectedRating > 0) ...[
              const SizedBox(height: 12),
              Center(
                child: Text(
                  _ratingLabel(_selectedRating),
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: _ratingColor(_selectedRating),
                  ),
                ),
              ),
            ],

            const SizedBox(height: 32),

            // Comment field
            Text(
              'Kommentar (optional)',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 15,
                color: isDark ? Colors.grey[300] : Colors.grey[800],
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _commentController,
              maxLines: 4,
              maxLength: 500,
              decoration: InputDecoration(
                hintText: 'Was können wir verbessern? Was gefällt dir gut?',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
                fillColor: isDark ? Colors.grey[850] : Colors.grey[50],
              ),
            ),

            const SizedBox(height: 24),

            // Submit button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: FilledButton.icon(
                onPressed: _isSubmitting ? null : _submit,
                icon: _isSubmitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.send_rounded),
                label: Text(
                  _isSubmitting ? 'Wird gesendet...' : 'Feedback senden',
                  style: const TextStyle(fontSize: 16),
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: B24Colors.primaryBlue,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _ratingEmoji(int rating) {
    return switch (rating) {
      1 => '😠',
      2 => '😕',
      3 => '😐',
      4 => '😊',
      5 => '🤩',
      _ => '😐',
    };
  }

  String _ratingLabel(int rating) {
    return switch (rating) {
      1 => 'Sehr schlecht',
      2 => 'Schlecht',
      3 => 'Okay',
      4 => 'Gut',
      5 => 'Ausgezeichnet',
      _ => '',
    };
  }

  Color _ratingColor(int rating) {
    return switch (rating) {
      1 => Colors.red,
      2 => Colors.orange,
      3 => Colors.amber,
      4 => Colors.lightGreen,
      5 => Colors.green,
      _ => Colors.grey,
    };
  }
}
