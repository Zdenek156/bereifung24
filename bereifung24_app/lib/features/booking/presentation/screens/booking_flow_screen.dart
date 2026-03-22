import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/services/analytics_service.dart';
import '../../../../core/services/stripe_service.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/models/models.dart';

class BookingFlowScreen extends ConsumerStatefulWidget {
  final String workshopId;
  final String? serviceType;
  const BookingFlowScreen({super.key, required this.workshopId, this.serviceType});

  @override
  ConsumerState<BookingFlowScreen> createState() => _BookingFlowScreenState();
}

class _BookingFlowScreenState extends ConsumerState<BookingFlowScreen> {
  final _api = ApiClient();
  int _currentStep = 0;
  bool _isSubmitting = false;

  // Step 1: Service
  late String _serviceType;
  String _vehicleType = 'CAR';

  static const _serviceLabels = {
    'TIRE_CHANGE': 'Reifenwechsel',
    'WHEEL_CHANGE': 'Räderwechsel',
    'TIRE_REPAIR': 'Reifenreparatur',
    'MOTORCYCLE_TIRE': 'Motorrad-Reifenwechsel',
    'ALIGNMENT_BOTH': 'Achsvermessung',
    'CLIMATE_SERVICE': 'Klimaservice',
    'BRAKE_SERVICE': 'Bremsendienst',
    'BATTERY_SERVICE': 'Batterieservice',
  };

  // Step 2: Vehicle
  String _licensePlate = '';
  String _tireSize = '';
  List<Vehicle> _savedVehicles = [];
  Vehicle? _selectedVehicle;
  bool _loadingVehicles = true;

  // Step 3: Date & Time
  DateTime? _selectedDate;
  String? _selectedTime;

  // Step 4: Notes
  final _notesCtrl = TextEditingController();

  // Payment state
  String? _bookingId;
  bool _paymentRequired = false;
  double _totalAmount = 0;

  final _availableTimes = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00',
  ];

  @override
  void initState() {
    super.initState();
    _serviceType = widget.serviceType ?? 'TIRE_CHANGE';
    // If service was pre-selected from home screen, skip service step
    if (widget.serviceType != null) {
      _currentStep = 1;
    }
    _loadVehicles();
  }

  Future<void> _loadVehicles() async {
    try {
      final response = await _api.getCustomerVehicles();
      final data = response.data;
      final list = (data is List ? data : data['vehicles'] ?? []) as List;
      if (mounted) {
        setState(() {
          _savedVehicles = list.map((e) => Vehicle.fromJson(e)).toList();
          _loadingVehicles = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingVehicles = false);
    }
  }

  void _selectVehicle(Vehicle vehicle) {
    setState(() {
      _selectedVehicle = vehicle;
      _licensePlate = vehicle.licensePlate ?? '';
      _tireSize = vehicle.tireSizeWithIndex;
      _vehicleType = vehicle.vehicleType;
    });
  }

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  bool get _canProceed {
    switch (_currentStep) {
      case 0:
        return true; // service type always selected
      case 1:
        return _licensePlate.isNotEmpty;
      case 2:
        return _selectedDate != null && _selectedTime != null;
      case 3:
        return true; // notes are optional
      case 4:
        return true; // payment step — button triggers _processPayment
      default:
        return false;
    }
  }

  Future<void> _submitBooking() async {
    setState(() => _isSubmitting = true);

    try {
      final response = await _api.createBooking({
        'workshopId': widget.workshopId,
        'serviceType': _serviceType,
        'vehicleType': _vehicleType,
        'licensePlate': _licensePlate,
        'tireSize': _tireSize,
        'appointmentDate': _selectedDate!.toIso8601String(),
        'appointmentTime': _selectedTime,
        'notes': _notesCtrl.text.isNotEmpty ? _notesCtrl.text : null,
      });

      if (!mounted) return;

      final data = response.data;
      _bookingId = data['id'] as String?;
      final amount = data['totalPrice'];
      _totalAmount = amount is num ? amount.toDouble() : 0;
      _paymentRequired = _totalAmount > 0;

      AnalyticsService().logBookingCreated(
        workshopId: widget.workshopId,
        serviceType: _serviceType,
      );

      if (_paymentRequired) {
        // Move to payment step
        setState(() => _currentStep = 4);
      } else {
        // No payment needed — go straight to confirmation
        setState(() => _currentStep = 5);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Buchung fehlgeschlagen. Bitte versuche es erneut.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _processPayment() async {
    if (_bookingId == null || _totalAmount <= 0) return;
    setState(() => _isSubmitting = true);

    try {
      final success = await StripeService().processPayment(
        bookingId: _bookingId!,
        amount: _totalAmount,
      );

      if (!mounted) return;

      if (success != null) {
        AnalyticsService().logPaymentCompleted(_totalAmount, 'EUR');
        setState(() => _currentStep = 5); // confirmation
      } else {
        // User cancelled payment — stay on payment step
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Zahlung abgebrochen.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Zahlung fehlgeschlagen. Bitte versuche es erneut.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _currentStep < 5
          ? AppBar(
              title: Text(_currentStep < 4
                  ? 'Schritt ${_currentStep + 1} von 4'
                  : 'Zahlung'),
              leading: IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => _showCancelDialog(),
              ),
            )
          : null, // confirmation step (5) has no AppBar
      body: SafeArea(
        child: Column(
          children: [
            // Progress indicator (steps 0-3, optionally 4 for payment)
            if (_currentStep < 5)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: List.generate(_paymentRequired ? 5 : 4, (i) {
                    return Expanded(
                      child: Container(
                        height: 4,
                        margin: const EdgeInsets.symmetric(horizontal: 2),
                        decoration: BoxDecoration(
                          color: i <= _currentStep
                              ? B24Colors.primaryBlue
                              : Colors.grey.shade300,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    );
                  }),
                ),
              ),

            // Step content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: _buildStepContent(),
              ),
            ),

            // Navigation buttons
            if (_currentStep < 5)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    if (_currentStep > 0 && _currentStep < 4)
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () =>
                              setState(() => _currentStep--),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          child: const Text('Zurück'),
                        ),
                      ),
                    if (_currentStep > 0 && _currentStep < 4)
                      const SizedBox(width: 12),
                    Expanded(
                      flex: 2,
                      child: FilledButton(
                        onPressed: _canProceed && !_isSubmitting
                            ? () {
                                if (_currentStep == 4) {
                                  _processPayment();
                                } else if (_currentStep == 3) {
                                  _submitBooking();
                                } else {
                                  setState(() => _currentStep++);
                                }
                              }
                            : null,
                        style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        child: _isSubmitting
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white),
                              )
                            : Text(
                                _currentStep == 4
                                    ? 'Jetzt bezahlen'
                                    : _currentStep == 3
                                        ? 'Buchen'
                                        : 'Weiter',
                                style: const TextStyle(fontSize: 16),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildServiceStep();
      case 1:
        return _buildVehicleStep();
      case 2:
        return _buildDateTimeStep();
      case 3:
        return _buildSummaryStep();
      case 4:
        return _buildPaymentStep();
      case 5:
        return _buildConfirmationStep();
      default:
        return const SizedBox();
    }
  }

  // ── Step 1: Service Type ──
  Widget _buildServiceStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Service wählen',
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text('Was möchtest du machen lassen?',
            style: TextStyle(color: Colors.grey[600])),
        const SizedBox(height: 24),
        _ServiceOption(
          icon: Icons.tire_repair,
          title: 'Reifenwechsel',
          subtitle: 'Sommer-/Winterreifen wechseln',
          selected: _serviceType == 'TIRE_CHANGE',
          onTap: () => setState(() => _serviceType = 'TIRE_CHANGE'),
        ),
        const SizedBox(height: 12),
        _ServiceOption(
          icon: Icons.autorenew,
          title: 'Räderwechsel',
          subtitle: 'Kompletträder wechseln',
          selected: _serviceType == 'WHEEL_CHANGE',
          onTap: () => setState(() => _serviceType = 'WHEEL_CHANGE'),
        ),
        const SizedBox(height: 12),
        _ServiceOption(
          icon: Icons.build,
          title: 'Reifenreparatur',
          subtitle: 'Reifen reparieren lassen',
          selected: _serviceType == 'TIRE_REPAIR',
          onTap: () => setState(() => _serviceType = 'TIRE_REPAIR'),
        ),
        const SizedBox(height: 12),
        _ServiceOption(
          icon: Icons.two_wheeler,
          title: 'Motorrad-Reifenwechsel',
          subtitle: 'Motorradreifen wechseln',
          selected: _serviceType == 'MOTORCYCLE_TIRE',
          onTap: () => setState(() => _serviceType = 'MOTORCYCLE_TIRE'),
        ),
        const SizedBox(height: 12),
        _ServiceOption(
          icon: Icons.straighten,
          title: 'Achsvermessung',
          subtitle: 'Spur und Sturz einstellen',
          selected: _serviceType == 'ALIGNMENT_BOTH',
          onTap: () => setState(() => _serviceType = 'ALIGNMENT_BOTH'),
        ),
        const SizedBox(height: 24),
        Text('Fahrzeugtyp',
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          children: [
            ('CAR', 'Auto'),
            ('MOTORCYCLE', 'Motorrad'),
            ('TRAILER', 'Anhänger'),
          ].map((e) {
            final selected = _vehicleType == e.$1;
            return ChoiceChip(
              label: Text(e.$2),
              selected: selected,
              onSelected: (_) => setState(() => _vehicleType = e.$1),
            );
          }).toList(),
        ),
      ],
    );
  }

  // ── Step 2: Vehicle ──
  Widget _buildVehicleStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Fahrzeug-Daten',
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text('Wähle ein gespeichertes Fahrzeug oder gib die Daten manuell ein.',
            style: TextStyle(color: Colors.grey[600])),
        const SizedBox(height: 24),

        // Saved vehicles
        if (_loadingVehicles)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (_savedVehicles.isNotEmpty) ...[
          Text('Gespeicherte Fahrzeuge',
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          ..._savedVehicles.map((vehicle) {
            final isSelected = _selectedVehicle?.id == vehicle.id;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: GestureDetector(
                onTap: () => _selectVehicle(vehicle),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? B24Colors.primaryBlue.withValues(alpha: 0.05)
                        : null,
                    border: Border.all(
                      color: isSelected
                          ? B24Colors.primaryBlue
                          : Colors.grey.shade300,
                      width: isSelected ? 2 : 1,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.directions_car,
                          color: isSelected
                              ? B24Colors.primaryBlue
                              : Colors.grey[600]),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${vehicle.brand} ${vehicle.model}',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: isSelected
                                    ? B24Colors.primaryBlue
                                    : null,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${vehicle.licensePlate ?? ''} · ${vehicle.vehicleType}${vehicle.tireSizeWithIndex.isNotEmpty ? ' · ${vehicle.tireSizeWithIndex}' : ''}',
                              style: TextStyle(
                                  color: Colors.grey[600], fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                      if (isSelected)
                        const Icon(Icons.check_circle,
                            color: B24Colors.primaryBlue),
                    ],
                  ),
                ),
              ),
            );
          }),

          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Row(
              children: [
                const Expanded(child: Divider()),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text('oder manuell eingeben',
                      style: TextStyle(color: Colors.grey[500], fontSize: 13)),
                ),
                const Expanded(child: Divider()),
              ],
            ),
          ),
        ],

        TextField(
          decoration: const InputDecoration(
            labelText: 'Kennzeichen *',
            hintText: 'z.B. M-AB 1234',
            prefixIcon: Icon(Icons.directions_car),
          ),
          textCapitalization: TextCapitalization.characters,
          controller: TextEditingController(text: _licensePlate),
          onChanged: (v) => setState(() {
            _licensePlate = v.trim();
            _selectedVehicle = null;
          }),
        ),
        const SizedBox(height: 16),
        TextField(
          decoration: const InputDecoration(
            labelText: 'Reifengröße (optional)',
            hintText: 'z.B. 205/55 R16',
            prefixIcon: Icon(Icons.tire_repair),
          ),
          controller: TextEditingController(text: _tireSize),
          onChanged: (v) {
            _tireSize = v.trim();
            _selectedVehicle = null;
          },
        ),
      ],
    );
  }

  // ── Step 3: Date & Time ──
  Widget _buildDateTimeStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Termin wählen',
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text('Wähle Datum und Uhrzeit.',
            style: TextStyle(color: Colors.grey[600])),
        const SizedBox(height: 24),

        // Date picker
        ListTile(
          leading: const Icon(Icons.calendar_today, color: B24Colors.primaryBlue),
          title: Text(_selectedDate != null
              ? '${_selectedDate!.day}.${_selectedDate!.month}.${_selectedDate!.year}'
              : 'Datum auswählen'),
          trailing: const Icon(Icons.chevron_right),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: Colors.grey.shade300),
          ),
          onTap: () async {
            final now = DateTime.now();
            final tomorrow = DateTime(now.year, now.month, now.day + 1);
            final date = await showDatePicker(
              context: context,
              initialDate: tomorrow,
              firstDate: tomorrow,
              lastDate: now.add(const Duration(days: 90)),
              locale: const Locale('de', 'DE'),
            );
            if (date != null) setState(() => _selectedDate = date);
          },
        ),

        const SizedBox(height: 20),

        // Time grid
        if (_selectedDate != null) ...[
          Text('Uhrzeit',
              style: Theme.of(context)
                  .textTheme
                  .titleSmall
                  ?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _availableTimes.map((time) {
              final isSelected = _selectedTime == time;
              return GestureDetector(
                onTap: () => setState(() => _selectedTime = time),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected ? B24Colors.primaryBlue : null,
                    border: Border.all(
                      color: isSelected
                          ? B24Colors.primaryBlue
                          : Colors.grey.shade300,
                    ),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    time,
                    style: TextStyle(
                      color: isSelected ? Colors.white : null,
                      fontWeight: isSelected ? FontWeight.w600 : null,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ],
    );
  }

  // ── Step 4: Summary & Notes ──
  Widget _buildSummaryStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Zusammenfassung',
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 24),
        _SummaryRow(label: 'Service', value: _serviceLabels[_serviceType] ?? _serviceType),
        _SummaryRow(label: 'Fahrzeugtyp', value: _vehicleType == 'CAR' ? 'Auto' : _vehicleType == 'MOTORCYCLE' ? 'Motorrad' : 'Anhänger'),
        if (_selectedVehicle != null)
          _SummaryRow(
              label: 'Fahrzeug',
              value: '${_selectedVehicle!.brand} ${_selectedVehicle!.model}'),
        _SummaryRow(label: 'Kennzeichen', value: _licensePlate),
        if (_tireSize.isNotEmpty)
          _SummaryRow(label: 'Reifengröße', value: _tireSize),
        _SummaryRow(
          label: 'Termin',
          value:
              '${_selectedDate!.day}.${_selectedDate!.month}.${_selectedDate!.year} um $_selectedTime',
        ),
        const SizedBox(height: 24),
        TextField(
          controller: _notesCtrl,
          maxLines: 3,
          decoration: const InputDecoration(
            labelText: 'Anmerkungen (optional)',
            hintText: 'z.B. Reifen liegen im Kofferraum',
            alignLabelWithHint: true,
          ),
        ),
      ],
    );
  }

  // ── Step 5: Payment ──
  Widget _buildPaymentStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Zahlung',
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text('Bitte schließe die Zahlung ab.',
            style: TextStyle(color: Colors.grey[600])),
        const SizedBox(height: 32),

        // Amount display
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [B24Colors.primaryBlue, B24Colors.primaryLight],
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              const Text('Gesamtbetrag',
                  style: TextStyle(color: Colors.white70, fontSize: 14)),
              const SizedBox(height: 8),
              Text(
                '${_totalAmount.toStringAsFixed(2)} €',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 24),

        // Payment info
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.blue.shade50,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Icon(Icons.lock, color: Colors.blue.shade700, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Sichere Zahlung über Stripe. Deine Kartendaten werden verschlüsselt übertragen.',
                  style: TextStyle(color: Colors.blue.shade700, fontSize: 13),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Accepted methods
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.credit_card, color: Colors.grey[600], size: 28),
            const SizedBox(width: 12),
            Text('Visa, Mastercard, SEPA',
                style: TextStyle(color: Colors.grey[600])),
          ],
        ),
      ],
    );
  }

  // ── Step 6: Confirmation ──
  Widget _buildConfirmationStep() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 40),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.check, size: 64, color: Colors.green.shade700),
          ),
          const SizedBox(height: 24),
          Text('Buchung erfolgreich!',
              style: Theme.of(context)
                  .textTheme
                  .headlineSmall
                  ?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(
            'Dein Termin wurde angefragt.\nDu erhältst eine Bestätigung per E-Mail.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey[600]),
          ),
          const SizedBox(height: 32),
          FilledButton(
            onPressed: () => context.go('/bookings'),
            child: const Text('Zu meinen Terminen'),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () => context.go('/home'),
            child: const Text('Zur Startseite'),
          ),
        ],
      ),
    );
  }

  void _showCancelDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Buchung abbrechen?'),
        content: const Text('Dein Fortschritt geht verloren.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Nein'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.pop();
            },
            child: const Text('Ja, abbrechen'),
          ),
        ],
      ),
    );
  }
}

// ── Helper Widgets ──

class _ServiceOption extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  const _ServiceOption({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected ? B24Colors.primaryBlue.withValues(alpha: 0.05) : null,
          border: Border.all(
            color: selected ? B24Colors.primaryBlue : Colors.grey.shade300,
            width: selected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: selected
                    ? B24Colors.primaryBlue.withValues(alpha: 0.15)
                    : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon,
                  color: selected ? B24Colors.primaryBlue : Colors.grey[600]),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: selected ? B24Colors.primaryBlue : null,
                      )),
                  Text(subtitle,
                      style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                ],
              ),
            ),
            if (selected)
              const Icon(Icons.check_circle, color: B24Colors.primaryBlue),
          ],
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  const _SummaryRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600])),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
