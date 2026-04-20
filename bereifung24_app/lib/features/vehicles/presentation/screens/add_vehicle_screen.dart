import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/models/vehicle.dart';
import '../../../../l10n/app_localizations.dart';
import '../../utils/vehicle_doc_parser.dart';
import '../../utils/tire_size_parser.dart';
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
  bool _scanTireInvalid = false;

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

      // Auto-set vehicle type from document category (Feld J)
      if (result.vehicleCategory != null) {
        switch (result.vehicleCategory) {
          case 'KRAFTRAD':
            _vehicleType = 'MOTORCYCLE';
          case 'ANHÄNGER':
            _vehicleType = 'TRAILER';
          case 'PKW':
            _vehicleType = 'CAR';
        }
      }

      // Apply scanned data to form fields
      if (result.make != null) _makeCtrl.text = _matchBrand(result.make!);
      if (result.model != null) _modelCtrl.text = result.model!;
      if (result.year != null) _yearCtrl.text = '${result.year}';
      if (result.vin != null) _vinCtrl.text = result.vin!;
      if (result.fuelType != null) _fuelType = result.fuelType;

      // Show tire warning with accept button (don't apply yet)
      if (result.tireSize != null) {
        if (_isValidScannedTire(result.tireSize!) &&
            (result.rearTireSize == null ||
                _isValidScannedTire(result.rearTireSize!))) {
          _showTireWarning = true;
          _scanTireInvalid = false;
        } else {
          _showTireWarning = false;
          _scanTireInvalid = true;
        }
      }
    });
  }

  /// Check if a scanned tire size has valid dimensions for the current vehicle type
  bool _isValidScannedTire(TireSize ts) {
    final isMoto = _vehicleType == 'MOTORCYCLE';
    final widths = isMoto
        ? const [
            70,
            80,
            90,
            100,
            110,
            120,
            130,
            140,
            150,
            160,
            170,
            180,
            190,
            200,
            210,
            220
          ]
        : const [
            125,
            135,
            145,
            155,
            165,
            175,
            185,
            195,
            205,
            215,
            225,
            235,
            245,
            255,
            265,
            275,
            285,
            295,
            305,
            315,
            325,
            335,
            345,
            355,
            365,
            375,
            385,
            395,
            405,
            415,
            425
          ];
    final aspects = isMoto
        ? const [45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 100]
        : const [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90];
    final diameters = isMoto
        ? const [8, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23]
        : const [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

    return widths.contains(ts.width) &&
        aspects.contains(ts.aspectRatio) &&
        diameters.contains(ts.diameter);
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

  void _showBrandPicker(BuildContext context, List<String> brands) {
    String searchQuery = '';
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            final filtered = searchQuery.isEmpty
                ? brands
                : brands
                    .where((b) =>
                        b.toLowerCase().contains(searchQuery.toLowerCase()))
                    .toList();
            return DraggableScrollableSheet(
              initialChildSize: 0.7,
              minChildSize: 0.4,
              maxChildSize: 0.9,
              expand: false,
              builder: (ctx, scrollController) {
                return Column(
                  children: [
                    // Handle bar
                    Container(
                      margin: const EdgeInsets.only(top: 8),
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey[400],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    // Header with close button
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 8, 0),
                      child: Row(
                        children: [
                          Text(
                            S.of(context)!.selectManufacturer,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const Spacer(),
                          IconButton(
                            onPressed: () => Navigator.pop(ctx),
                            icon: const Icon(Icons.close, size: 24),
                          ),
                        ],
                      ),
                    ),
                    // Search field
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                      child: TextField(
                        autofocus: false,
                        decoration: InputDecoration(
                          hintText: S.of(context)!.searchHint,
                          prefixIcon: const Icon(Icons.search, size: 20),
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(
                              vertical: 10, horizontal: 12),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onChanged: (v) => setSheetState(() => searchQuery = v),
                      ),
                    ),
                    const Divider(height: 1),
                    // Brand list
                    Expanded(
                      child: ListView.builder(
                        controller: scrollController,
                        itemCount: filtered.length,
                        itemBuilder: (ctx, i) {
                          final brand = filtered[i];
                          final isSelected = brand == _makeCtrl.text;
                          return ListTile(
                            title: Text(
                              brand == 'Sonstige' ? S.of(context)!.otherBrand : brand,
                              style: TextStyle(
                                fontWeight: isSelected
                                    ? FontWeight.w700
                                    : FontWeight.normal,
                                color:
                                    isSelected ? B24Colors.primaryBlue : null,
                              ),
                            ),
                            trailing: isSelected
                                ? const Icon(Icons.check,
                                    color: B24Colors.primaryBlue)
                                : null,
                            onTap: () {
                              setState(() => _makeCtrl.text = brand);
                              Navigator.pop(ctx);
                            },
                          );
                        },
                      ),
                    ),
                  ],
                );
              },
            );
          },
        );
      },
    );
  }

  /// Check if a tire selection has dimensions but is missing load/speed index
  String? _validateTireSelection(_TireSelection sel, String label) {
    final f = sel.frontSpec;
    if (f == null || f['width'] == null) return null; // No tire data = OK
    if (f['loadIndex'] == null || f['speedRating'] == null) {
      return S.of(context)!.tireValidationError(label);
    }
    if (sel.hasDifferentSizes && sel.rearSpec != null) {
      final r = sel.rearSpec!;
      if (r['width'] != null &&
          (r['loadIndex'] == null || r['speedRating'] == null)) {
        return S.of(context)!.tireValidationErrorRear(label);
      }
    }
    return null;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    // Validate tire specs have load/speed index
    final tireErrors = [
      _validateTireSelection(_summer, S.of(context)!.summerTiresLabel),
      _validateTireSelection(_winter, S.of(context)!.winterTiresLabel),
      _validateTireSelection(_allSeason, S.of(context)!.allSeasonTiresLabel),
    ].whereType<String>().toList();

    if (tireErrors.isNotEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(tireErrors.first),
            backgroundColor: Colors.orange,
            duration: const Duration(seconds: 4),
          ),
        );
      }
      return;
    }

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
                  ? S.of(context)!.vehicleUpdated
                  : S.of(context)!.vehicleAdded),
              backgroundColor: Colors.green),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('${S.of(context)!.saveError}: $e'),
              backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  String? _localizedVehicleType(BuildContext context, String type) {
    switch (type) {
      case 'CAR': return S.of(context)!.vehicleTypeCar;
      case 'MOTORCYCLE': return S.of(context)!.vehicleTypeMotorcycle;
      case 'TRAILER': return S.of(context)!.vehicleTypeTrailer;
      default: return null;
    }
  }

  String? _localizedFuelType(BuildContext context, String type) {
    switch (type) {
      case 'PETROL': return S.of(context)!.fuelPetrol;
      case 'DIESEL': return S.of(context)!.fuelDiesel;
      case 'ELECTRIC': return S.of(context)!.fuelElectric;
      case 'HYBRID': return S.of(context)!.fuelHybrid;
      case 'PLUGIN_HYBRID': return S.of(context)!.fuelPluginHybrid;
      case 'LPG': return S.of(context)!.fuelLpg;
      case 'CNG': return S.of(context)!.fuelCng;
      default: return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
          title:
              Text(_isEditing ? S.of(context)!.editVehicle : S.of(context)!.addVehicleTitle)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Vehicle Type ──
              _SectionLabel(S.of(context)!.vehicleType),
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
                            // Reset vehicle selections to prevent wrong data across vehicle types
                            _makeCtrl.clear();
                            _modelCtrl.clear();
                            _yearCtrl.clear();
                            _plateCtrl.clear();
                            _vinCtrl.clear();
                            _fuelType = null;
                            _scanResult = null;
                            _showTireWarning = false;
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
                              Text(_localizedVehicleType(context, t.$1) ?? t.$2,
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

              // ── Invalid tire scan warning ──
              if (_scanTireInvalid) ...[
                _buildInvalidTireWarning(),
                const SizedBox(height: 8),
              ],

              const SizedBox(height: 8),

              // ── Make ──
              if (_vehicleType == 'CAR') ...[
                _SectionLabel(S.of(context)!.manufacturer),
                const SizedBox(height: 8),
                Builder(builder: (context) {
                  // Include scanned brand in dropdown if not already in list
                  final brands = List<String>.from(_carBrands);
                  if (_makeCtrl.text.isNotEmpty &&
                      !brands.contains(_makeCtrl.text)) {
                    brands.insert(0, _makeCtrl.text);
                  }
                  return FormField<String>(
                    initialValue:
                        brands.contains(_makeCtrl.text) ? _makeCtrl.text : null,
                    validator: (v) =>
                        (v == null || v.isEmpty) ? S.of(context)!.requiredField : null,
                    builder: (fieldState) {
                      return InkWell(
                        onTap: () => _showBrandPicker(context, brands),
                        child: InputDecorator(
                          decoration: InputDecoration(
                            hintText: S.of(context)!.selectManufacturer,
                            errorText: fieldState.errorText,
                            suffixIcon: const Icon(Icons.arrow_drop_down),
                          ),
                          child: _makeCtrl.text.isNotEmpty
                              ? Text(_makeCtrl.text)
                              : null,
                        ),
                      );
                    },
                  );
                }),
              ] else ...[
                TextFormField(
                  controller: _makeCtrl,
                  textCapitalization: TextCapitalization.words,
                  decoration: InputDecoration(
                    labelText: S.of(context)!.manufacturer,
                    hintText: S.of(context)!.manufacturerHint,
                  ),
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? S.of(context)!.requiredField : null,
                ),
              ],
              const SizedBox(height: 16),

              // ── Model ──
              TextFormField(
                controller: _modelCtrl,
                textCapitalization: TextCapitalization.words,
                decoration: InputDecoration(
                  labelText: S.of(context)!.model,
                  hintText: S.of(context)!.hintModel,
                ),
                validator: (v) =>
                    v == null || v.trim().isEmpty ? S.of(context)!.requiredField : null,
              ),
              const SizedBox(height: 16),

              // ── Year ──
              TextFormField(
                controller: _yearCtrl,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: S.of(context)!.year,
                  hintText: S.of(context)!.hintYear,
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return S.of(context)!.requiredField;
                  final y = int.tryParse(v);
                  if (y == null || y < 1980 || y > DateTime.now().year + 1) {
                    return S.of(context)!.invalidYear;
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // ── License plate ──
              TextFormField(
                controller: _plateCtrl,
                textCapitalization: TextCapitalization.characters,
                decoration: InputDecoration(
                  labelText: S.of(context)!.licensePlate,
                  hintText: S.of(context)!.hintLicensePlate,
                ),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return S.of(context)!.requiredField;
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // ── VIN ──
              TextFormField(
                controller: _vinCtrl,
                textCapitalization: TextCapitalization.characters,
                decoration: InputDecoration(
                  labelText: S.of(context)!.vinNumber,
                  hintText: S.of(context)!.vinHint,
                ),
              ),
              const SizedBox(height: 24),

              // ── TÜV-Termin ──
              _SectionLabel(S.of(context)!.inspectionDate),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<int>(
                      value: _inspectionMonth,
                      isExpanded: true,
                      decoration: InputDecoration(hintText: S.of(context)!.monthLabel),
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
                      decoration: InputDecoration(hintText: S.of(context)!.yearLabel),
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
                title: Text(S.of(context)!.inspectionReminder),
                subtitle: Text(
                  _inspectionReminder
                      ? S.of(context)!.daysBefore(_inspectionReminderDays.toString())
                      : S.of(context)!.noReminder,
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
                  decoration: InputDecoration(labelText: S.of(context)!.reminderLabel),
                  items: [
                    DropdownMenuItem(value: 7, child: Text(S.of(context)!.daysBeforeReminder7)),
                    DropdownMenuItem(value: 30, child: Text(S.of(context)!.daysBeforeReminder30)),
                  ],
                  onChanged: (v) =>
                      setState(() => _inspectionReminderDays = v ?? 30),
                ),
              ],

              if (_vehicleType != 'TRAILER') ...[
                const SizedBox(height: 24),

                // ── Fuel Type ──
                _SectionLabel(S.of(context)!.fuelTypeLabel),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _fuelType,
                  isExpanded: true,
                  decoration:
                      InputDecoration(hintText: S.of(context)!.selectFuel),
                  items: _fuelTypes
                      .map((f) =>
                          DropdownMenuItem(value: f.$1, child: Text(_localizedFuelType(context, f.$1) ?? f.$2)))
                      .toList(),
                  onChanged: (v) => setState(() => _fuelType = v),
                ),
              ],

              const SizedBox(height: 28),

              // ── Tire Specs ──
              _SectionLabel(S.of(context)!.tireSizes),
              const SizedBox(height: 4),
              Text(S.of(context)!.tireSizesDesc,
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
                      tabs: [
                        Tab(text: S.of(context)!.tireTabSummer),
                        Tab(text: S.of(context)!.tireTabWinter),
                        Tab(text: S.of(context)!.tireTabAllSeason),
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
                    : Text(S.of(context)!.save, style: const TextStyle(fontSize: 16)),
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
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    S.of(context)!.scanVehicleDoc,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    S.of(context)!.autoFillData,
                    style: const TextStyle(
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
                  S.of(context)!.fieldsRecognized(r.fieldsFound),
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
              Expanded(
                child: Text(
                  S.of(context)!.tireSizeRecognized,
                  style: const TextStyle(
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
            S.of(context)!.tireSizeApplyHint,
            style: TextStyle(fontSize: 11, color: Colors.grey[700]),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _applyScannedTireSizes,
              icon: const Icon(Icons.check, size: 18),
              label: Text(S.of(context)!.apply,
                  style: const TextStyle(fontWeight: FontWeight.w700)),
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

  Widget _buildInvalidTireWarning() {
    String scannedStr = '';
    if (_scanResult?.tireSize != null) {
      final ts = _scanResult!.tireSize!;
      scannedStr = '${ts.width}/${ts.aspectRatio} R${ts.diameter}';
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.warning_amber_rounded,
                  color: Colors.orange.shade700, size: 22),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  S.of(context)!.tireSizeNotRecognized,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: Colors.orange.shade700,
                  ),
                ),
              ),
              GestureDetector(
                onTap: () => setState(() => _scanTireInvalid = false),
                child: const Icon(Icons.close, size: 18, color: Colors.grey),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (scannedStr.isNotEmpty)
            Text('Gescannt: $scannedStr',
                style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.orange.shade900)),
          const SizedBox(height: 4),
          Text(
            S.of(context)!.tireSizeInvalidHint,
            style: TextStyle(fontSize: 11, color: Colors.grey[700]),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _openDocScanner,
              icon: const Icon(Icons.document_scanner, size: 18),
              label: Text(S.of(context)!.scanAgain,
                  style: const TextStyle(fontWeight: FontWeight.w700)),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.orange.shade700,
                side: BorderSide(color: Colors.orange.shade300),
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

  String _monthName(int m) {
    final locale = Localizations.localeOf(context).languageCode;
    return DateFormat('MMMM', locale).format(DateTime(2000, m));
  }
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
      if (rearSpec!['loadIndex'] != null)
        spec['rearLoadIndex'] = rearSpec!['loadIndex'];
      if (rearSpec!['speedRating'] != null)
        spec['rearSpeedRating'] = rearSpec!['speedRating'];
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
    final isMoto = vehicleType == 'MOTORCYCLE';
    final frontLabel = isMoto ? S.of(context)!.frontWheel : S.of(context)!.frontAxleFull;
    final rearLabel = isMoto ? S.of(context)!.rearWheel : S.of(context)!.rearAxleFull;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: Text(
            isMoto
                ? S.of(context)!.differentFrontRear
                : S.of(context)!.mixedTireSizesLabel,
            style: const TextStyle(fontSize: 13),
          ),
          value: selection.hasDifferentSizes,
          onChanged: (v) {
            selection.hasDifferentSizes = v;
            onChanged();
          },
        ),
        if (selection.hasDifferentSizes)
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text(frontLabel,
                style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[700],
                    fontSize: 13)),
          ),
        InteractiveTireSelector(
          vehicleType: vehicleType,
          initialSpec: selection.frontSpec,
          onChanged: (spec) {
            selection.frontSpec = spec;
            onChanged();
          },
        ),
        if (selection.hasDifferentSizes) ...[
          const Divider(),
          Text(rearLabel,
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
