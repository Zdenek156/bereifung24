/// Parses German vehicle registration document (Zulassungsbescheinigung Teil I)
/// fields from OCR text.
///
/// Standard field codes:
///   A     = Kennzeichen (license plate)
///   B     = Datum der Erstzulassung (first registration → year)
///   2.1   = Hersteller-Kurzbezeichnung (manufacturer)
///   2.2   = Typ/Variante/Version (model)
///   D.2   = Fahrzeugtyp
///   E     = Fahrzeug-Identifizierungsnummer (VIN)
///   P.3   = Kraftstoffart (fuel type)
///   15.1  = Bereifung (tire size)

import 'tire_size_parser.dart';

class VehicleDocResult {
  String? make; // Feld 2.1
  String? model; // Feld 2.2
  int? year; // Feld B (extracted year)
  String? vin; // Feld E
  String? fuelType; // Feld P.3 (mapped to app enum)
  TireSize? tireSize; // Feld 15.1 (front / only tire size)
  TireSize? rearTireSize; // Second tire size if Mischbereifung
  bool hasMixedTires = false; // true when front ≠ rear
  String? vehicleCategory; // Feld J: PKW, KRAFTRAD, ANHÄNGER, LKW
  int fieldsFound = 0;

  @override
  String toString() => 'VehicleDocResult(make=$make, model=$model, '
      'year=$year, vin=$vin, fuel=$fuelType, tire=$tireSize, '
      'rearTire=$rearTireSize, mixed=$hasMixedTires, '
      'category=$vehicleCategory, fields=$fieldsFound)';
}

/// Known German car manufacturers for matching
const _manufacturers = {
  'VOLKSWAGEN': 'Volkswagen',
  'VW': 'Volkswagen',
  'MERCEDES': 'Mercedes-Benz',
  'MERCEDES-BENZ': 'Mercedes-Benz',
  'BMW': 'BMW',
  'AUDI': 'Audi',
  'OPEL': 'Opel',
  'FORD': 'Ford',
  'PORSCHE': 'Porsche',
  'FIAT': 'Fiat',
  'RENAULT': 'Renault',
  'PEUGEOT': 'Peugeot',
  'CITROEN': 'Citroën',
  'CITROËN': 'Citroën',
  'SKODA': 'Škoda',
  'ŠKODA': 'Škoda',
  'SEAT': 'Seat',
  'CUPRA': 'Cupra',
  'TOYOTA': 'Toyota',
  'HONDA': 'Honda',
  'MAZDA': 'Mazda',
  'NISSAN': 'Nissan',
  'HYUNDAI': 'Hyundai',
  'KIA': 'Kia',
  'VOLVO': 'Volvo',
  'DACIA': 'Dacia',
  'SUZUKI': 'Suzuki',
  'MITSUBISHI': 'Mitsubishi',
  'SUBARU': 'Subaru',
  'JAGUAR': 'Jaguar',
  'JEEP': 'Jeep',
  'LAND ROVER': 'Land Rover',
  'LEXUS': 'Lexus',
  'MINI': 'Mini',
  'SMART': 'Smart',
  'TESLA': 'Tesla',
  'MG': 'MG',
  'CHEVROLET': 'Chevrolet',
  'DS': 'DS',
  'ABARTH': 'Abarth',
  'ALFA ROMEO': 'Alfa Romeo',
  // ── Motorcycle manufacturers ──
  'YAMAHA': 'Yamaha',
  'KAWASAKI': 'Kawasaki',
  'DUCATI': 'Ducati',
  'KTM': 'KTM',
  'HUSQVARNA': 'Husqvarna',
  'HARLEY-DAVIDSON': 'Harley-Davidson',
  'HARLEY': 'Harley-Davidson',
  'INDIAN': 'Indian',
  'TRIUMPH': 'Triumph',
  'APRILIA': 'Aprilia',
  'PIAGGIO': 'Piaggio',
  'VESPA': 'Vespa',
  'MV AGUSTA': 'MV Agusta',
  'MOTO GUZZI': 'Moto Guzzi',
  'BENELLI': 'Benelli',
  'ROYAL ENFIELD': 'Royal Enfield',
  'KYMCO': 'Kymco',
  'SYM': 'SYM',
  'GASGAS': 'GasGas',
  'GAS GAS': 'GasGas',
  'CFMOTO': 'CFMoto',
  'CF MOTO': 'CFMoto',
  'ZERO': 'Zero',
  'BUELL': 'Buell',
  // ── Trailer manufacturers ──
  'BÖCKMANN': 'Böckmann',
  'BOECKMANN': 'Böckmann',
  'HUMBAUR': 'Humbaur',
  'SARIS': 'Saris',
  'WESTFALIA': 'Westfalia',
  'BRENDERUP': 'Brenderup',
  'KNOTT': 'Knott',
  'UNSINN': 'Unsinn',
  'STEMA': 'Stema',
  'ANSSEMS': 'Anssems',
  'HAPERT': 'Hapert',
  'IFOR WILLIAMS': 'Ifor Williams',
  'BRIAN JAMES': 'Brian James',
  'NEPTUN': 'Neptun',
  'PONGRATZ': 'Pongratz',
  'WM MEYER': 'WM Meyer',
  'BARTHAU': 'Barthau',
  'HEINEMANN': 'Heinemann',
  'STEDELE': 'Stedele',
  'TPV': 'TPV',
};

/// Fuel type mappings (German → app enum)
const _fuelMappings = {
  'BENZIN': 'PETROL',
  'OTTO': 'PETROL',
  'SUPER': 'PETROL',
  'DIESEL': 'DIESEL',
  'ELEKTRO': 'ELECTRIC',
  'ELEKTRISCH': 'ELECTRIC',
  'STROM': 'ELECTRIC',
  'HYBRID': 'HYBRID',
  'PLUG-IN': 'PLUGIN_HYBRID',
  'PLUGIN': 'PLUGIN_HYBRID',
  'PHEV': 'PLUGIN_HYBRID',
  'AUTOGAS': 'LPG',
  'LPG': 'LPG',
  'FLÜSSIGGAS': 'LPG',
  'ERDGAS': 'CNG',
  'CNG': 'CNG',
  // Trailer: no fuel
  'OHNE': null,
  'ENTFÄLLT': null,
  'KEIN': null,
};

/// German license plate pattern (kept for reference but not used in scanning)
// final _plateRegex = RegExp(...);

/// VIN: exactly 17 alphanumeric chars (no I, O, Q in real VINs)
final _vinRegex = RegExp(r'\b([A-HJ-NPR-Z0-9]{17})\b');

/// Date pattern for field B: DD.MM.YYYY or DD/MM/YYYY
final _dateRegex = RegExp(r'\b(\d{2})[./](\d{2})[./](\d{4})\b');

/// Year-only pattern
final _yearRegex = RegExp(r'\b(19\d{2}|20[0-2]\d)\b');

/// Applies common OCR corrections for document text
String _cleanOcr(String text) {
  return text
      .replaceAll(RegExp(r"[`\u00B4\u2018\u2019\u201A\u201B]"), '')
      .replaceAll(RegExp(r'[^a-zA-Z0-9ÄÖÜäöüß\s\-\./:,()]'), ' ')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();
}

/// Parses all recognizable fields from OCR text blocks.
///
/// Uses two strategies:
/// 1. **Field code detection**: Looks for standardized codes on the
///    Zulassungsbescheinigung (A, B, 2.1, 2.2, E, P.3, 15.1) followed
///    by their values — these are printed on the document.
/// 2. **Pattern matching**: Falls back to regex patterns for known
///    formats (license plates, VIN, tire sizes, etc.)
VehicleDocResult parseVehicleDoc(List<String> textBlocks) {
  final result = VehicleDocResult();
  final allText = textBlocks.join('\n');
  final cleaned = _cleanOcr(allText);
  final upper = cleaned.toUpperCase();

  // ── Strategy 1: Field code detection ──
  // On a Fahrzeugschein each field has a code printed next to it.
  // We look for patterns like "A  M-AB 1234" or "2.1 VOLKSWAGEN"
  _parseFieldCodes(textBlocks, result);

  // ── Strategy 2: Pattern-based fallbacks ──

  // ── License plate skipped — customers enter manually ──

  // ── VIN (Feld E) ──
  if (result.vin == null) {
    final vinCleaned = cleaned
        .replaceAll(RegExp(r'(?<=[A-Z0-9])O(?=[A-Z0-9])'), '0')
        .replaceAll(RegExp(r'(?<=[A-Z0-9])I(?=[A-Z0-9])'), '1');
    final vinMatch = _vinRegex.firstMatch(vinCleaned);
    if (vinMatch != null) {
      result.vin = vinMatch.group(1);
      result.fieldsFound++;
    }
  }

  // ── Manufacturer (Feld 2.1) ──
  if (result.make == null) {
    for (final entry in _manufacturers.entries) {
      if (upper.contains(entry.key)) {
        result.make = entry.value;
        result.fieldsFound++;
        break;
      }
    }
  }

  // ── Year (from Feld B date or standalone) ──
  if (result.year == null) {
    final dateMatch = _dateRegex.firstMatch(cleaned);
    if (dateMatch != null) {
      final y = int.tryParse(dateMatch.group(3)!);
      if (y != null && y >= 1980 && y <= DateTime.now().year + 1) {
        result.year = y;
        result.fieldsFound++;
      }
    }
  }
  if (result.year == null) {
    final yearMatch = _yearRegex.firstMatch(cleaned);
    if (yearMatch != null) {
      result.year = int.parse(yearMatch.group(1)!);
      result.fieldsFound++;
    }
  }

  // ── Fuel type (Feld P.3) ──
  if (result.fuelType == null) {
    for (final entry in _fuelMappings.entries) {
      if (upper.contains(entry.key)) {
        if (entry.value != null) {
          result.fuelType = entry.value;
          result.fieldsFound++;
        }
        break;
      }
    }
  }

  // ── Vehicle category (Feld J) fallback ──
  if (result.vehicleCategory == null) {
    if (upper.contains('KRAFTRAD') || upper.contains('MOTORRAD')) {
      result.vehicleCategory = 'KRAFTRAD';
      result.fieldsFound++;
    } else if (upper.contains('ANHÄNGER') || upper.contains('ANHAENGER')) {
      result.vehicleCategory = 'ANHÄNGER';
      result.fieldsFound++;
    } else if (upper.contains('PERSONENKRAFTWAGEN')) {
      result.vehicleCategory = 'PKW';
      result.fieldsFound++;
    }
  }

  // ── Tire size (Feld 15.1) — detect Mischbereifung ──
  if (result.tireSize == null) {
    final allSizes = findAllTireSizes(textBlocks);
    if (allSizes.isNotEmpty) {
      result.tireSize = allSizes.first;
      result.fieldsFound++;

      // Check for Mischbereifung: second tire size with different dimensions
      if (allSizes.length >= 2) {
        final front = allSizes[0];
        final rear = allSizes[1];
        if (front.width != rear.width ||
            front.aspectRatio != rear.aspectRatio ||
            front.diameter != rear.diameter) {
          result.rearTireSize = rear;
          result.hasMixedTires = true;
        }
      }
    }
  }

  // ── Model (Feld D.3 / D.2 / 2.2) — prioritized strategies ──

  // Strategy 1 (HIGHEST PRIORITY): Look for D.3 field code in raw text
  if (result.model == null) {
    final d3Pattern =
        RegExp(r'D\.?\s?3\s*[:\s]\s*(\S+(?:\s\S+){0,3})', caseSensitive: false);
    for (final line in textBlocks) {
      final d3Match = d3Pattern.firstMatch(line);
      if (d3Match != null) {
        final val = d3Match.group(1)!.trim();
        if (val.length >= 2 && !_isExcludedModelWord(val)) {
          result.model = val;
          result.fieldsFound++;
          break;
        }
      }
    }
  }

  // Strategy 2: Look for D.2 field code (Handelsbezeichnung)
  if (result.model == null) {
    final d2Pattern =
        RegExp(r'D\.?\s?2\s*[:\s]\s*(\S+(?:\s\S+){0,3})', caseSensitive: false);
    for (final line in textBlocks) {
      final d2Match = d2Pattern.firstMatch(line);
      if (d2Match != null) {
        final val = d2Match.group(1)!.trim();
        if (val.length >= 2 && !_isExcludedModelWord(val)) {
          result.model = val;
          result.fieldsFound++;
          break;
        }
      }
    }
  }

  // Strategy 3: Look for 2.2 field code with flexible matching
  if (result.model == null) {
    final model22 =
        RegExp(r'2[.\s]2\s*[:\s]+\s*(\S+(?:\s\S+){0,3})', caseSensitive: false);
    for (final line in textBlocks) {
      final match = model22.firstMatch(line);
      if (match != null) {
        final val = match.group(1)!.trim();
        if (val.length >= 2 && !_isExcludedModelWord(val)) {
          result.model = val;
          result.fieldsFound++;
          break;
        }
      }
    }
  }

  // Strategy 4: Find model text after manufacturer on the same line
  // Skip lines containing manufacturer full name (WERKE, MOT., MOTOREN)
  if (result.model == null && result.make != null) {
    final makeUpper = result.make!.toUpperCase();
    for (final line in textBlocks) {
      final lineUpper = line.toUpperCase();
      final makeIdx = lineUpper.indexOf(makeUpper);
      if (makeIdx >= 0) {
        // Skip if line contains full manufacturer name indicators
        if (lineUpper.contains('WERKE') ||
            lineUpper.contains('MOT.') ||
            lineUpper.contains('MOTOREN') ||
            lineUpper.contains('BAYER') ||
            lineUpper.contains('AKTIENGESELLSCHAFT') ||
            lineUpper.contains('GMBH')) {
          continue;
        }
        final afterMake = line.substring(makeIdx + result.make!.length).trim();
        final modelMatch = RegExp(r'^[,\s]*([A-Za-z0-9][A-Za-z0-9\s/-]{1,25})')
            .firstMatch(afterMake);
        if (modelMatch != null) {
          final m = modelMatch.group(1)!.trim();
          if (!_isExcludedModelWord(m) && m.length >= 2) {
            result.model = m;
            result.fieldsFound++;
          }
        }
        break;
      }
    }
  }

  // Strategy 5: Line immediately after manufacturer line
  if (result.model == null && result.make != null) {
    final makeUpper = result.make!.toUpperCase();
    for (int i = 0; i < textBlocks.length - 1; i++) {
      if (textBlocks[i].toUpperCase().contains(makeUpper)) {
        final nextLine = textBlocks[i + 1].trim();
        if (nextLine.length >= 2 &&
            nextLine.length <= 40 &&
            !RegExp(r'^\d+\.\d').hasMatch(nextLine) &&
            !RegExp(r'^[A-Z]\s').hasMatch(nextLine) &&
            !_isExcludedModelWord(nextLine)) {
          result.model = nextLine;
          result.fieldsFound++;
        }
        break;
      }
    }
  }

  return result;
}

/// Words that should NOT be treated as model names
bool _isExcludedModelWord(String text) {
  final t = text.trim().toUpperCase();
  // Exclude field labels and document structure words
  if (RegExp(
    r'^(TEIL|PART|FELD|NR|FAHRZEUG|ZULASSUNG|BESCHEINIGUNG|NUMMER|DATUM|SEITE|ANLAGE|KLASSE|AUFBAU|HUBRAUM|LEISTUNG|MASSE)',
    caseSensitive: false,
  ).hasMatch(t)) return true;
  // Exclude vehicle body type / usage descriptions (Feld 4/5)
  if (RegExp(
    r'(PERS|BEF|SPL|KOMBI|LIMOUSINE|PKW|LKW|CABRIOLET|COUPE|KASTEN|SATTEL|PRITSCHE|KIPPER|KRAFTRAD|ANHÄNGER|MOTORRAD|ROLLER|QUAD|TRIKE|MOFA)',
    caseSensitive: false,
  ).hasMatch(t)) return true;
  // Exclude manufacturer-related fragments
  if (RegExp(
    r'(WERKE|MOTOREN|BAYER|AKTIEN|GMBH|DAIMLER|CHRYSLER|VOLKSWAGEN|PORSCHE)',
    caseSensitive: false,
  ).hasMatch(t)) return true;
  // Exclude text that looks like field 5 (body description with dots)
  if (t.contains('.') && t.length > 8 && RegExp(r'\d').hasMatch(t)) return true;
  // Exclude VIN-shaped strings (17 alphanumeric chars)
  if (_vinRegex.hasMatch(t)) return true;
  return false;
}

/// Parses fields by their standardized code on the Zulassungsbescheinigung.
///
/// The document has codes like:
///   A  → License plate       (top area)
///   B  → First registration  (top area, date)
///   J  → Fahrzeugklasse      (top area: PKW, KRAFTRAD, ANHÄNGER)
///   2.1 → Manufacturer       (middle-left)
///   2.2 → Type/Model         (below 2.1)
///   E  → VIN                 (middle area)
///   P.3 → Fuel type          (lower-middle)
///   15.1 → Tire size         (bottom area)
void _parseFieldCodes(List<String> textBlocks, VehicleDocResult result) {
  // Field code regexes — code followed by separator then value
  final fieldPatterns = <String, RegExp>{
    'make': RegExp(r'(?:^|\s)2\.?1\s*[:\s]\s*(\S+(?:\s\S+)?)',
        caseSensitive: false),
    'model': RegExp(r'(?:^|\s)2\.?\s?2\s*[:\s]\s*(\S+(?:\s\S+){0,3})',
        caseSensitive: false),
    'model_d3': RegExp(r'(?:^|\s)D\.?\s?3\s*[:\s]\s*(\S+(?:\s\S+){0,3})',
        caseSensitive: false),
    'year': RegExp(r'(?:^|\s)B\s*[:\s]\s*(\d{2}[./]\d{2}[./]\d{4}|\d{4})',
        caseSensitive: false),
    'vin': RegExp(r'(?:^|\s)E\s*[:\s]\s*([A-HJ-NPR-Z0-9]{17})',
        caseSensitive: false),
    'fuel': RegExp(r'(?:^|\s)P\.?3\s*[:\s]\s*(\S+)', caseSensitive: false),
    'category': RegExp(r'(?:^|\s)J\s*[:\s]\s*(\S+(?:\s\S+)?)',
        caseSensitive: false),
    'tire': RegExp(
        r'(?:^|\s)15\.?1\s*[:\s]\s*(\d{2,3}\s?[/\\]\s?\d{2,3}\s?(?:ZR|R|B|D)\s?\d{2}(?:\s?\d{2,3}\s?[A-Z])?)',
        caseSensitive: false),
  };

  for (final line in textBlocks) {
    final trimmed = line.trim();
    if (trimmed.isEmpty) continue;

    // Check each field pattern
    for (final entry in fieldPatterns.entries) {
      final match = entry.value.firstMatch(trimmed);
      if (match == null) continue;
      final value = match.group(1)!.trim();
      if (value.isEmpty) continue;

      switch (entry.key) {
        case 'make':
          if (result.make == null) {
            final mUp = value.toUpperCase();
            for (final m in _manufacturers.entries) {
              if (mUp.contains(m.key)) {
                result.make = m.value;
                result.fieldsFound++;
                break;
              }
            }
          }
        case 'model':
        case 'model_d3':
          if (result.model == null && value.length >= 2) {
            if (!_isExcludedModelWord(value)) {
              result.model = value;
              result.fieldsFound++;
            }
          }
        case 'year':
          if (result.year == null) {
            final dm = _dateRegex.firstMatch(value);
            if (dm != null) {
              final y = int.tryParse(dm.group(3)!);
              if (y != null && y >= 1980 && y <= DateTime.now().year + 1) {
                result.year = y;
                result.fieldsFound++;
              }
            } else {
              final y = int.tryParse(value);
              if (y != null && y >= 1980 && y <= DateTime.now().year + 1) {
                result.year = y;
                result.fieldsFound++;
              }
            }
          }
        case 'vin':
          if (result.vin == null) {
            result.vin =
                value.toUpperCase().replaceAll('O', '0').replaceAll('I', '1');
            result.fieldsFound++;
          }
        case 'fuel':
          if (result.fuelType == null) {
            final fUp = value.toUpperCase();
            for (final f in _fuelMappings.entries) {
              if (fUp.contains(f.key)) {
                if (f.value != null) {
                  result.fuelType = f.value;
                  result.fieldsFound++;
                }
                break;
              }
            }
          }
        case 'category':
          if (result.vehicleCategory == null) {
            final cUp = value.toUpperCase();
            if (cUp.contains('KRAFTRAD') || cUp.contains('MOTORRAD')) {
              result.vehicleCategory = 'KRAFTRAD';
              result.fieldsFound++;
            } else if (cUp.contains('ANHÄNGER') || cUp.contains('ANHAENGER')) {
              result.vehicleCategory = 'ANHÄNGER';
              result.fieldsFound++;
            } else if (cUp.contains('PKW') || cUp.contains('PERSONENKRAFTWAGEN')) {
              result.vehicleCategory = 'PKW';
              result.fieldsFound++;
            }
          }
        case 'tire':
          if (result.tireSize == null) {
            result.tireSize = parseTireSize(value);
            if (result.tireSize != null) {
              result.fieldsFound++;
            }
          }
      }
    }
  }
}
