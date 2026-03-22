/// Parses tire sizes from OCR text using regex with error correction.
///
/// Recognizes DOT-standard formats like:
///   205/55R16 91V, 205/55 R 16 91V, P205/55R16 91V, 205/55ZR16 91V

class TireSize {
  final int width;
  final int aspectRatio;
  final String construction; // R, ZR, B, D
  final int diameter;
  final int? loadIndex;
  final String? speedRating;
  final String raw;
  final double confidence;

  const TireSize({
    required this.width,
    required this.aspectRatio,
    required this.construction,
    required this.diameter,
    this.loadIndex,
    this.speedRating,
    required this.raw,
    required this.confidence,
  });

  @override
  String toString() {
    final li = loadIndex != null ? ' $loadIndex' : '';
    final sr = speedRating ?? '';
    return '$width/$aspectRatio $construction$diameter$li$sr';
  }
}

/// Valid values for validation (matching InteractiveTireSelector data)
const _validWidths = [
  125, 135, 145, 155, 165, 175, 185, 195, 205, 215, 225, 235, 245, 255,
  265, 275, 285, 295, 305, 315, 325, 335, 345, 355, 365, 375, 385, 395,
  405, 415, 425,
  // Motorcycle
  70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220,
];

const _validAspects = [
  20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 100,
];

const _validDiameters = [
  8, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
];

const _validSpeedRatings = [
  'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'H', 'V', 'W', 'Y', 'Z',
];

/// Regex: [P]?[width]/[ratio] [ZR|R|B|D][diameter] [loadIndex]?[speedRating]?
final _tireSizeRegex = RegExp(
  r'[P]?(\d{2,3})\s?[/\\]\s?(\d{2,3})\s?(ZR|R|B|D)\s?(\d{2})(?:\s?(\d{2,3})\s?([A-Z]))?',
  caseSensitive: false,
);

/// Attempts to parse a tire size from OCR text.
/// Returns null if no valid tire size is found.
TireSize? parseTireSize(String text) {
  // Pre-process: fix common OCR errors
  var cleaned = text
      .replaceAll(RegExp(r'[oO](?=\d)'), '0')     // O before digit → 0
      .replaceAll(RegExp(r'(?<=\d)[oO]'), '0')     // O after digit → 0
      .replaceAll(RegExp(r'[lI|](?=\d)'), '1')     // l, I, | before digit → 1
      .replaceAll(RegExp(r'(?<=\d)[lI|]'), '1')    // l, I, | after digit → 1
      .replaceAll(RegExp(r'\s+'), ' ')              // normalize whitespace
      .trim();

  final match = _tireSizeRegex.firstMatch(cleaned);
  if (match == null) return null;

  final rawMatch = match.group(0)!;
  final widthStr = match.group(1)!;
  final ratioStr = match.group(2)!;
  final construction = match.group(3)!.toUpperCase();
  final diameterStr = match.group(4)!;
  final loadIndexStr = match.group(5); // optional
  final speedRatingStr = match.group(6); // optional

  final width = int.parse(widthStr);
  final ratio = int.parse(ratioStr);
  final diameter = int.parse(diameterStr);
  final loadIndex = loadIndexStr != null ? int.parse(loadIndexStr) : null;
  final speedRating = speedRatingStr?.toUpperCase();

  final isValidWidth = _validWidths.contains(width);
  final isValidRatio = _validAspects.contains(ratio);
  final isValidDiameter = _validDiameters.contains(diameter);
  final isValidSpeed = speedRating != null && _validSpeedRatings.contains(speedRating);

  // Must have at least valid width + diameter
  if (!isValidWidth || !isValidDiameter) return null;

  // Calculate confidence
  var confidence = 0.0;
  if (isValidWidth) confidence += 0.3;
  if (isValidRatio) confidence += 0.25;
  if (isValidDiameter) confidence += 0.25;
  if (isValidSpeed) confidence += 0.2;

  return TireSize(
    width: width,
    aspectRatio: ratio,
    construction: construction,
    diameter: diameter,
    loadIndex: loadIndex != null && loadIndex > 0 ? loadIndex : null,
    speedRating: isValidSpeed ? speedRating : null,
    raw: rawMatch,
    confidence: confidence,
  );
}

/// Scans all text blocks for tire sizes and returns the best match.
TireSize? findBestTireSize(List<String> textBlocks) {
  TireSize? best;
  for (final block in textBlocks) {
    // Try each line in the block
    for (final line in block.split('\n')) {
      final size = parseTireSize(line);
      if (size != null && (best == null || size.confidence > best.confidence)) {
        best = size;
      }
    }
  }
  return best;
}

/// Scans all text blocks and returns ALL unique tire sizes found.
/// Used for Mischbereifung (mixed tire) detection on Fahrzeugschein.
List<TireSize> findAllTireSizes(List<String> textBlocks) {
  final sizes = <TireSize>[];
  final seen = <String>{};
  for (final block in textBlocks) {
    for (final line in block.split('\n')) {
      // Find all matches in the line, not just the first
      var cleaned = line
          .replaceAll(RegExp(r'[oO](?=\d)'), '0')
          .replaceAll(RegExp(r'(?<=\d)[oO]'), '0')
          .replaceAll(RegExp(r'[lI|](?=\d)'), '1')
          .replaceAll(RegExp(r'(?<=\d)[lI|]'), '1')
          .replaceAll(RegExp(r'\s+'), ' ')
          .trim();
      for (final match in _tireSizeRegex.allMatches(cleaned)) {
        final rawMatch = match.group(0)!;
        final widthStr = match.group(1)!;
        final ratioStr = match.group(2)!;
        final construction = match.group(3)!.toUpperCase();
        final diameterStr = match.group(4)!;
        final loadIndexStr = match.group(5); // optional
        final speedRatingStr = match.group(6); // optional

        final width = int.parse(widthStr);
        final ratio = int.parse(ratioStr);
        final diameter = int.parse(diameterStr);
        final loadIndex = loadIndexStr != null ? int.parse(loadIndexStr) : null;
        final speedRating = speedRatingStr?.toUpperCase();

        if (!_validWidths.contains(width) || !_validDiameters.contains(diameter)) continue;

        final key = '$width/$ratio$construction$diameter';
        if (seen.contains(key)) continue;
        seen.add(key);

        final isValidRatio = _validAspects.contains(ratio);
        final isValidSpeed = speedRating != null && _validSpeedRatings.contains(speedRating);
        var confidence = 0.3 + (isValidRatio ? 0.25 : 0) + 0.25 + (isValidSpeed ? 0.2 : 0);

        sizes.add(TireSize(
          width: width,
          aspectRatio: ratio,
          construction: construction,
          diameter: diameter,
          loadIndex: loadIndex != null && loadIndex > 0 ? loadIndex : null,
          speedRating: isValidSpeed ? speedRating : null,
          raw: rawMatch,
          confidence: confidence,
        ));
      }
    }
  }
  // Sort by confidence descending
  sizes.sort((a, b) => b.confidence.compareTo(a.confidence));
  return sizes;
}
