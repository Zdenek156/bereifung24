/**
 * Simple CSV Parser (no external dependencies)
 * Handles standard CSV format with quoted fields
 */

export interface CsvParseResult {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

export function parseCSV(csvContent: string, delimiter: string = ','): CsvParseResult {
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [], errors: ['Empty CSV file'] };
  }

  // Parse header row
  const headers = parseLine(lines[0], delimiter);
  const rows: Record<string, string>[] = [];
  const errors: string[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseLine(lines[i], delimiter);

      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
        continue;
      }

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });

      rows.push(row);
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
    }
  }

  return { headers, rows, errors };
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

/**
 * Map CSV row to TireCatalog format (TyreSystem-specific)
 * Adjust field mapping based on actual TyreSystem CSV format
 * 
 * Only imports PKW and Motorrad tires with essential fields + EU labels
 */
export interface TireCatalogData {
  articleId: string;
  ean?: string;
  brand: string;
  model: string;
  width: string;
  height: string;
  diameter: string;
  season: string;
  vehicleType: string;
  loadIndex?: string;
  speedIndex?: string;
  runFlat?: boolean;
  threePMSF?: boolean;
  labelFuelEfficiency?: string;
  labelWetGrip?: string;
  labelNoise?: number;
  labelNoiseClass?: string;
}

export function mapTyreSystemCSV(row: Record<string, string>): TireCatalogData | null {
  try {
    // Map TyreSystem CSV fields (German column names from export.csv)
    const articleId = row['Artikelnummer'] || row['ArticleId'] || row['article_id'];
    const ean = row['ean'] || row['EAN'];
    const brand = row['Hersteller'] || row['Brand'] || row['brand'];
    const model = row['Profil'] || row['Model'] || row['model'];
    const width = row['Reifenbreite'] || row['Width'] || row['width'];
    const height = row['Reifenquerschnitt'] || row['Height'] || row['height'];
    const diameter = row['Reifendurchmesser'] || row['Diameter'] || row['diameter'];
    const season = row['Saison'] || row['Season'] || row['season'];
    const vehicleType = row['Fahrzeugtyp'] || row['VehicleType'] || 'PKW';

    // Validate required fields
    if (!articleId || !brand || !width || !height || !diameter || !season) {
      return null;
    }

    // Filter: Only PKW and Motorrad tires
    const normalizedVehicleType = vehicleType.toUpperCase().trim();
    if (!normalizedVehicleType.includes('PKW') && 
        !normalizedVehicleType.includes('MOTO') && 
        !normalizedVehicleType.includes('CAR') && 
        !normalizedVehicleType.includes('MOTOR')) {
      return null; // Skip LKW, Transporter, etc.
    }

    // Normalize vehicle type to 'PKW' or 'MOTO'
    const finalVehicleType = normalizedVehicleType.includes('MOTO') || normalizedVehicleType.includes('MOTOR') 
      ? 'MOTO' 
      : 'PKW';

    // Detect RunFlat from 'Bauart' column (R = Radial, RF = RunFlat)
    const bauart = row['Bauart'] || row['ConstructionType'] || '';
    const runFlat = bauart.toUpperCase().includes('RF') || bauart.toUpperCase() === 'RUNFLAT';

    // 3PMSF (3-Peak Mountain Snowflake)
    const threePMSF = parseBoolean(row['3PMSF'] || row['three_pmsf'] || row['ThreePMSF']);

    // EU Tire Labels
    const labelFuelEfficiency = row['LabelKraftstoffeffizienz'] || row['FuelEfficiency'] || undefined;
    const labelWetGrip = row['LabelNasshaftung'] || row['WetGrip'] || undefined;
    const noiseRaw = row['LabelRollgeraeusch'] || row['LabelNoise'] || row['Noise'] || '0';
    const labelNoise = parseInt(noiseRaw) || undefined;
    const labelNoiseClass = row['LabelRollgeraeuschklasse'] || row['NoiseClass'] || undefined;

    return {
      articleId: articleId.trim(),
      ean: ean?.trim() || undefined,
      brand: brand.trim(),
      model: model?.trim() || 'Standard',
      width: width.trim(),
      height: height.trim(),
      diameter: diameter.trim(),
      season: normalizeSeason(season),
      vehicleType: finalVehicleType,
      loadIndex: row['Loadindex'] || row['LoadIndex'] || undefined,
      speedIndex: row['Speedindex'] || row['SpeedIndex'] || undefined,
      runFlat,
      threePMSF,
      labelFuelEfficiency,
      labelWetGrip,
      labelNoise,
      labelNoiseClass,
    };
  } catch (error) {
    console.error('Error mapping CSV row:', error, row);
    return null;
  }
}

/**
 * Normalize season to 's', 'w', or 'g'
 */
function normalizeSeason(season: string): string {
  const normalized = season.toLowerCase().trim();

  if (normalized.includes('sommer') || normalized === 's' || normalized === 'summer') {
    return 's';
  }
  if (normalized.includes('winter') || normalized === 'w') {
    return 'w';
  }
  if (normalized.includes('ganz') || normalized === 'g' || normalized.includes('all') || normalized.includes('year')) {
    return 'g';
  }

  // Default: treat as summer
  return 's';
}

/**
 * Parse boolean from string
 */
function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase().trim();
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'ja';
}
