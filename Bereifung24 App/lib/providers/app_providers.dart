import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/detailed_api_service.dart';
import '../models/detailed_models.dart';

// API Service Provider
final apiServiceProvider = Provider<ApiService>((ref) => ApiService());

// ==================== TIRE REQUESTS ====================

final tireRequestsProvider = FutureProvider<List<TireRequest>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  final response = await apiService.getTireRequests();
  return response.requests;
});

final tireRequestByIdProvider = FutureProvider.family<TireRequest, String>((ref, id) async {
  final apiService = ref.watch(apiServiceProvider);
  return await apiService.getTireRequestById(id);
});

// ==================== OFFERS ====================

final offerByIdProvider = FutureProvider.family<Offer, String>((ref, id) async {
  final apiService = ref.watch(apiServiceProvider);
  return await apiService.getOfferById(id);
});

// ==================== BOOKINGS ====================

final bookingsProvider = FutureProvider<List<Booking>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  final response = await apiService.getBookings();
  return response.bookings;
});

final availableSlotsProvider = FutureProvider.family<List<TimeSlot>, Map<String, dynamic>>((ref, params) async {
  final apiService = ref.watch(apiServiceProvider);
  final response = await apiService.getAvailableSlots(
    workshopId: params['workshopId'] as String,
    date: params['date'] as String,
    duration: params['duration'] as int,
  );
  return response.slots;
});

// ==================== VEHICLES ====================

final vehiclesProvider = FutureProvider<List<Vehicle>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  return await apiService.getVehicles();
});

// ==================== STATE NOTIFIERS ====================

class RequestCreationState {
  final int step;
  final Map<String, dynamic> data;
  final bool isLoading;
  final String? error;

  RequestCreationState({
    this.step = 0,
    this.data = const {},
    this.isLoading = false,
    this.error,
  });

  RequestCreationState copyWith({
    int? step,
    Map<String, dynamic>? data,
    bool? isLoading,
    String? error,
  }) {
    return RequestCreationState(
      step: step ?? this.step,
      data: data ?? this.data,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

class RequestCreationNotifier extends StateNotifier<RequestCreationState> {
  final ApiService apiService;

  RequestCreationNotifier(this.apiService) : super(RequestCreationState());

  void updateData(String key, dynamic value) {
    final newData = Map<String, dynamic>.from(state.data);
    newData[key] = value;
    state = state.copyWith(data: newData);
  }

  void nextStep() {
    state = state.copyWith(step: state.step + 1);
  }

  void previousStep() {
    if (state.step > 0) {
      state = state.copyWith(step: state.step - 1);
    }
  }

  void reset() {
    state = RequestCreationState();
  }

  Future<TireRequest?> submitRequest() async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final data = state.data;
      final request = await apiService.createTireRequest(
        vehicleId: data['vehicleId'] as String?,
        season: data['season'] as String,
        width: data['width'] as int,
        aspectRatio: data['aspectRatio'] as int,
        diameter: data['diameter'] as int,
        loadIndex: data['loadIndex'] as int?,
        speedRating: data['speedRating'] as String?,
        isRunflat: data['isRunflat'] as bool? ?? false,
        quantity: data['quantity'] as int,
        preferredBrands: data['preferredBrands'] as String?,
        additionalNotes: data['additionalNotes'] as String?,
        needByDate: data['needByDate'] as String,
        zipCode: data['zipCode'] as String,
        radiusKm: data['radiusKm'] as int,
      );
      
      state = state.copyWith(isLoading: false);
      return request;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return null;
    }
  }
}

final requestCreationProvider = StateNotifierProvider<RequestCreationNotifier, RequestCreationState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return RequestCreationNotifier(apiService);
});

// ==================== OFFER ACCEPTANCE ====================

class OfferAcceptanceState {
  final bool wantsStorage;
  final List<String> selectedTireOptionIds;
  final int? selectedQuantity;
  final bool isLoading;
  final String? error;

  OfferAcceptanceState({
    this.wantsStorage = false,
    this.selectedTireOptionIds = const [],
    this.selectedQuantity,
    this.isLoading = false,
    this.error,
  });

  OfferAcceptanceState copyWith({
    bool? wantsStorage,
    List<String>? selectedTireOptionIds,
    int? selectedQuantity,
    bool? isLoading,
    String? error,
  }) {
    return OfferAcceptanceState(
      wantsStorage: wantsStorage ?? this.wantsStorage,
      selectedTireOptionIds: selectedTireOptionIds ?? this.selectedTireOptionIds,
      selectedQuantity: selectedQuantity ?? this.selectedQuantity,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

class OfferAcceptanceNotifier extends StateNotifier<OfferAcceptanceState> {
  final ApiService apiService;

  OfferAcceptanceNotifier(this.apiService) : super(OfferAcceptanceState());

  void toggleStorage() {
    state = state.copyWith(wantsStorage: !state.wantsStorage);
  }

  void toggleTireOption(String optionId) {
    final newIds = List<String>.from(state.selectedTireOptionIds);
    if (newIds.contains(optionId)) {
      newIds.remove(optionId);
    } else {
      newIds.add(optionId);
    }
    state = state.copyWith(selectedTireOptionIds: newIds);
  }

  void setQuantity(int quantity) {
    state = state.copyWith(selectedQuantity: quantity);
  }

  void reset() {
    state = OfferAcceptanceState();
  }

  Future<Map<String, dynamic>?> acceptOffer(String offerId) async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final result = await apiService.acceptOffer(
        offerId: offerId,
        wantsStorage: state.wantsStorage,
        selectedTireOptionIds: state.selectedTireOptionIds.isEmpty ? null : state.selectedTireOptionIds,
        selectedQuantity: state.selectedQuantity,
      );
      
      state = state.copyWith(isLoading: false);
      return result;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return null;
    }
  }
}

final offerAcceptanceProvider = StateNotifierProvider<OfferAcceptanceNotifier, OfferAcceptanceState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return OfferAcceptanceNotifier(apiService);
});

// ==================== BOOKING ====================

class BookingCreationState {
  final String? selectedDate;
  final String? selectedTime;
  final String? selectedTireOptionId;
  final String paymentMethod;
  final String? message;
  final bool isLoading;
  final String? error;

  BookingCreationState({
    this.selectedDate,
    this.selectedTime,
    this.selectedTireOptionId,
    this.paymentMethod = 'PAY_ONSITE',
    this.message,
    this.isLoading = false,
    this.error,
  });

  BookingCreationState copyWith({
    String? selectedDate,
    String? selectedTime,
    String? selectedTireOptionId,
    String? paymentMethod,
    String? message,
    bool? isLoading,
    String? error,
  }) {
    return BookingCreationState(
      selectedDate: selectedDate ?? this.selectedDate,
      selectedTime: selectedTime ?? this.selectedTime,
      selectedTireOptionId: selectedTireOptionId ?? this.selectedTireOptionId,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      message: message ?? this.message,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

class BookingCreationNotifier extends StateNotifier<BookingCreationState> {
  final ApiService apiService;

  BookingCreationNotifier(this.apiService) : super(BookingCreationState());

  void setDate(String date) {
    state = state.copyWith(selectedDate: date, selectedTime: null);
  }

  void setTime(String time) {
    state = state.copyWith(selectedTime: time);
  }

  void setTireOption(String optionId) {
    state = state.copyWith(selectedTireOptionId: optionId);
  }

  void setPaymentMethod(String method) {
    state = state.copyWith(paymentMethod: method);
  }

  void setMessage(String message) {
    state = state.copyWith(message: message);
  }

  void reset() {
    state = BookingCreationState();
  }

  Future<Booking?> createBooking({
    required String offerId,
    required String workshopId,
    required int durationMinutes,
  }) async {
    if (state.selectedDate == null || state.selectedTime == null) {
      state = state.copyWith(error: 'Bitte wählen Sie Datum und Zeit');
      return null;
    }

    state = state.copyWith(isLoading: true, error: null);
    
    try {
      // Combine date and time into ISO string
      final dateTime = DateTime.parse('${state.selectedDate}T${state.selectedTime}:00');
      final endTime = dateTime.add(Duration(minutes: durationMinutes));
      
      final booking = await apiService.createBooking(
        offerId: offerId,
        workshopId: workshopId,
        appointmentDate: dateTime.toIso8601String(),
        appointmentEndTime: endTime.toIso8601String(),
        paymentMethod: state.paymentMethod,
        customerMessage: state.message,
        selectedTireOptionId: state.selectedTireOptionId,
      );
      
      state = state.copyWith(isLoading: false);
      return booking;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return null;
    }
  }
}

final bookingCreationProvider = StateNotifierProvider<BookingCreationNotifier, BookingCreationState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return BookingCreationNotifier(apiService);
});

// ==================== MOCK DATA ====================

List<TireRequest> _getMockTireRequests() {
  final now = DateTime.now();
  return [
    TireRequest(
      id: 'mock-1',
      customerId: 'customer-1',
      vehicleId: 'vehicle-1',
      season: 'WINTER',
      width: 225,
      aspectRatio: 45,
      diameter: 17,
      loadIndex: 91,
      speedRating: 'V',
      isRunflat: false,
      quantity: 4,
      preferredBrands: 'Continental, Michelin',
      additionalNotes: 'Bitte schnellstmöglich',
      status: 'QUOTED',
      needByDate: '2025-12-28',
      zipCode: '10115',
      city: 'Berlin',
      radiusKm: 20,
      latitude: 52.5200,
      longitude: 13.4050,
      createdAt: now.subtract(const Duration(days: 2)),
      updatedAt: now.subtract(const Duration(days: 1)),
      offers: [
        Offer(
          id: 'offer-1',
          tireRequestId: 'mock-1',
          workshopId: 'workshop-1',
          tireBrand: 'Continental',
          tireModel: 'WinterContact TS 870',
          description: 'Premium Winterreifen',
          pricePerTire: 89.99,
          price: 439.96,
          installationFee: 80.00,
          durationMinutes: 90,
          balancingPrice: 40.00,
          storagePrice: 120.00,
          storageAvailable: true,
          customerWantsStorage: false,
          validUntil: now.add(const Duration(days: 7)),
          status: 'PENDING',
          createdAt: now.subtract(const Duration(days: 1)),
          tireOptions: [
            TireOption(
              id: 'option-1',
              offerId: 'offer-1',
              brand: 'Continental',
              model: 'WinterContact TS 870',
              description: 'Premium Winterreifen mit exzellenter Bremsleistung',
              pricePerTire: 89.99,
              montagePrice: 20.00,
              carTireType: 'ALL_FOUR',
              speedRating: 'V',
              loadIndex: 91,
              isRunflat: false,
            ),
            TireOption(
              id: 'option-2',
              offerId: 'offer-1',
              brand: 'Michelin',
              model: 'Alpin 6',
              description: 'Langlebige Winterreifen',
              pricePerTire: 95.99,
              montagePrice: 20.00,
              carTireType: 'ALL_FOUR',
              speedRating: 'V',
              loadIndex: 91,
              isRunflat: false,
            ),
          ],
          workshop: Workshop(
            id: 'workshop-1',
            companyName: 'Reifen Müller GmbH',
            street: 'Hauptstraße 123',
            zipCode: '10115',
            city: 'Berlin',
            phone: '+49 30 12345678',
            email: 'info@reifen-mueller.de',
            website: 'www.reifen-mueller.de',
            latitude: 52.5200,
            longitude: 13.4050,
          ),
        ),
        Offer(
          id: 'offer-2',
          tireRequestId: 'mock-1',
          workshopId: 'workshop-2',
          tireBrand: 'Bridgestone',
          tireModel: 'Blizzak LM005',
          description: 'Top Winterreifen',
          pricePerTire: 84.99,
          price: 414.96,
          installationFee: 75.00,
          durationMinutes: 90,
          balancingPrice: 35.00,
          storagePrice: 100.00,
          storageAvailable: true,
          customerWantsStorage: false,
          validUntil: now.add(const Duration(days: 5)),
          status: 'PENDING',
          createdAt: now.subtract(const Duration(hours: 12)),
          tireOptions: [
            TireOption(
              id: 'option-3',
              offerId: 'offer-2',
              brand: 'Bridgestone',
              model: 'Blizzak LM005',
              description: 'Beste Performance auf Schnee und Eis',
              pricePerTire: 84.99,
              montagePrice: 18.75,
              carTireType: 'ALL_FOUR',
              speedRating: 'V',
              loadIndex: 91,
              isRunflat: false,
            ),
          ],
          workshop: Workshop(
            id: 'workshop-2',
            companyName: 'Auto Service Schmidt',
            street: 'Berliner Allee 45',
            zipCode: '10117',
            city: 'Berlin',
            phone: '+49 30 87654321',
            email: 'kontakt@auto-schmidt.de',
            latitude: 52.5180,
            longitude: 13.3980,
          ),
        ),
      ],
    ),
    TireRequest(
      id: 'mock-2',
      customerId: 'customer-1',
      season: 'SUMMER',
      width: 205,
      aspectRatio: 55,
      diameter: 16,
      loadIndex: 94,
      speedRating: 'H',
      isRunflat: false,
      quantity: 4,
      preferredBrands: 'Dunlop',
      status: 'PENDING',
      needByDate: '2026-03-15',
      zipCode: '10115',
      city: 'Berlin',
      radiusKm: 15,
      latitude: 52.5200,
      longitude: 13.4050,
      createdAt: now.subtract(const Duration(days: 5)),
      updatedAt: now.subtract(const Duration(days: 5)),
    ),
    TireRequest(
      id: 'mock-3',
      customerId: 'customer-1',
      season: 'WHEEL_CHANGE',
      width: 0,
      aspectRatio: 0,
      diameter: 0,
      isRunflat: false,
      quantity: 4,
      additionalNotes: 'RÄDER UMSTECKEN - Von Winter auf Sommer',
      status: 'COMPLETED',
      needByDate: '2025-04-10',
      zipCode: '10115',
      city: 'Berlin',
      radiusKm: 10,
      createdAt: now.subtract(const Duration(days: 240)),
      updatedAt: now.subtract(const Duration(days: 235)),
    ),
  ];
}
