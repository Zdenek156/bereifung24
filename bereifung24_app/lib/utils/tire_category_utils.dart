import 'package:bereifung24_app/data/models/tire_recommendation.dart';

/// Tire category utility functions matching the web's categorization logic
/// from app/HomePage.tsx filterAndSortTires() + getTireQualityCategory()

/// Premium car tire brands
const premiumBrandsPKW = [
  'Michelin',
  'Continental',
  'Goodyear',
  'Bridgestone',
  'Pirelli',
  'Dunlop'
];

/// Premium motorcycle tire brands
const premiumBrandsMotorrad = [
  'Michelin',
  'Continental',
  'Pirelli',
  'Bridgestone',
  'Dunlop',
  'Metzeler',
  'Heidenau'
];

/// Check if a brand is premium
bool isPremiumBrand(String brand, {bool isMotorcycle = false}) {
  final brands = isMotorcycle ? premiumBrandsMotorrad : premiumBrandsPKW;
  return brands.any((b) => brand.toLowerCase().contains(b.toLowerCase()));
}

/// Check if a tire has "Beste Eigenschaften" based on EU label scoring.
/// Requires: all 3 labels present, at least 2 green (A-B), zero red (E+).
bool hasBesteEigenschaften(TireRecommendation tire) {
  final fuelEff = tire.labelFuelEfficiency;
  final wetGrip = tire.labelWetGrip;
  final noise = tire.labelNoise;

  if (fuelEff == null || wetGrip == null || noise == null) return false;

  int greenCount = 0;
  int redCount = 0;

  // Fuel efficiency: A-B = green, C-D = yellow, E+ = red
  if (['A', 'B'].contains(fuelEff.toUpperCase())) {
    greenCount++;
  } else if (!['C', 'D'].contains(fuelEff.toUpperCase())) {
    redCount++;
  }

  // Wet grip: A-B = green, C-D = yellow, E+ = red
  if (['A', 'B'].contains(wetGrip.toUpperCase())) {
    greenCount++;
  } else if (!['C', 'D'].contains(wetGrip.toUpperCase())) {
    redCount++;
  }

  // Noise: ≤68 = green, 69-71 = yellow, ≥72 = red
  if (noise <= 68) {
    greenCount++;
  } else if (noise > 71) {
    redCount++;
  }

  return greenCount >= 2 && redCount == 0;
}

/// Calculate the price threshold for "günstig" (bottom 33%).
double getCheapThreshold(List<TireRecommendation> tires) {
  final prices = tires.map((t) => t.totalPrice).where((p) => p > 0).toList()
    ..sort();
  if (prices.isEmpty) return 0;
  return prices[(prices.length * 0.33).floor()];
}

/// Filter tires by category using the web algorithm.
/// Category values: 'Günstigster', 'Beliebt' (Beste Eigenschaften), 'Testsieger' (Premium)
List<TireRecommendation> filterByCategory(
  List<TireRecommendation> allTires,
  String? category, {
  bool isMotorcycle = false,
}) {
  if (category == null) return allTires;

  switch (category) {
    case 'Günstigster':
      final threshold = getCheapThreshold(allTires);
      if (threshold <= 0) return allTires;
      return allTires
          .where((t) => t.totalPrice > 0 && t.totalPrice <= threshold)
          .toList();
    case 'Beliebt': // Beste Eigenschaften
      return allTires.where((t) => hasBesteEigenschaften(t)).toList();
    case 'Testsieger': // Premium
      return allTires
          .where((t) => isPremiumBrand(t.brand, isMotorcycle: isMotorcycle))
          .toList();
    default:
      return allTires;
  }
}

/// Map backend label to user-facing display text for tire card badges.
String getDisplayLabel(String backendLabel) {
  switch (backendLabel) {
    case 'Günstigster':
      return 'Günstigster';
    case 'Testsieger':
      return 'Premium';
    case 'Beliebt':
      return 'Beste Eigensch.';
    default:
      return backendLabel;
  }
}
