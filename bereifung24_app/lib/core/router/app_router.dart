import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../services/analytics_service.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/auth/presentation/screens/forgot_password_screen.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/search/presentation/screens/search_screen.dart';
import '../../features/search/presentation/screens/workshop_detail_screen.dart';
import '../../features/booking/presentation/screens/booking_flow_screen.dart';
import '../../features/booking/presentation/screens/booking_summary_screen.dart';
import '../../features/bookings/presentation/screens/bookings_screen.dart';
import '../../features/bookings/presentation/screens/booking_detail_screen.dart';
import '../../features/vehicles/presentation/screens/vehicles_screen.dart';
import '../../features/vehicles/presentation/screens/add_vehicle_screen.dart';
import '../../data/models/vehicle.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/profile/presentation/screens/edit_profile_screen.dart';
import '../../features/profile/presentation/screens/notification_settings_screen.dart';
import '../../features/profile/presentation/screens/legal_screen.dart';
import '../../features/profile/presentation/screens/feedback_screen.dart';
import '../../features/reviews/presentation/screens/review_screen.dart';
import '../../features/emergency/presentation/screens/emergency_screen.dart';
import '../../features/ai_advisor/presentation/screens/ai_advisor_screen.dart';
import '../../shared/widgets/main_scaffold.dart';
import '../../features/workshop/screens/workshop_dashboard_screen.dart';
import '../../features/workshop/screens/workshop_calendar_screen.dart';
import '../../features/workshop/screens/workshop_bookings_screen.dart';
import '../../features/workshop/screens/workshop_reviews_screen.dart';
import '../../features/workshop/screens/workshop_profile_screen.dart';
import '../../features/workshop/widgets/workshop_scaffold.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();
final _workshopShellKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  // Rebuild router when auth state changes
  final authState = ref.watch(authStateProvider);
  final isLoggedIn = authState.isAuthenticated;
  final isWorkshop = authState.user?.role == 'WORKSHOP';

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/home',
    debugLogDiagnostics: true,
    observers: [AnalyticsService().observer],
    redirect: (context, state) {
      final isAuthRoute = state.matchedLocation.startsWith('/login') ||
          state.matchedLocation.startsWith('/register') ||
          state.matchedLocation.startsWith('/forgot-password');

      // Not logged in and NOT on auth route → go to login
      if (!isLoggedIn && !isAuthRoute) return '/login';

      // Logged in and ON auth route → redirect to correct home
      if (isLoggedIn && isAuthRoute) {
        return isWorkshop ? '/workshop' : '/home';
      }

      // Workshop user trying to access customer routes → redirect
      if (isLoggedIn && isWorkshop) {
        final loc = state.matchedLocation;
        if (loc.startsWith('/home') ||
            loc.startsWith('/search') ||
            loc.startsWith('/bookings') ||
            loc.startsWith('/vehicles')) {
          return '/workshop';
        }
      }

      // Customer user trying to access workshop routes → redirect
      if (isLoggedIn &&
          !isWorkshop &&
          state.matchedLocation.startsWith('/workshop')) {
        return '/home';
      }

      return null; // no redirect
    },
    routes: [
      // ── Auth routes (no bottom nav) ──
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),

      // ── Main app with bottom navigation ──
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => MainScaffold(child: child),
        routes: [
          GoRoute(
            path: '/home',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: HomeScreen(),
            ),
          ),
          GoRoute(
            path: '/search',
            pageBuilder: (context, state) {
              final serviceType = state.uri.queryParameters['service'];
              final qp = state.uri.queryParameters;
              Map<String, String>? tireDimOverride;
              if (qp['width'] != null && qp['width']!.isNotEmpty) {
                tireDimOverride = {
                  'width': qp['width']!,
                  'height': qp['height'] ?? '',
                  'diameter': qp['diameter'] ?? '',
                  'season': qp['season'] ?? 's',
                  'loadIndex': qp['loadIndex'] ?? '',
                  'speedIndex': qp['speedIndex'] ?? '',
                };
              }
              return NoTransitionPage(
                child: SearchScreen(
                    serviceType: serviceType,
                    tireDimensionOverride: tireDimOverride),
              );
            },
            routes: [
              GoRoute(
                path: 'workshop/:id',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (context, state) => WorkshopDetailScreen(
                  workshopId: state.pathParameters['id']!,
                  serviceType: state.uri.queryParameters['service'],
                ),
              ),
            ],
          ),
          GoRoute(
            path: '/bookings',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: BookingsScreen(),
            ),
            routes: [
              GoRoute(
                path: ':id',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (context, state) => BookingDetailScreen(
                  bookingId: state.pathParameters['id']!,
                ),
              ),
            ],
          ),
          GoRoute(
            path: '/vehicles',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: VehiclesScreen(),
            ),
            routes: [
              GoRoute(
                path: 'add',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (context, state) => const AddVehicleScreen(),
              ),
              GoRoute(
                path: 'edit',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (context, state) => AddVehicleScreen(
                  vehicle: state.extra as Vehicle?,
                ),
              ),
            ],
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ProfileScreen(),
            ),
            routes: [
              GoRoute(
                path: 'edit',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (context, state) => const EditProfileScreen(),
              ),
              GoRoute(
                path: 'notifications',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (context, state) => const NotificationSettingsScreen(),
              ),
              GoRoute(
                path: 'agb',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (context, state) => const AGBScreen(),
              ),
              GoRoute(
                path: 'datenschutz',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (context, state) => const DatenschutzScreen(),
              ),
              GoRoute(
                path: 'impressum',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (context, state) => const ImpressumScreen(),
              ),
              GoRoute(
                path: 'feedback',
                parentNavigatorKey: _rootNavigatorKey,
                builder: (context, state) => const FeedbackScreen(),
              ),
            ],
          ),
        ],
      ),

      // ── Workshop app with bottom navigation ──
      ShellRoute(
        navigatorKey: _workshopShellKey,
        builder: (context, state, child) => WorkshopScaffold(child: child),
        routes: [
          GoRoute(
            path: '/workshop',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: WorkshopDashboardScreen(),
            ),
          ),
          GoRoute(
            path: '/workshop/calendar',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: WorkshopCalendarScreen(),
            ),
          ),
          GoRoute(
            path: '/workshop/bookings',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: WorkshopBookingsScreen(),
            ),
          ),
          GoRoute(
            path: '/workshop/reviews',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: WorkshopReviewsScreen(),
            ),
          ),
          GoRoute(
            path: '/workshop/profile',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: WorkshopProfileScreen(),
            ),
          ),
        ],
      ),

      // ── Booking flow (full screen, no bottom nav) ──
      GoRoute(
        path: '/booking/:workshopId',
        builder: (context, state) => BookingFlowScreen(
          workshopId: state.pathParameters['workshopId']!,
          serviceType: state.uri.queryParameters['service'],
        ),
      ),

      // ── Emergency / Pannen-Modus (full screen, no bottom nav) ──
      GoRoute(
        path: '/emergency',
        builder: (context, state) => const EmergencyScreen(),
      ),

      // ── KI Reifen-Berater (full screen, no bottom nav) ──
      GoRoute(
        path: '/ai-advisor',
        builder: (context, state) => const AIAdvisorScreen(),
      ),

      // ── Review screen (from push notification or booking detail) ──
      GoRoute(
        path: '/review/:bookingId',
        builder: (context, state) => ReviewScreen(
          bookingId: state.pathParameters['bookingId']!,
          workshopName: state.uri.queryParameters['workshop'],
        ),
      ),

      // ── Booking summary (from workshop detail) ──
      GoRoute(
        path: '/booking-summary/:workshopId',
        builder: (context, state) {
          final params = state.uri.queryParameters;
          return BookingSummaryScreen(
            workshopId: state.pathParameters['workshopId']!,
            serviceType: params['service'],
            date: params['date'] ?? '',
            time: params['time'] ?? '',
            vehicleId: params['vehicleId'],
            withBalancing: params['balancing'] == '1',
            withStorage: params['storage'] == '1',
            withWashing: params['washing'] == '1',
            searchBasePrice: params['searchBasePrice'] != null
                ? double.tryParse(params['searchBasePrice']!)
                : null,
            selectedPackage: params['selectedPackage'],
            tireBrand: params['tireBrand'],
            tireModel: params['tireModel'],
            tireArticleId: params['tireArticleId'],
            tireQuantity: params['tireQuantity'] != null
                ? int.tryParse(params['tireQuantity']!)
                : null,
            tirePricePerUnit: params['tirePricePerUnit'] != null
                ? double.tryParse(params['tirePricePerUnit']!)
                : null,
            tireTotalPrice: params['tireTotalPrice'] != null
                ? double.tryParse(params['tireTotalPrice']!)
                : null,
            tireDimensions: params['tireDimensions'],
            tireFrontBrand: params['tireFrontBrand'],
            tireFrontModel: params['tireFrontModel'],
            tireFrontDimensions: params['tireFrontDimensions'],
            tireFrontQty: params['tireFrontQty'] != null
                ? int.tryParse(params['tireFrontQty']!)
                : null,
            tireFrontPrice: params['tireFrontPrice'] != null
                ? double.tryParse(params['tireFrontPrice']!)
                : null,
            tireFrontPricePerUnit: params['tireFrontPricePerUnit'] != null
                ? double.tryParse(params['tireFrontPricePerUnit']!)
                : null,
            tireFrontArticleId: params['tireFrontArticleId'],
            tireFrontEan: params['tireFrontEan'],
            tireRearBrand: params['tireRearBrand'],
            tireRearModel: params['tireRearModel'],
            tireRearDimensions: params['tireRearDimensions'],
            tireRearQty: params['tireRearQty'] != null
                ? int.tryParse(params['tireRearQty']!)
                : null,
            tireRearPrice: params['tireRearPrice'] != null
                ? double.tryParse(params['tireRearPrice']!)
                : null,
            tireRearPricePerUnit: params['tireRearPricePerUnit'] != null
                ? double.tryParse(params['tireRearPricePerUnit']!)
                : null,
            tireRearArticleId: params['tireRearArticleId'],
            tireRearEan: params['tireRearEan'],
          );
        },
      ),
    ],
  );
});
