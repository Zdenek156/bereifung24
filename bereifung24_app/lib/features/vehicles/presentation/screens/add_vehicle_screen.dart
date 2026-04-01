import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/models/vehicle.dart';
import '../../utils/vehicle_doc_parser.dart';
import '../widgets/interactive_tire_selector.dart';
import 'vehicle_doc_scanner_screen.dart';
import 'vehicles_screen.dart';

class AddVehicleScreen extends ConsumerStatefulWidget {
  final Vehicle? vehicle; // null = add mode, non-null = edit mode
  const AddVehicleScreen({super.key, this.vehicle});

  @override
  ConsumerState<AddVehicleScreen> createState() => _AddVehicleScreenState();
}

class _AddVehicleScreenState extends ConsumerState<AddVehicleScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isSubmitting = false;

  bool get _isEditing => widget.vehicle != null;

  // Basic info
  String _vehicleType = 'CAR';
  final _makeCtrl = TextEditingController();
  final _modelCtrl = TextEditingController();
  final _yearCtrl = TextEditingController();
  final _plateCtrl = TextEditingController();
  final _vinCtrl = TextEditingController();

  // TÜV
  int? _inspectionMonth;
  int? _inspectionYear;
  bool _inspectionReminder = false;
  int _inspectionReminderDays = 30;

  // Fuel
  String? _fuelType;

  // Tire sections
  final _summer = _TireSelection();
  final _winter = _TireSelection();
  final _allSeason = _TireSelection();
  int _tireTabIndex = 0;

  // Doc scanner result
  VehicleDocResult? _scanResult;
  bool _showTireWarning = false;

  static const _vehicleTypes = [
    ('CAR', 'Auto', Icons.directions_car),
    ('MOTORCYCLE', 'Motorrad', Icons.two_wheeler),
    ('TRAILER', 'Anhänger', Icons.rv_hookup),
  ];

  static const _fuelTypes = [
    ('PETROL', 'Benzin'),
    ('DIESEL', 'Diesel'),
    ('ELECTRIC', 'Elektrisch'),
    ('HYBRID', 'Hybrid'),
    ('PLUGIN_HYBRID', 'Plug-in Hybrid'),
    ('LPG', 'Autogas (LPG)'),
    ('CNG', 'Erdgas (CNG)'),
  ];

  static const _carBrands = [
    'Abarth',
    'Alfa Romeo',
    'Audi',
    'BMW',
    'Chevrolet',
    'Citroën',
    'Cupra',
    'Dacia',
    'DS',
    'Fiat',
    'Ford',
    'Honda',
    'Hyundai',
    'Jaguar',
    'Jeep',
    'Kia',
    'Land Rover',
    'Lexus',
    'Mazda',
    'Mercedes-Benz',
    'MG',
    'Mini',
    'Mitsubishi',
    'Nissan',
    'Opel',
    'Peugeot',
    'Porsche',
    'Renault',
    'Seat',
    'Škoda',
    'Smart',
    'Subaru',
    'Suzuki',
    'Tesla',
    'Toyota',
    'Volkswagen',
    'Volvo',
    'Sonstige',
  ];

  static const _brandAliases = <String, String>{
    'VW': 'Volkswagen',
    'VOLKSWAGEN': 'Volkswagen',
    'MERCEDES': 'Mercedes-Benz',
    'MERCEDES BENZ': 'Mercedes-Benz',
    'MERC': 'Mercedes-Benz',
    'MERCEDESBENZ': 'Mercedes-Benz',
    'SKODA': 'Škoda',
    'CITROEN': 'Citroën',
    'ALFA': 'Alfa Romeo',
    'ALFAROMEO': 'Alfa Romeo',
    'LANDROVER': 'Land Rover',
    'LAND-ROVER': 'Land Rover',
  };

  /// Match OCR text to a known brand from _carBrands
  String _matchBrand(String ocrMake) {
    // 1. Exact match
    for (final brand in _carBrands) {
      if (brand.toLowerCase() == ocrMake.toLowerCase()) return brand;
    }
    // 2. Alias match
    final alias = _brandAliases[ocrMake.toUpperCase().trim()];
    if (alias != null) return alias;
    // 3. Partial match (brand contains OCR text or vice versa)
    for (final brand in _carBrands) {
      if (brand.toLowerCase().contains(ocrMake.toLowerCase()) ||
          ocrMake.toLowerCase().contains(brand.toLowerCase())) {
        return brand;
      }
    }
    // 4. No match — add to dropdown dynamically
    return ocrMake;
  }

  @override
  void initState() {
    super.initState();
    final v = widget.vehicle;
    if (v != null) {
      _vehicleType = v.vehicleType;
      _makeCtrl.text = v.make;
      _modelCtrl.text = v.model;
      if (v.year != null) _yearCtrl.text = '${v.year}';
      if (v.licensePlate != null) _plateCtrl.text = v.licensePlate!;
      if (v.vin != null) _vinCtrl.text = v.vin!;
      _fuelType = v.fuelType;
      if (v.nextInspectionDate != null) {
        final parts = v.nextInspectionDate!.split('-');
        if (parts.length >= 2) {
          _inspectionYear = int.tryParse(parts[0]);
          _inspectionMonth = int.tryParse(parts[1]);
        }
      }
      _inspectionReminder = v.inspectionReminder;
      if (v.inspectionReminderDays != null) {
        _inspectionReminderDays = v.inspectionReminderDays!;
      }

      // Pre-populate tire selections
      _initTireSelection(_summer, v.summerTires);
      _initTireSelection(_winter, v.winterTires);
      _initTireSelection(_allSeason, v.allSeasonTires);
    }
  }

  Future<void> _openDocScanner() async {
    final result = await Navigator.push<VehicleDocResult>(
      context,
      MaterialPageRoute(builder: (_) => const VehicleDocScannerScreen()),
    );
    if (result == null || !mounted) return;

    setState(() {
      _scanResult = result;

      // Apply scanned data to form fields
      if (result.make != null) _makeCtrl.text = _matchBrand(result.make!);
      if (result.model != null) _modelCtrl.text = result.model!;
      if (result.year != null) _yearCtrl.text = '${result.year}';
      if (result.vin != null) _vinCtrl.text = result.vin!;
      if (result.fuelType != null) _fuelType = result.fuelType;

      // Show tire warning with accept button (don't apply yet)
      if (result.tireSize != null) {
        _showTireWarning = true;
      }
    });
  }

  /// Apply scanned tire sizes to all seasons after user confirms
  void _applyScannedTireSizes() {
    final result = _scanResult;
    if (result?.tireSize == null) return;

    setState(() {
      final frontSpec = {
        'width': result!.tireSize!.width,
        'aspectRatio': result.tireSize!.aspectRatio,
        'diameter': result.tireSize!.diameter,
        if (result.tireSize!.loadIndex != null)
          'loadIndex': result.tireSize!.loadIndex,
        if (result.tireSize!.speedRating != null)
          'speedRating': result.tireSize!.speedRating,
      };
      _summer.frontSpec = Map<String, dynamic>.from(frontSpec);
      _winter.frontSpec = Map<String, dynamic>.from(frontSpec);
      _allSeason.frontSpec = Map<String, dynamic>.from(frontSpec);

      // Mischbereifung: apply rear tire size if different
      if (result.hasMixedTires && result.rearTireSize != null) {
        final rearSpec = {
          'width': result.rearTireSize!.width,
          'aspectRatio': result.rearTireSize!.aspectRatio,
          'diameter': result.rearTireSize!.diameter,
          if (result.rearTireSize!.loadIndex != null)
            'loadIndex': result.rearTireSize!.loadIndex,
          if (result.rearTireSize!.speedRating != null)
            'speedRating': result.rearTireSize!.speedRating,
        };
        _summer.rearSpec = Map<String, dynamic>.from(rearSpec);
        _winter.rearSpec = Map<String, dynamic>.from(rearSpec);
        _allSeason.rearSpec = Map<String, dynamic>.from(rearSpec);
        _summer.hasDifferentSizes = true;
        _winter.hasDifferentSizes = true;
        _allSeason.hasDifferentSizes = true;
      }

      _showTireWarning = false;
    });
  }

  void _initTireSelection(_TireSelection sel, TireSpec? spec) {
    if (spec == null || spec.isEmpty) return;
    sel.frontSpec = {
      'width': spec.width,
      'aspectRatio': spec.aspectRatio,
      'diameter': spec.diameter,
      if (spec.loadIndex != null) 'loadIndex': spec.loadIndex,
      if (spec.speedRating != null) 'speedRating': spec.speedRating,
    };
    sel.hasDifferentSizes = spec.hasDifferentSizes;
    if (spec.hasDifferentSizes && spec.rearWidth != null) {
      sel.rearSpec = {
        'width': spec.rearWidth,
        'aspectRatio': spec.rearAspectRatio,
        'diameter': spec.rearDiameter,
        if (spec.rearLoadIndex != null) 'loadIndex': spec.rearLoadIndex,
        if (spec.rearSpeedRating != null) 'speedRating': spec.rearSpeedRating,
      };
    }
  }

  @override
  void dispose() {
    _makeCtrl.dispose();
    _modelCtrl.dispose();
    _yearCtrl.dispose();
    _plateCtrl.dispose();
    _vinCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);

    try {
      final data = <String, dynamic>{
        'vehicleType': _vehicleType,
        'make': _makeCtrl.text.trim(),
        'model': _modelCtrl.text.trim(),
        'year': int.parse(_yearCtrl.text.trim()),
      };

      if (_plateCtrl.text.trim().isNotEmpty) {
        data['licensePlate'] = _plateCtrl.text.trim().toUpperCase();
      }
      if (_vinCtrl.text.trim().isNotEmpty) {
        data['vin'] = _vinCtrl.text.trim().toUpperCase();
      }
      if (_inspectionMonth != null && _inspectionYear != null) {
        data['nextInspectionDate'] =
            '${_inspectionYear!.toString().padLeft(4, '0')}-${_inspectionMonth!.toString().padLeft(2, '0')}';
      }
      data['inspectionReminder'] = _inspectionReminder;
      if (_inspectionReminder) {
        data['inspectionReminderDays'] = _inspectionReminderDays;
      }
      if (_fuelType != null) data['fuelType'] = _fuelType;

      final summer = _summer.toSpec();
      if (summer != null) data['summerTires'] = summer;
      final winter = _winter.toSpec();
      if (winter != null) data['winterTires'] = winter;
      final allSeason = _allSeason.toSpec();
      if (allSeason != null) data['allSeasonTires'] = allSeason;

      await (_isEditing
          ? ApiClient().updateVehicle(widget.vehicle!.id!, data)
          : ApiClient().createVehicle(data));

      ref.invalidate(vehiclesProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(_isEditing
                  ? 'Fahrzeug aktualisiert'
                  : 'Fahrzeug hinzugefügt'),
              backgroundColor: Colors.green),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('Fehler beim Speichern: $e'),
              backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
          title:
              Text(_isEditing ? 'Fahrzeug bearbeiten' : 'Fahrzeug hinzufügen')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Vehicle Type ──
              _SectionLabel('Fahrzeugtyp'),
              const SizedBox(height: 8),
              Row(
                children: _vehicleTypes.map((t) {
                  final selected = _vehicleType == t.$1;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: GestureDetector(
                        onTap: () => setState(() {
                          if (_vehicleType != t.$1) {
                            _vehicleType = t.$1;
                            // Reset tire selections to prevent wrong sizes across vehicle types
                            _summer.frontSpec = null;
                            _summer.rearSpec = null;
                            _summer.hasDifferentSizes = false;
                            _winter.frontSpec = null;
                            _winter.rearSpec = null;
                            _winter.hasDifferentSizes = false;
                            _allSeason.frontSpec = null;
                            _allSeason.rearSpec = null;
                            _allSeason.hasDifferentSizes = false;
                          }
                        }),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          decoration: BoxDecoration(
                            color: selected
                                ? B24Colors.primaryBlue.withValues(alpha: 0.1)
                                : Colors.grey.shade50,
                            border: Border.all(
                              color: selected
                                  ? B24Colors.primaryBlue
                                  : Colors.grey.shade300,
                              width: selected ? 2 : 1,
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            children: [
                              Icon(t.$3,
                                  color: selected
                                      ? B24Colors.primaryBlue
                                      : Colors.grey[600]),
                              const SizedBox(height: 4),
                              Text(t.$2,
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: selected
                                        ? FontWeight.w600
                                        : FontWeight.normal,
                                    color: selected
                                        ? B24Colors.primaryBlue
                                        : Colors.grey[700],
                                  )),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 16),

              // ── Fahrzeugschein Scanner (add mode only) ──
              if (!_isEditing) ...[
                _buildDocScanButton(),
                const SizedBox(height: 8),
              ],

              // ── Scan result banner ──
              if (_scanResult != null) ...[
                _buildScanResultBanner(),
                const SizedBox(height: 8),
              ],

              // ── Tire warning ──
              if (_showTireWarning) ...[
                _buildTireWarning(),
                const SizedBox(height: 8),
              ],

              const SizedBox(height: 8),

              // ── Make ──
              if (_vehicleType == 'CAR') ...[
                _SectionLabel('Hersteller *'),
                const SizedBox(height: 8),
                Builder(builder: (context) {
                  // Include scanned brand in dropdown if not already in list
                  final brands = List<String>.from(_carBrands);
                  if (_makeCtrl.text.isNotEmpty &&
                      !brands.contains(_makeCtrl.text)) {
                    brands.insert(0, _makeCtrl.text);
                  }
                  return DropdownButtonFormField<String>(
                    value:
                        brands.contains(_makeCtrl.text) ? _makeCtrl.text : null,
                    isExpanded: true,
                    decoration:
                        const InputDecoration(hintText: 'Hersteller wählen'),
                    items: brands
                        .map((b) => DropdownMenuItem(value: b, child: Text(b)))
                        .toList(),
                    onChanged: (v) => setState(() => _makeCtrl.text = v ?? ''),
                    validator: (v) =>
                        (v == null || v.isEmpty) ? 'Pflichtfeld' : null,
                  );
                }),
              ] else ...[
                TextFormField(
                  controller: _makeCtrl,
                  textCapitalization: TextCapitalization.words,
                  decoration: const InputDecoration(
                    labelText: 'Hersteller *',
                    hintText: 'z.B. Yamaha, Kawasaki',
                  ),
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? 'Pflichtfeld' : null,
                ),
              ],
              const SizedBox(height: 16),

              // ── Model ──
              TextFormField(
                controller: _modelCtrl,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Modell *',
                  hintText: 'z.B. Golf, 3er, MT-07',
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? 'Pflichtfeld' : null,
              ),
              const SizedBox(height: 16),

              // ── Year ──
              TextFormField(
                controller: _yearCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Baujahr *',
                  hintText: 'z.B. 2022',
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Pflichtfeld';
                  final y = int.tryParse(v);
                  if (y == null || y < 1980 || y > DateTime.now().year + 1) {
                    return 'Ungültiges Jahr';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // ── License plate ──
              TextFormField(
                controller: _plateCtrl,
                textCapitalization: TextCapitalization.characters,
                decoration: const InputDecoration(
                  labelText: 'Kennzeichen *',
                  hintText: 'z.B. M-AB 1234',
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Pflichtfeld';
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // ── VIN ──
              TextFormField(
                controller: _vinCtrl,
                textCapitalization: TextCapitalization.characters,
                decoration: const InputDecoration(
                  labelText: 'Fahrgestellnummer (VIN)',
                  hintText: '17 Zeichen',
                ),
              ),
              const SizedBox(height: 24),

              // ── TÜV-Termin ──
              _SectionLabel('TÜV-Termin'),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<int>(
                      value: _inspectionMonth,
                      isExpanded: true,
                      decoration: const InputDecoration(hintText: 'Monat'),
                      items: List.generate(
                          12,
                          (i) => DropdownMenuItem(
                              value: i + 1, child: Text(_monthName(i + 1)))),
                      onChanged: (v) => setState(() => _inspectionMonth = v),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<int>(
                      value: _inspectionYear,
                      isExpanded: true,
                      decoration: const InputDecoration(hintText: 'Jahr'),
                      items: List.generate(
                          4,
                          (i) => DropdownMenuItem(
                              value: DateTime.now().year + i,
                              child: Text('${DateTime.now().year + i}'))),
                      onChanged: (v) => setState(() => _inspectionYear = v),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('An TÜV-Termin erinnern'),
                subtitle: Text(
                  _inspectionReminder
                      ? '$_inspectionReminderDays Tage vorher'
                      : 'Keine Erinnerung',
                  style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                ),
                value: _inspectionReminder,
                activeColor: B24Colors.primaryBlue,
                onChanged: (v) => setState(() => _inspectionReminder = v),
              ),
              if (_inspectionReminder) ...[
                DropdownButtonFormField<int>(
                  value: _inspectionReminderDays,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Erinnerung'),
                  items: const [
                    DropdownMenuItem(value: 7, child: Text('7 Tage vorher')),
                    DropdownMenuItem(value: 30, child: Text('30 Tage vorher')),
                  ],
                  onChanged: (v) =>
                      setState(() => _inspectionReminderDays = v ?? 30),
                ),
              ],

              if (_vehicleType != 'TRAILER') ...[
                const SizedBox(height: 24),

                // ── Fuel Type ──
                _SectionLabel('Kraftstoffart'),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _fuelType,
                  isExpanded: true,
                  decoration:
                      const InputDecoration(hintText: 'Kraftstoff wählen'),
                  items: _fuelTypes
                      .map((f) =>
                          DropdownMenuItem(value: f.$1, child: Text(f.$2)))
                      .toList(),
                  onChanged: (v) => setState(() => _fuelType = v),
                ),
              ],

              const SizedBox(height: 28),

              // ── Tire Specs ──
              _SectionLabel('Reifengrößen'),
              const SizedBox(height: 4),
              Text('Gib die Reifengrößen deines Fahrzeugs ein.',
                  style: TextStyle(color: Colors.grey[600], fontSize: 13)),
              const SizedBox(height: 12),

              // Season tabs
              DefaultTabController(
                length: 3,
                initialIndex: _tireTabIndex,
                child: Column(
                  children: [
                    TabBar(
                      onTap: (i) => setState(() => _tireTabIndex = i),
                      tabs: const [
                        Tab(text: '☀️ Sommer'),
                        Tab(text: '❄️ Winter'),
                        Tab(text: '🌦️ Ganzjahr'),
                      ],
                    ),
                    const SizedBox(height: 12),
                    IndexedStack(
                      index: _tireTabIndex,
                      children: [
                        _TireTabContent(
                          selection: _summer,
                          vehicleType: _vehicleType,
                          onChanged: () => setState(() {}),
                        ),
                        _TireTabContent(
                          selection: _winter,
                          vehicleType: _vehicleType,
                          onChanged: () => setState(() {}),
                        ),
                        _TireTabContent(
                          selection: _allSeason,
                          vehicleType: _vehicleType,
                          onChanged: () => setState(() {}),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              FilledButton(
                onPressed: _isSubmitting ? null : _save,
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Speichern', style: TextStyle(fontSize: 16)),
              ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDocScanButton() {
    return GestureDetector(
      onTap: _openDocScanner,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF0284C7), Color(0xFF0EA5E9)],
          ),
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0284C7).withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.document_scanner,
                  color: Colors.white, size: 24),
            ),
            const SizedBox(width: 14),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Fahrzeugschein scannen',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Alle Fahrzeugdaten automatisch ausfüllen',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios,
                color: Colors.white70, size: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildScanResultBanner() {
    final r = _scanResult!;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF10B981).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFF10B981).withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${r.make ?? "Fahrzeug"} ${r.model ?? ""}'.trim(),
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  '${r.fieldsFound} Felder erkannt und übernommen',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => setState(() => _scanResult = null),
            icon: const Icon(Icons.close, size: 18),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }

  Widget _buildTireWarning() {
    // Build tire size string from scan result
    String tireSizeStr = '';
    if (_scanResult?.tireSize != null) {
      final ts = _scanResult!.tireSize!;
      tireSizeStr = '${ts.width}/${ts.aspectRatio} R${ts.diameter}';
      if (ts.loadIndex != null || ts.speedRating != null) {
        tireSizeStr += ' ${ts.loadIndex ?? ''}${ts.speedRating ?? ''}';
      }
    }
    String? rearSizeStr;
    if (_scanResult?.hasMixedTires == true &&
        _scanResult?.rearTireSize != null) {
      final rs = _scanResult!.rearTireSize!;
      rearSizeStr = '${rs.width}/${rs.aspectRatio} R${rs.diameter}';
      if (rs.loadIndex != null || rs.speedRating != null) {
        rearSizeStr += ' ${rs.loadIndex ?? ''}${rs.speedRating ?? ''}';
      }
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF0284C7).withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFF0284C7).withValues(alpha: 0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.tire_repair, color: Color(0xFF0284C7), size: 22),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Reifengröße aus Fahrzeugschein erkannt',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF0284C7),
                  ),
                ),
              ),
              GestureDetector(
                onTap: () => setState(() => _showTireWarning = false),
                child: const Icon(Icons.close, size: 18, color: Colors.grey),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (rearSizeStr != null) ...[
            Text('VA: $tireSizeStr',
                style:
                    const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            const SizedBox(height: 2),
            Text('HA: $rearSizeStr',
                style:
                    const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          ] else ...[
            Text(tireSizeStr,
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          ],
          const SizedBox(height: 4),
          Text(
            'Diese Größe ist die zugelassene Bereifung laut Fahrzeugschein. '
            'Drücke "Übernehmen", um sie einzutragen.',
            style: TextStyle(fontSize: 11, color: Colors.grey[700]),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _applyScannedTireSizes,
              icon: const Icon(Icons.check, size: 18),
              label: const Text('Übernehmen',
                  style: TextStyle(fontWeight: FontWeight.w700)),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF0284C7),
                padding: const EdgeInsets.symmetric(vertical: 10),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _monthName(int m) => const [
        'Januar',
        'Februar',
        'März',
        'April',
        'Mai',
        'Juni',
        'Juli',
        'August',
        'September',
        'Oktober',
        'November',
        'Dezember',
      ][m - 1];
}

// ── Section label ──

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) => Text(text,
      style: Theme.of(context)
          .textTheme
          .titleSmall
          ?.copyWith(fontWeight: FontWeight.w600));
}

// ── Tire selection helper ──

class _TireSelection {
  Map<String, dynamic>? frontSpec;
  Map<String, dynamic>? rearSpec;
  bool hasDifferentSizes = false;

  Map<String, dynamic>? toSpec() {
    if (frontSpec == null ||
        frontSpec!['width'] == null ||
        frontSpec!['aspectRatio'] == null ||
        frontSpec!['diameter'] == null) return null;

    final spec = <String, dynamic>{
      'width': frontSpec!['width'],
      'aspectRatio': frontSpec!['aspectRatio'],
      'diameter': frontSpec!['diameter'],
      'hasDifferentSizes': hasDifferentSizes,
    };
    if (frontSpec!['loadIndex'] != null)
      spec['loadIndex'] = frontSpec!['loadIndex'];
    if (frontSpec!['speedRating'] != null)
      spec['speedRating'] = frontSpec!['speedRating'];

    if (hasDifferentSizes && rearSpec != null) {
      if (rearSpec!['width'] != null) spec['rearWidth'] = rearSpec!['width'];
      if (rearSpec!['aspectRatio'] != null)
        spec['rearAspectRatio'] = rearSpec!['aspectRatio'];
      if (rearSpec!['diameter'] != null)
        spec['rearDiameter'] = rearSpec!['diameter'];
    }
    return spec;
  }
}

// ── Tire tab content ──

class _TireTabContent extends StatelessWidget {
  final _TireSelection selection;
  final String vehicleType;
  final VoidCallback onChanged;

  const _TireTabContent({
    required this.selection,
    required this.vehicleType,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        InteractiveTireSelector(
          vehicleType: vehicleType,
          initialSpec: selection.frontSpec,
          onChanged: (spec) {
            selection.frontSpec = spec;
            onChanged();
          },
        ),
        const SizedBox(height: 8),
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(
            vehicleType == 'MOTORCYCLE'
                ? 'Unterschiedliche Vorder-/Hinterreifen'
                : 'Mischbereifung (unterschiedliche Größen)',
            style: const TextStyle(fontSize: 13),
          ),
          value: selection.hasDifferentSizes,
          onChanged: (v) {
            selection.hasDifferentSizes = v;
            onChanged();
          },
        ),
        if (selection.hasDifferentSizes) ...[
          const Divider(),
          Text('Hinterachse',
              style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[700],
                  fontSize: 13)),
          const SizedBox(height: 8),
          InteractiveTireSelector(
            vehicleType: vehicleType,
            initialSpec: selection.rearSpec,
            onChanged: (spec) {
              selection.rearSpec = spec;
              onChanged();
            },
          ),
        ],
      ],
    );
  }
}
