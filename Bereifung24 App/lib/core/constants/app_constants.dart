class AppConstants {
  // API Configuration
  static const String apiBaseUrl = 'http://localhost:3000/api'; // Local development API
  static const String apiVersion = '';
  
  // Storage Keys
  static const String keyAuthToken = 'auth_token';
  static const String keyUserId = 'user_id';
  static const String keyOnboardingComplete = 'onboarding_complete';
  static const String keyNotificationsEnabled = 'notifications_enabled';
  
  // Notification Settings
  static const String notificationOfferReceived = 'offer_received';
  static const String notificationRatingReminder = 'rating_reminder';
  
  // Timing
  static const int ratingReminderDelayDays = 1;
}