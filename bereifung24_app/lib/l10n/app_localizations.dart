import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_de.dart';
import 'app_localizations_en.dart';
import 'app_localizations_es.dart';
import 'app_localizations_fr.dart';
import 'app_localizations_it.dart';
import 'app_localizations_ru.dart';
import 'app_localizations_tr.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of S
/// returned by `S.of(context)`.
///
/// Applications need to include `S.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: S.localizationsDelegates,
///   supportedLocales: S.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the S.supportedLocales
/// property.
abstract class S {
  S(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static S? of(BuildContext context) {
    return Localizations.of<S>(context, S);
  }

  static const LocalizationsDelegate<S> delegate = _SDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('de'),
    Locale('en'),
    Locale('es'),
    Locale('fr'),
    Locale('it'),
    Locale('ru'),
    Locale('tr')
  ];

  /// No description provided for @appTitle.
  ///
  /// In de, this message translates to:
  /// **'Bereifung24'**
  String get appTitle;

  /// No description provided for @login.
  ///
  /// In de, this message translates to:
  /// **'Anmelden'**
  String get login;

  /// No description provided for @register.
  ///
  /// In de, this message translates to:
  /// **'Registrieren'**
  String get register;

  /// No description provided for @logout.
  ///
  /// In de, this message translates to:
  /// **'Abmelden'**
  String get logout;

  /// No description provided for @cancel.
  ///
  /// In de, this message translates to:
  /// **'Abbrechen'**
  String get cancel;

  /// No description provided for @save.
  ///
  /// In de, this message translates to:
  /// **'Speichern'**
  String get save;

  /// No description provided for @delete.
  ///
  /// In de, this message translates to:
  /// **'Löschen'**
  String get delete;

  /// No description provided for @back.
  ///
  /// In de, this message translates to:
  /// **'Zurück'**
  String get back;

  /// No description provided for @next.
  ///
  /// In de, this message translates to:
  /// **'Weiter'**
  String get next;

  /// No description provided for @yes.
  ///
  /// In de, this message translates to:
  /// **'Ja'**
  String get yes;

  /// No description provided for @no.
  ///
  /// In de, this message translates to:
  /// **'Nein'**
  String get no;

  /// No description provided for @or.
  ///
  /// In de, this message translates to:
  /// **'oder'**
  String get or;

  /// No description provided for @search.
  ///
  /// In de, this message translates to:
  /// **'Suchen'**
  String get search;

  /// No description provided for @retry.
  ///
  /// In de, this message translates to:
  /// **'Erneut versuchen'**
  String get retry;

  /// No description provided for @close.
  ///
  /// In de, this message translates to:
  /// **'Schließen'**
  String get close;

  /// No description provided for @loading.
  ///
  /// In de, this message translates to:
  /// **'Laden...'**
  String get loading;

  /// No description provided for @error.
  ///
  /// In de, this message translates to:
  /// **'Fehler'**
  String get error;

  /// No description provided for @ok.
  ///
  /// In de, this message translates to:
  /// **'OK'**
  String get ok;

  /// No description provided for @email.
  ///
  /// In de, this message translates to:
  /// **'E-Mail'**
  String get email;

  /// No description provided for @password.
  ///
  /// In de, this message translates to:
  /// **'Passwort'**
  String get password;

  /// No description provided for @firstName.
  ///
  /// In de, this message translates to:
  /// **'Vorname'**
  String get firstName;

  /// No description provided for @lastName.
  ///
  /// In de, this message translates to:
  /// **'Nachname'**
  String get lastName;

  /// No description provided for @phone.
  ///
  /// In de, this message translates to:
  /// **'Telefon'**
  String get phone;

  /// No description provided for @phoneOptional.
  ///
  /// In de, this message translates to:
  /// **'Telefon (optional)'**
  String get phoneOptional;

  /// No description provided for @street.
  ///
  /// In de, this message translates to:
  /// **'Straße & Hausnummer *'**
  String get street;

  /// No description provided for @zip.
  ///
  /// In de, this message translates to:
  /// **'PLZ *'**
  String get zip;

  /// No description provided for @zipLabel.
  ///
  /// In de, this message translates to:
  /// **'Postleitzahl *'**
  String get zipLabel;

  /// No description provided for @city.
  ///
  /// In de, this message translates to:
  /// **'Stadt *'**
  String get city;

  /// No description provided for @emailRequired.
  ///
  /// In de, this message translates to:
  /// **'E-Mail-Adresse *'**
  String get emailRequired;

  /// No description provided for @invalidEmail.
  ///
  /// In de, this message translates to:
  /// **'Ungültige E-Mail'**
  String get invalidEmail;

  /// No description provided for @passwordsNoMatch.
  ///
  /// In de, this message translates to:
  /// **'Passwörter stimmen nicht überein'**
  String get passwordsNoMatch;

  /// No description provided for @loginWithGoogle.
  ///
  /// In de, this message translates to:
  /// **'Mit Google anmelden'**
  String get loginWithGoogle;

  /// No description provided for @loginWithApple.
  ///
  /// In de, this message translates to:
  /// **'Mit Apple anmelden'**
  String get loginWithApple;

  /// No description provided for @loginWithBiometric.
  ///
  /// In de, this message translates to:
  /// **'Mit Biometrie anmelden'**
  String get loginWithBiometric;

  /// No description provided for @registerWithGoogle.
  ///
  /// In de, this message translates to:
  /// **'Mit Google registrieren'**
  String get registerWithGoogle;

  /// No description provided for @registerWithApple.
  ///
  /// In de, this message translates to:
  /// **'Mit Apple registrieren'**
  String get registerWithApple;

  /// No description provided for @forgotPassword.
  ///
  /// In de, this message translates to:
  /// **'Passwort vergessen?'**
  String get forgotPassword;

  /// No description provided for @noAccount.
  ///
  /// In de, this message translates to:
  /// **'Noch kein Konto?'**
  String get noAccount;

  /// No description provided for @hasAccount.
  ///
  /// In de, this message translates to:
  /// **'Bereits ein Konto?'**
  String get hasAccount;

  /// No description provided for @backToLogin.
  ///
  /// In de, this message translates to:
  /// **'Zurück zum Login'**
  String get backToLogin;

  /// No description provided for @resetPassword.
  ///
  /// In de, this message translates to:
  /// **'Passwort zurücksetzen'**
  String get resetPassword;

  /// No description provided for @resetPasswordDesc.
  ///
  /// In de, this message translates to:
  /// **'Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.'**
  String get resetPasswordDesc;

  /// No description provided for @sendLink.
  ///
  /// In de, this message translates to:
  /// **'Link senden'**
  String get sendLink;

  /// No description provided for @checkInbox.
  ///
  /// In de, this message translates to:
  /// **'Prüfe dein Postfach und folge dem Link zum Zurücksetzen deines Passworts.'**
  String get checkInbox;

  /// No description provided for @enterValidEmail.
  ///
  /// In de, this message translates to:
  /// **'Bitte gültige E-Mail eingeben'**
  String get enterValidEmail;

  /// No description provided for @googleLoginFailed.
  ///
  /// In de, this message translates to:
  /// **'Google-Anmeldung fehlgeschlagen'**
  String get googleLoginFailed;

  /// No description provided for @appleLoginFailed.
  ///
  /// In de, this message translates to:
  /// **'Apple-Anmeldung fehlgeschlagen'**
  String get appleLoginFailed;

  /// No description provided for @googleRegisterFailed.
  ///
  /// In de, this message translates to:
  /// **'Google-Registrierung fehlgeschlagen'**
  String get googleRegisterFailed;

  /// No description provided for @appleRegisterFailed.
  ///
  /// In de, this message translates to:
  /// **'Apple-Registrierung fehlgeschlagen'**
  String get appleRegisterFailed;

  /// No description provided for @acceptTerms.
  ///
  /// In de, this message translates to:
  /// **'Bitte akzeptiere die Nutzungsbedingungen'**
  String get acceptTerms;

  /// No description provided for @privacyPolicy.
  ///
  /// In de, this message translates to:
  /// **'Datenschutzerklärung'**
  String get privacyPolicy;

  /// No description provided for @completeAddress.
  ///
  /// In de, this message translates to:
  /// **'Adresse vervollständigen'**
  String get completeAddress;

  /// No description provided for @completeProfile.
  ///
  /// In de, this message translates to:
  /// **'Profil vervollständigen'**
  String get completeProfile;

  /// No description provided for @addressNeeded.
  ///
  /// In de, this message translates to:
  /// **'Bitte gib noch deine Adresse an, damit wir Werkstätten in deiner Nähe finden können.'**
  String get addressNeeded;

  /// No description provided for @nameNotProvided.
  ///
  /// In de, this message translates to:
  /// **'Dein Name wurde nicht übermittelt. Bitte vervollständige dein Profil.'**
  String get nameNotProvided;

  /// No description provided for @appleNameNotProvided.
  ///
  /// In de, this message translates to:
  /// **'Apple hat deinen Namen nicht übermittelt. Bitte vervollständige dein Profil.'**
  String get appleNameNotProvided;

  /// No description provided for @addressInfoText.
  ///
  /// In de, this message translates to:
  /// **'Ihre Adresse wird benötigt, um Werkstätten in Ihrer Nähe zu finden und die Entfernung zu berechnen.'**
  String get addressInfoText;

  /// No description provided for @confirmPassword.
  ///
  /// In de, this message translates to:
  /// **'Passwort bestätigen'**
  String get confirmPassword;

  /// No description provided for @welcomeTitle1.
  ///
  /// In de, this message translates to:
  /// **'Reifenservice zum Festpreis'**
  String get welcomeTitle1;

  /// No description provided for @welcomeDesc1.
  ///
  /// In de, this message translates to:
  /// **'Finde den passenden Reifenservice in deiner Nähe und buche bequem online – zum garantierten Festpreis.'**
  String get welcomeDesc1;

  /// No description provided for @welcomeTitle2.
  ///
  /// In de, this message translates to:
  /// **'Schnell & einfach buchen'**
  String get welcomeTitle2;

  /// No description provided for @welcomeDesc2.
  ///
  /// In de, this message translates to:
  /// **'Wähle deinen Wunschtermin, vergleiche Werkstätten und buche in unter 2 Minuten – alles in einer App.'**
  String get welcomeDesc2;

  /// No description provided for @welcomeTitle3.
  ///
  /// In de, this message translates to:
  /// **'Dein persönlicher KI-Berater'**
  String get welcomeTitle3;

  /// No description provided for @account.
  ///
  /// In de, this message translates to:
  /// **'Konto'**
  String get account;

  /// No description provided for @editProfile.
  ///
  /// In de, this message translates to:
  /// **'Profil bearbeiten'**
  String get editProfile;

  /// No description provided for @notifications.
  ///
  /// In de, this message translates to:
  /// **'Benachrichtigungen'**
  String get notifications;

  /// No description provided for @changePassword.
  ///
  /// In de, this message translates to:
  /// **'Passwort ändern'**
  String get changePassword;

  /// No description provided for @app.
  ///
  /// In de, this message translates to:
  /// **'App'**
  String get app;

  /// No description provided for @aboutBereifung24.
  ///
  /// In de, this message translates to:
  /// **'Über Bereifung24'**
  String get aboutBereifung24;

  /// No description provided for @giveFeedback.
  ///
  /// In de, this message translates to:
  /// **'Feedback geben'**
  String get giveFeedback;

  /// No description provided for @dangerZone.
  ///
  /// In de, this message translates to:
  /// **'Gefahrenzone'**
  String get dangerZone;

  /// No description provided for @deleteAccount.
  ///
  /// In de, this message translates to:
  /// **'Konto löschen'**
  String get deleteAccount;

  /// No description provided for @changePasswordTitle.
  ///
  /// In de, this message translates to:
  /// **'Passwort ändern'**
  String get changePasswordTitle;

  /// No description provided for @currentPassword.
  ///
  /// In de, this message translates to:
  /// **'Aktuelles Passwort'**
  String get currentPassword;

  /// No description provided for @newPassword.
  ///
  /// In de, this message translates to:
  /// **'Neues Passwort'**
  String get newPassword;

  /// No description provided for @confirmNewPassword.
  ///
  /// In de, this message translates to:
  /// **'Passwort bestätigen'**
  String get confirmNewPassword;

  /// No description provided for @passwordChanged.
  ///
  /// In de, this message translates to:
  /// **'Passwort erfolgreich geändert'**
  String get passwordChanged;

  /// No description provided for @change.
  ///
  /// In de, this message translates to:
  /// **'Ändern'**
  String get change;

  /// No description provided for @logoutConfirm.
  ///
  /// In de, this message translates to:
  /// **'Abmelden?'**
  String get logoutConfirm;

  /// No description provided for @logoutConfirmText.
  ///
  /// In de, this message translates to:
  /// **'Möchtest du dich wirklich abmelden?'**
  String get logoutConfirmText;

  /// No description provided for @deleteAccountConfirm.
  ///
  /// In de, this message translates to:
  /// **'Konto löschen?'**
  String get deleteAccountConfirm;

  /// No description provided for @deleteAccountDone.
  ///
  /// In de, this message translates to:
  /// **'Konto wurde gelöscht'**
  String get deleteAccountDone;

  /// No description provided for @deletePermanently.
  ///
  /// In de, this message translates to:
  /// **'Endgültig löschen'**
  String get deletePermanently;

  /// No description provided for @appearance.
  ///
  /// In de, this message translates to:
  /// **'Erscheinungsbild'**
  String get appearance;

  /// No description provided for @system.
  ///
  /// In de, this message translates to:
  /// **'System'**
  String get system;

  /// No description provided for @light.
  ///
  /// In de, this message translates to:
  /// **'Hell'**
  String get light;

  /// No description provided for @dark.
  ///
  /// In de, this message translates to:
  /// **'Dunkel'**
  String get dark;

  /// No description provided for @personalData.
  ///
  /// In de, this message translates to:
  /// **'Persönliche Daten'**
  String get personalData;

  /// No description provided for @phoneNumber.
  ///
  /// In de, this message translates to:
  /// **'Telefonnummer *'**
  String get phoneNumber;

  /// No description provided for @address.
  ///
  /// In de, this message translates to:
  /// **'Adresse'**
  String get address;

  /// No description provided for @profileUpdated.
  ///
  /// In de, this message translates to:
  /// **'Profil aktualisiert'**
  String get profileUpdated;

  /// No description provided for @errorSaving.
  ///
  /// In de, this message translates to:
  /// **'Fehler beim Speichern'**
  String get errorSaving;

  /// No description provided for @feedback.
  ///
  /// In de, this message translates to:
  /// **'Feedback'**
  String get feedback;

  /// No description provided for @giveFeedbackTitle.
  ///
  /// In de, this message translates to:
  /// **'Feedback geben'**
  String get giveFeedbackTitle;

  /// No description provided for @feedbackHint.
  ///
  /// In de, this message translates to:
  /// **'Was können wir verbessern? Was gefällt dir gut?'**
  String get feedbackHint;

  /// No description provided for @selectRating.
  ///
  /// In de, this message translates to:
  /// **'Bitte wähle eine Bewertung'**
  String get selectRating;

  /// No description provided for @errorSending.
  ///
  /// In de, this message translates to:
  /// **'Fehler beim Senden. Bitte versuche es erneut.'**
  String get errorSending;

  /// No description provided for @settingsSaved.
  ///
  /// In de, this message translates to:
  /// **'Einstellungen gespeichert'**
  String get settingsSaved;

  /// No description provided for @appointmentReminder.
  ///
  /// In de, this message translates to:
  /// **'Terminerinnerung'**
  String get appointmentReminder;

  /// No description provided for @appointmentReminderDesc.
  ///
  /// In de, this message translates to:
  /// **'Erinnerung 24h vor deinem Termin'**
  String get appointmentReminderDesc;

  /// No description provided for @seasonHint.
  ///
  /// In de, this message translates to:
  /// **'Saison-Hinweis'**
  String get seasonHint;

  /// No description provided for @seasonHintDesc.
  ///
  /// In de, this message translates to:
  /// **'Hinweis zum Reifenwechsel bei Saisonbeginn'**
  String get seasonHintDesc;

  /// No description provided for @bookingUpdates.
  ///
  /// In de, this message translates to:
  /// **'Buchungs-Updates'**
  String get bookingUpdates;

  /// No description provided for @bookingUpdatesDesc.
  ///
  /// In de, this message translates to:
  /// **'Statusänderungen deiner Buchungen'**
  String get bookingUpdatesDesc;

  /// No description provided for @agb.
  ///
  /// In de, this message translates to:
  /// **'Allgemeine Geschäftsbedingungen'**
  String get agb;

  /// No description provided for @datenschutz.
  ///
  /// In de, this message translates to:
  /// **'Datenschutzerklärung'**
  String get datenschutz;

  /// No description provided for @impressum.
  ///
  /// In de, this message translates to:
  /// **'Impressum'**
  String get impressum;

  /// No description provided for @review.
  ///
  /// In de, this message translates to:
  /// **'Bewertung'**
  String get review;

  /// No description provided for @rateWorkshop.
  ///
  /// In de, this message translates to:
  /// **'Werkstatt bewerten'**
  String get rateWorkshop;

  /// No description provided for @backToBookings.
  ///
  /// In de, this message translates to:
  /// **'Zurück zu Buchungen'**
  String get backToBookings;

  /// No description provided for @reviewHint.
  ///
  /// In de, this message translates to:
  /// **'Beschreiben Sie Ihre Erfahrung...'**
  String get reviewHint;

  /// No description provided for @selectService.
  ///
  /// In de, this message translates to:
  /// **'Service wählen'**
  String get selectService;

  /// No description provided for @whatService.
  ///
  /// In de, this message translates to:
  /// **'Was möchtest du machen lassen?'**
  String get whatService;

  /// No description provided for @tireChange.
  ///
  /// In de, this message translates to:
  /// **'Reifenwechsel'**
  String get tireChange;

  /// No description provided for @tireChangeDesc.
  ///
  /// In de, this message translates to:
  /// **'Sommer-/Winterreifen wechseln'**
  String get tireChangeDesc;

  /// No description provided for @wheelChange.
  ///
  /// In de, this message translates to:
  /// **'Räderwechsel'**
  String get wheelChange;

  /// No description provided for @wheelChangeDesc.
  ///
  /// In de, this message translates to:
  /// **'Kompletträder wechseln'**
  String get wheelChangeDesc;

  /// No description provided for @tireRepair.
  ///
  /// In de, this message translates to:
  /// **'Reifenreparatur'**
  String get tireRepair;

  /// No description provided for @tireRepairDesc.
  ///
  /// In de, this message translates to:
  /// **'Reifen reparieren lassen'**
  String get tireRepairDesc;

  /// No description provided for @motorcycleTireChange.
  ///
  /// In de, this message translates to:
  /// **'Motorrad-Reifenwechsel'**
  String get motorcycleTireChange;

  /// No description provided for @motorcycleTireChangeDesc.
  ///
  /// In de, this message translates to:
  /// **'Motorradreifen wechseln'**
  String get motorcycleTireChangeDesc;

  /// No description provided for @axleAlignment.
  ///
  /// In de, this message translates to:
  /// **'Achsvermessung'**
  String get axleAlignment;

  /// No description provided for @axleAlignmentDesc.
  ///
  /// In de, this message translates to:
  /// **'Spur und Sturz einstellen'**
  String get axleAlignmentDesc;

  /// No description provided for @climateService.
  ///
  /// In de, this message translates to:
  /// **'Klimaservice'**
  String get climateService;

  /// No description provided for @vehicleType.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeugtyp'**
  String get vehicleType;

  /// No description provided for @trailer.
  ///
  /// In de, this message translates to:
  /// **'Anhänger'**
  String get trailer;

  /// No description provided for @vehicleData.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeug-Daten'**
  String get vehicleData;

  /// No description provided for @selectSavedVehicle.
  ///
  /// In de, this message translates to:
  /// **'Wähle ein gespeichertes Fahrzeug oder gib die Daten manuell ein.'**
  String get selectSavedVehicle;

  /// No description provided for @savedVehicles.
  ///
  /// In de, this message translates to:
  /// **'Gespeicherte Fahrzeuge'**
  String get savedVehicles;

  /// No description provided for @orEnterManually.
  ///
  /// In de, this message translates to:
  /// **'oder manuell eingeben'**
  String get orEnterManually;

  /// No description provided for @licensePlate.
  ///
  /// In de, this message translates to:
  /// **'Kennzeichen *'**
  String get licensePlate;

  /// No description provided for @licensePlateHint.
  ///
  /// In de, this message translates to:
  /// **'z.B. M-AB 1234'**
  String get licensePlateHint;

  /// No description provided for @tireSizeOptional.
  ///
  /// In de, this message translates to:
  /// **'Reifengröße (optional)'**
  String get tireSizeOptional;

  /// No description provided for @tireSizeHint.
  ///
  /// In de, this message translates to:
  /// **'z.B. 205/55 R16'**
  String get tireSizeHint;

  /// No description provided for @selectDate.
  ///
  /// In de, this message translates to:
  /// **'Termin wählen'**
  String get selectDate;

  /// No description provided for @selectDateDesc.
  ///
  /// In de, this message translates to:
  /// **'Wähle Datum und Uhrzeit.'**
  String get selectDateDesc;

  /// No description provided for @time.
  ///
  /// In de, this message translates to:
  /// **'Uhrzeit'**
  String get time;

  /// No description provided for @summary.
  ///
  /// In de, this message translates to:
  /// **'Zusammenfassung'**
  String get summary;

  /// No description provided for @notesOptional.
  ///
  /// In de, this message translates to:
  /// **'Anmerkungen (optional)'**
  String get notesOptional;

  /// No description provided for @notesHint.
  ///
  /// In de, this message translates to:
  /// **'z.B. Reifen liegen im Kofferraum'**
  String get notesHint;

  /// No description provided for @payment.
  ///
  /// In de, this message translates to:
  /// **'Zahlung'**
  String get payment;

  /// No description provided for @completePayment.
  ///
  /// In de, this message translates to:
  /// **'Bitte schließe die Zahlung ab.'**
  String get completePayment;

  /// No description provided for @totalAmount.
  ///
  /// In de, this message translates to:
  /// **'Gesamtbetrag'**
  String get totalAmount;

  /// No description provided for @totalPrice.
  ///
  /// In de, this message translates to:
  /// **'Gesamtpreis'**
  String get totalPrice;

  /// No description provided for @total.
  ///
  /// In de, this message translates to:
  /// **'Gesamt'**
  String get total;

  /// No description provided for @paymentMethods.
  ///
  /// In de, this message translates to:
  /// **'Visa, Mastercard, SEPA'**
  String get paymentMethods;

  /// No description provided for @bookingSuccessful.
  ///
  /// In de, this message translates to:
  /// **'Buchung erfolgreich!'**
  String get bookingSuccessful;

  /// No description provided for @goToBookings.
  ///
  /// In de, this message translates to:
  /// **'Zu meinen Terminen'**
  String get goToBookings;

  /// No description provided for @goToHome.
  ///
  /// In de, this message translates to:
  /// **'Zur Startseite'**
  String get goToHome;

  /// No description provided for @cancelBooking.
  ///
  /// In de, this message translates to:
  /// **'Buchung abbrechen?'**
  String get cancelBooking;

  /// No description provided for @progressLost.
  ///
  /// In de, this message translates to:
  /// **'Dein Fortschritt geht verloren.'**
  String get progressLost;

  /// No description provided for @yesCancel.
  ///
  /// In de, this message translates to:
  /// **'Ja, abbrechen'**
  String get yesCancel;

  /// No description provided for @bookingFailed.
  ///
  /// In de, this message translates to:
  /// **'Buchung fehlgeschlagen. Bitte versuche es erneut.'**
  String get bookingFailed;

  /// No description provided for @paymentCancelled.
  ///
  /// In de, this message translates to:
  /// **'Zahlung abgebrochen.'**
  String get paymentCancelled;

  /// No description provided for @paymentFailed.
  ///
  /// In de, this message translates to:
  /// **'Zahlung fehlgeschlagen. Bitte versuche es erneut.'**
  String get paymentFailed;

  /// No description provided for @bookingOverview.
  ///
  /// In de, this message translates to:
  /// **'Buchungsübersicht'**
  String get bookingOverview;

  /// No description provided for @workshop.
  ///
  /// In de, this message translates to:
  /// **'Werkstatt'**
  String get workshop;

  /// No description provided for @service.
  ///
  /// In de, this message translates to:
  /// **'Service'**
  String get service;

  /// No description provided for @vehicle.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeug'**
  String get vehicle;

  /// No description provided for @noVehicleSelected.
  ///
  /// In de, this message translates to:
  /// **'Kein Fahrzeug ausgewählt'**
  String get noVehicleSelected;

  /// No description provided for @selectVehicle.
  ///
  /// In de, this message translates to:
  /// **'Bitte wähle ein Fahrzeug aus'**
  String get selectVehicle;

  /// No description provided for @appointment.
  ///
  /// In de, this message translates to:
  /// **'Termin'**
  String get appointment;

  /// No description provided for @messageToWorkshop.
  ///
  /// In de, this message translates to:
  /// **'Nachricht an die Werkstatt (optional)'**
  String get messageToWorkshop;

  /// No description provided for @messageHint.
  ///
  /// In de, this message translates to:
  /// **'z.B. Felgenschloss liegt im Kofferraum, '**
  String get messageHint;

  /// No description provided for @costs.
  ///
  /// In de, this message translates to:
  /// **'Kosten'**
  String get costs;

  /// No description provided for @acceptedPaymentMethods.
  ///
  /// In de, this message translates to:
  /// **'Akzeptierte Zahlungsmethoden'**
  String get acceptedPaymentMethods;

  /// No description provided for @frontAxle.
  ///
  /// In de, this message translates to:
  /// **'VA'**
  String get frontAxle;

  /// No description provided for @rearAxle.
  ///
  /// In de, this message translates to:
  /// **'HA'**
  String get rearAxle;

  /// No description provided for @frontAxleMoto.
  ///
  /// In de, this message translates to:
  /// **'VR'**
  String get frontAxleMoto;

  /// No description provided for @rearAxleMoto.
  ///
  /// In de, this message translates to:
  /// **'HR'**
  String get rearAxleMoto;

  /// No description provided for @myBookings.
  ///
  /// In de, this message translates to:
  /// **'Meine Buchungen'**
  String get myBookings;

  /// No description provided for @upcoming.
  ///
  /// In de, this message translates to:
  /// **'Kommende'**
  String get upcoming;

  /// No description provided for @past.
  ///
  /// In de, this message translates to:
  /// **'Vergangene'**
  String get past;

  /// No description provided for @noBookings.
  ///
  /// In de, this message translates to:
  /// **'Keine Buchungen'**
  String get noBookings;

  /// No description provided for @couldNotLoadBookings.
  ///
  /// In de, this message translates to:
  /// **'Termine konnten nicht geladen werden'**
  String get couldNotLoadBookings;

  /// No description provided for @searchWorkshop.
  ///
  /// In de, this message translates to:
  /// **'Werkstatt suchen'**
  String get searchWorkshop;

  /// No description provided for @bookingDetails.
  ///
  /// In de, this message translates to:
  /// **'Buchungsdetails'**
  String get bookingDetails;

  /// No description provided for @couldNotLoadDetails.
  ///
  /// In de, this message translates to:
  /// **'Details konnten nicht geladen werden'**
  String get couldNotLoadDetails;

  /// No description provided for @bookingNotFound.
  ///
  /// In de, this message translates to:
  /// **'Buchung nicht gefunden'**
  String get bookingNotFound;

  /// No description provided for @booking.
  ///
  /// In de, this message translates to:
  /// **'Buchung'**
  String get booking;

  /// No description provided for @timeLabel.
  ///
  /// In de, this message translates to:
  /// **'Uhrzeit: {time}'**
  String timeLabel(String time);

  /// No description provided for @durationMinutes.
  ///
  /// In de, this message translates to:
  /// **'Dauer: ca. {minutes} Minuten'**
  String durationMinutes(int minutes);

  /// No description provided for @licensePlateLabel.
  ///
  /// In de, this message translates to:
  /// **'Kennzeichen: {plate}'**
  String licensePlateLabel(String plate);

  /// No description provided for @tireDetails.
  ///
  /// In de, this message translates to:
  /// **'Reifendetails'**
  String get tireDetails;

  /// No description provided for @tireSize.
  ///
  /// In de, this message translates to:
  /// **'Größe: {size}'**
  String tireSize(String size);

  /// No description provided for @tireQuantity.
  ///
  /// In de, this message translates to:
  /// **'Anzahl: {count} Stück'**
  String tireQuantity(int count);

  /// No description provided for @additionalServices.
  ///
  /// In de, this message translates to:
  /// **'Zusatzleistungen'**
  String get additionalServices;

  /// No description provided for @paymentDetails.
  ///
  /// In de, this message translates to:
  /// **'Zahlungsdetails'**
  String get paymentDetails;

  /// No description provided for @remarks.
  ///
  /// In de, this message translates to:
  /// **'Anmerkungen'**
  String get remarks;

  /// No description provided for @yourMessageToWorkshop.
  ///
  /// In de, this message translates to:
  /// **'Ihre Nachricht an die Werkstatt'**
  String get yourMessageToWorkshop;

  /// No description provided for @bookTireAndMontage.
  ///
  /// In de, this message translates to:
  /// **'Reifen & Montage buchen'**
  String get bookTireAndMontage;

  /// No description provided for @bookNow.
  ///
  /// In de, this message translates to:
  /// **'Jetzt buchen'**
  String get bookNow;

  /// No description provided for @couldNotLoadVehicles.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeuge konnten nicht geladen werden'**
  String get couldNotLoadVehicles;

  /// No description provided for @selectVehicleTitle.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeug wählen'**
  String get selectVehicleTitle;

  /// No description provided for @addVehicleTitle.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeug hinzufügen'**
  String get addVehicleTitle;

  /// No description provided for @zipOrCity.
  ///
  /// In de, this message translates to:
  /// **'PLZ oder Stadt...'**
  String get zipOrCity;

  /// No description provided for @useLocation.
  ///
  /// In de, this message translates to:
  /// **'Standort verwenden'**
  String get useLocation;

  /// No description provided for @locatingPosition.
  ///
  /// In de, this message translates to:
  /// **'Standort wird ermittelt...'**
  String get locatingPosition;

  /// No description provided for @locationError.
  ///
  /// In de, this message translates to:
  /// **'Standortfehler: {error}'**
  String locationError(String error);

  /// No description provided for @radius.
  ///
  /// In de, this message translates to:
  /// **'Umkreis'**
  String get radius;

  /// No description provided for @sortBy.
  ///
  /// In de, this message translates to:
  /// **'Sortieren nach'**
  String get sortBy;

  /// No description provided for @allSeason.
  ///
  /// In de, this message translates to:
  /// **'Ganzjahr'**
  String get allSeason;

  /// No description provided for @serviceNotOffered.
  ///
  /// In de, this message translates to:
  /// **'{label} wird von dieser Werkstatt nicht angeboten'**
  String serviceNotOffered(String label);

  /// No description provided for @notAvailable.
  ///
  /// In de, this message translates to:
  /// **'Nicht verfügbar'**
  String get notAvailable;

  /// No description provided for @storeTireSize.
  ///
  /// In de, this message translates to:
  /// **'{season}-Größe hinterlegen'**
  String storeTireSize(String season);

  /// No description provided for @frontAxleFull.
  ///
  /// In de, this message translates to:
  /// **'Vorderachse'**
  String get frontAxleFull;

  /// No description provided for @rearAxleFull.
  ///
  /// In de, this message translates to:
  /// **'Hinterachse'**
  String get rearAxleFull;

  /// No description provided for @allManufacturers.
  ///
  /// In de, this message translates to:
  /// **'Alle Hersteller'**
  String get allManufacturers;

  /// No description provided for @allManufacturersCount.
  ///
  /// In de, this message translates to:
  /// **'Alle Hersteller ({count})'**
  String allManufacturersCount(int count);

  /// No description provided for @brandCount.
  ///
  /// In de, this message translates to:
  /// **'{brand} ({count})'**
  String brandCount(String brand, int count);

  /// No description provided for @showMore.
  ///
  /// In de, this message translates to:
  /// **'Weitere anzeigen ({count})'**
  String showMore(int count);

  /// No description provided for @showLess.
  ///
  /// In de, this message translates to:
  /// **'Weniger anzeigen'**
  String get showLess;

  /// No description provided for @showLessTires.
  ///
  /// In de, this message translates to:
  /// **'Weniger Reifen anzeigen'**
  String get showLessTires;

  /// No description provided for @selected.
  ///
  /// In de, this message translates to:
  /// **'Ausgewählt'**
  String get selected;

  /// No description provided for @priceOverview.
  ///
  /// In de, this message translates to:
  /// **'Preisübersicht'**
  String get priceOverview;

  /// No description provided for @confirmed.
  ///
  /// In de, this message translates to:
  /// **'Bestätigt'**
  String get confirmed;

  /// No description provided for @aboutWorkshop.
  ///
  /// In de, this message translates to:
  /// **'Über die Werkstatt'**
  String get aboutWorkshop;

  /// No description provided for @addressLabel.
  ///
  /// In de, this message translates to:
  /// **'Adresse'**
  String get addressLabel;

  /// No description provided for @yourVehicle.
  ///
  /// In de, this message translates to:
  /// **'Dein Fahrzeug'**
  String get yourVehicle;

  /// No description provided for @addVehicle.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeug hinzufügen'**
  String get addVehicle;

  /// No description provided for @openingHours.
  ///
  /// In de, this message translates to:
  /// **'Öffnungszeiten'**
  String get openingHours;

  /// No description provided for @noReviewsYet.
  ///
  /// In de, this message translates to:
  /// **'Noch keine Bewertungen vorhanden.'**
  String get noReviewsYet;

  /// No description provided for @workshopLoadError.
  ///
  /// In de, this message translates to:
  /// **'Werkstatt konnte nicht geladen werden'**
  String get workshopLoadError;

  /// No description provided for @clockSuffix.
  ///
  /// In de, this message translates to:
  /// **'Uhr'**
  String get clockSuffix;

  /// No description provided for @vehicles.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeuge'**
  String get vehicles;

  /// No description provided for @addVehicleButton.
  ///
  /// In de, this message translates to:
  /// **'Hinzufügen'**
  String get addVehicleButton;

  /// No description provided for @noVehicles.
  ///
  /// In de, this message translates to:
  /// **'Keine Fahrzeuge'**
  String get noVehicles;

  /// No description provided for @deleteVehicle.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeug löschen'**
  String get deleteVehicle;

  /// No description provided for @deleteVehicleConfirm.
  ///
  /// In de, this message translates to:
  /// **'„{brand} {model}“ wirklich löschen?'**
  String deleteVehicleConfirm(String brand, String model);

  /// No description provided for @vehicleDeleted.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeug gelöscht'**
  String get vehicleDeleted;

  /// No description provided for @deleteFailed.
  ///
  /// In de, this message translates to:
  /// **'Löschen fehlgeschlagen'**
  String get deleteFailed;

  /// No description provided for @editVehicle.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeug bearbeiten'**
  String get editVehicle;

  /// No description provided for @manufacturer.
  ///
  /// In de, this message translates to:
  /// **'Hersteller *'**
  String get manufacturer;

  /// No description provided for @manufacturerHint.
  ///
  /// In de, this message translates to:
  /// **'z.B. Yamaha, Kawasaki'**
  String get manufacturerHint;

  /// No description provided for @selectManufacturer.
  ///
  /// In de, this message translates to:
  /// **'Hersteller wählen'**
  String get selectManufacturer;

  /// No description provided for @model.
  ///
  /// In de, this message translates to:
  /// **'Modell *'**
  String get model;

  /// No description provided for @modelHint.
  ///
  /// In de, this message translates to:
  /// **'z.B. Golf, 3er, MT-07'**
  String get modelHint;

  /// No description provided for @year.
  ///
  /// In de, this message translates to:
  /// **'Baujahr *'**
  String get year;

  /// No description provided for @yearHint.
  ///
  /// In de, this message translates to:
  /// **'z.B. 2022'**
  String get yearHint;

  /// No description provided for @vinNumber.
  ///
  /// In de, this message translates to:
  /// **'Fahrgestellnummer (VIN)'**
  String get vinNumber;

  /// No description provided for @vinHint.
  ///
  /// In de, this message translates to:
  /// **'17 Zeichen'**
  String get vinHint;

  /// No description provided for @monthHint.
  ///
  /// In de, this message translates to:
  /// **'Monat'**
  String get monthHint;

  /// No description provided for @yearHintShort.
  ///
  /// In de, this message translates to:
  /// **'Jahr'**
  String get yearHintShort;

  /// No description provided for @tuevReminder.
  ///
  /// In de, this message translates to:
  /// **'An TÜV-Termin erinnern'**
  String get tuevReminder;

  /// No description provided for @reminderLabel.
  ///
  /// In de, this message translates to:
  /// **'Erinnerung'**
  String get reminderLabel;

  /// No description provided for @daysBeforeReminder7.
  ///
  /// In de, this message translates to:
  /// **'7 Tage vorher'**
  String get daysBeforeReminder7;

  /// No description provided for @daysBeforeReminder30.
  ///
  /// In de, this message translates to:
  /// **'30 Tage vorher'**
  String get daysBeforeReminder30;

  /// No description provided for @fuelHint.
  ///
  /// In de, this message translates to:
  /// **'Kraftstoff wählen'**
  String get fuelHint;

  /// No description provided for @tireSizeInfo.
  ///
  /// In de, this message translates to:
  /// **'Gib die Reifengrößen deines Fahrzeugs ein.'**
  String get tireSizeInfo;

  /// No description provided for @searchDots.
  ///
  /// In de, this message translates to:
  /// **'Suchen...'**
  String get searchDots;

  /// No description provided for @errorSavingVehicle.
  ///
  /// In de, this message translates to:
  /// **'Fehler beim Speichern: {error}'**
  String errorSavingVehicle(String error);

  /// No description provided for @apply.
  ///
  /// In de, this message translates to:
  /// **'Übernehmen'**
  String get apply;

  /// No description provided for @scanned.
  ///
  /// In de, this message translates to:
  /// **'Gescannt: {value}'**
  String scanned(String value);

  /// No description provided for @scanAgain.
  ///
  /// In de, this message translates to:
  /// **'Erneut scannen'**
  String get scanAgain;

  /// No description provided for @tireSizeSelected.
  ///
  /// In de, this message translates to:
  /// **'Reifengröße ausgewählt'**
  String get tireSizeSelected;

  /// No description provided for @otherSize.
  ///
  /// In de, this message translates to:
  /// **'Andere Größe'**
  String get otherSize;

  /// No description provided for @noCameraAvailable.
  ///
  /// In de, this message translates to:
  /// **'Keine Kamera verfügbar'**
  String get noCameraAvailable;

  /// No description provided for @aiAdvisorSpeechInitError.
  ///
  /// In de, this message translates to:
  /// **'Spracherkennung konnte nicht initialisiert werden.'**
  String get aiAdvisorSpeechInitError;

  /// No description provided for @aiAdvisorVoiceModeError.
  ///
  /// In de, this message translates to:
  /// **'Fehler beim Starten des Sprachmodus: {error}'**
  String aiAdvisorVoiceModeError(String error);

  /// No description provided for @speechOutputOn.
  ///
  /// In de, this message translates to:
  /// **'Sprachausgabe an'**
  String get speechOutputOn;

  /// No description provided for @speechOutputOff.
  ///
  /// In de, this message translates to:
  /// **'Sprachausgabe aus'**
  String get speechOutputOff;

  /// No description provided for @deleteChat.
  ///
  /// In de, this message translates to:
  /// **'Chat löschen'**
  String get deleteChat;

  /// No description provided for @findWorkshopWithTire.
  ///
  /// In de, this message translates to:
  /// **'Werkstatt mit diesem Reifen finden'**
  String get findWorkshopWithTire;

  /// No description provided for @findWorkshopWithBothTires.
  ///
  /// In de, this message translates to:
  /// **'Werkstatt mit beiden Reifen finden'**
  String get findWorkshopWithBothTires;

  /// No description provided for @findWorkshopWithFrontTire.
  ///
  /// In de, this message translates to:
  /// **'Werkstatt mit Vorderreifen finden'**
  String get findWorkshopWithFrontTire;

  /// No description provided for @findWorkshopWithRearTire.
  ///
  /// In de, this message translates to:
  /// **'Werkstatt mit Hinterreifen finden'**
  String get findWorkshopWithRearTire;

  /// No description provided for @findWorkshop.
  ///
  /// In de, this message translates to:
  /// **'Werkstatt finden'**
  String get findWorkshop;

  /// No description provided for @askMeSomething.
  ///
  /// In de, this message translates to:
  /// **'Frag mich etwas...'**
  String get askMeSomething;

  /// No description provided for @micPermissionNeeded.
  ///
  /// In de, this message translates to:
  /// **'Mikrofon-Berechtigung benötigt. Bitte in den Einstellungen aktivieren.'**
  String get micPermissionNeeded;

  /// No description provided for @speechPermissionNeeded.
  ///
  /// In de, this message translates to:
  /// **'Spracherkennung-Berechtigung benötigt. Bitte in den Einstellungen aktivieren.'**
  String get speechPermissionNeeded;

  /// No description provided for @rolloGreeting.
  ///
  /// In de, this message translates to:
  /// **'Rollo begrüßt dich...'**
  String get rolloGreeting;

  /// No description provided for @rolloIntro.
  ///
  /// In de, this message translates to:
  /// **'Hallo! Ich bin Rollo, dein Reifenberater. Ich sehe, du fährst einen {vehicle}. Wie kann ich dir helfen?'**
  String rolloIntro(String vehicle);

  /// No description provided for @listening.
  ///
  /// In de, this message translates to:
  /// **'Ich höre zu...'**
  String get listening;

  /// No description provided for @speechNotAvailable.
  ///
  /// In de, this message translates to:
  /// **'Spracherkennung nicht verfügbar'**
  String get speechNotAvailable;

  /// No description provided for @vehicleSelected.
  ///
  /// In de, this message translates to:
  /// **'{vehicle} ausgewählt! 🚗\nReifengröße: **{tireSize}**'**
  String vehicleSelected(String vehicle, String tireSize);

  /// No description provided for @noVehicleAdded.
  ///
  /// In de, this message translates to:
  /// **'Du hast noch kein Fahrzeug angelegt. Bitte füge zuerst ein Fahrzeug unter **Fahrzeuge** hinzu, damit ich dir Reifen empfehlen kann.'**
  String get noVehicleAdded;

  /// No description provided for @whichVehicle.
  ///
  /// In de, this message translates to:
  /// **'Für welches Fahrzeug brauchst du Hilfe?'**
  String get whichVehicle;

  /// No description provided for @recommendTires.
  ///
  /// In de, this message translates to:
  /// **'Ich möchte eine Reifen-Empfehlung'**
  String get recommendTires;

  /// No description provided for @showNearbyWorkshops.
  ///
  /// In de, this message translates to:
  /// **'Zeig mir Werkstätten in meiner Nähe'**
  String get showNearbyWorkshops;

  /// No description provided for @tireNotStored.
  ///
  /// In de, this message translates to:
  /// **'nicht hinterlegt'**
  String get tireNotStored;

  /// No description provided for @locationCouldNotBeDetermined.
  ///
  /// In de, this message translates to:
  /// **'Standort konnte nicht ermittelt werden. Bitte prüfe deine GPS-Einstellungen.'**
  String get locationCouldNotBeDetermined;

  /// No description provided for @stripeNotConfigured.
  ///
  /// In de, this message translates to:
  /// **'Stripe ist nicht konfiguriert. Bitte versuche es später erneut.'**
  String get stripeNotConfigured;

  /// No description provided for @notificationsDescription.
  ///
  /// In de, this message translates to:
  /// **'Benachrichtigungen für Buchungen und Updates'**
  String get notificationsDescription;

  /// No description provided for @workshopBookings.
  ///
  /// In de, this message translates to:
  /// **'Buchungen'**
  String get workshopBookings;

  /// No description provided for @noBookingsEmoji.
  ///
  /// In de, this message translates to:
  /// **'📋'**
  String get noBookingsEmoji;

  /// No description provided for @errorLabel.
  ///
  /// In de, this message translates to:
  /// **'Fehler: {error}'**
  String errorLabel(String error);

  /// No description provided for @workshopCalendar.
  ///
  /// In de, this message translates to:
  /// **'Kalender'**
  String get workshopCalendar;

  /// No description provided for @noAppointments.
  ///
  /// In de, this message translates to:
  /// **'📭'**
  String get noAppointments;

  /// No description provided for @workshopDashboard.
  ///
  /// In de, this message translates to:
  /// **'Dashboard'**
  String get workshopDashboard;

  /// No description provided for @loadingError.
  ///
  /// In de, this message translates to:
  /// **'Fehler beim Laden'**
  String get loadingError;

  /// No description provided for @rotateScreen.
  ///
  /// In de, this message translates to:
  /// **'Bildschirm drehen'**
  String get rotateScreen;

  /// No description provided for @tapToSwitch.
  ///
  /// In de, this message translates to:
  /// **'Tippen zum Wechseln ›'**
  String get tapToSwitch;

  /// No description provided for @reviewsCount.
  ///
  /// In de, this message translates to:
  /// **'{count} Bewertungen'**
  String reviewsCount(int count);

  /// No description provided for @workshopProfile.
  ///
  /// In de, this message translates to:
  /// **'Profil'**
  String get workshopProfile;

  /// No description provided for @shareLink.
  ///
  /// In de, this message translates to:
  /// **'Seite teilen'**
  String get shareLink;

  /// No description provided for @qrCode.
  ///
  /// In de, this message translates to:
  /// **'QR-Code'**
  String get qrCode;

  /// No description provided for @vacation.
  ///
  /// In de, this message translates to:
  /// **'Urlaubszeit'**
  String get vacation;

  /// No description provided for @addVacation.
  ///
  /// In de, this message translates to:
  /// **'Urlaubszeit hinzufügen'**
  String get addVacation;

  /// No description provided for @vacationReason.
  ///
  /// In de, this message translates to:
  /// **'Grund (optional)'**
  String get vacationReason;

  /// No description provided for @vacationReasonHint.
  ///
  /// In de, this message translates to:
  /// **'z.B. Betriebsferien'**
  String get vacationReasonHint;

  /// No description provided for @vacationSaved.
  ///
  /// In de, this message translates to:
  /// **'Urlaubszeit gespeichert ✅'**
  String get vacationSaved;

  /// No description provided for @deleteVacation.
  ///
  /// In de, this message translates to:
  /// **'Urlaubszeit löschen?'**
  String get deleteVacation;

  /// No description provided for @deleteVacationConfirm.
  ///
  /// In de, this message translates to:
  /// **'Diese Urlaubszeit wird unwiderruflich gelöscht.'**
  String get deleteVacationConfirm;

  /// No description provided for @vacationDeleted.
  ///
  /// In de, this message translates to:
  /// **'Urlaubszeit gelöscht'**
  String get vacationDeleted;

  /// No description provided for @reviewReplyHint.
  ///
  /// In de, this message translates to:
  /// **'Ihre Antwort...'**
  String get reviewReplyHint;

  /// No description provided for @replySaved.
  ///
  /// In de, this message translates to:
  /// **'Antwort gespeichert ✅'**
  String get replySaved;

  /// No description provided for @sendReply.
  ///
  /// In de, this message translates to:
  /// **'Antwort senden'**
  String get sendReply;

  /// No description provided for @reply.
  ///
  /// In de, this message translates to:
  /// **'Antworten'**
  String get reply;

  /// No description provided for @serviceNotAvailable.
  ///
  /// In de, this message translates to:
  /// **'Service nicht verfügbar'**
  String get serviceNotAvailable;

  /// No description provided for @completeProfileButton.
  ///
  /// In de, this message translates to:
  /// **'Profil vervollständigen'**
  String get completeProfileButton;

  /// No description provided for @locationSettings.
  ///
  /// In de, this message translates to:
  /// **'Standort-Einstellungen'**
  String get locationSettings;

  /// No description provided for @callNow.
  ///
  /// In de, this message translates to:
  /// **'Jetzt anrufen'**
  String get callNow;

  /// No description provided for @wheelWash.
  ///
  /// In de, this message translates to:
  /// **'Räder waschen'**
  String get wheelWash;

  /// No description provided for @foreignObjectRepair.
  ///
  /// In de, this message translates to:
  /// **'Fremdkörper-Reparatur'**
  String get foreignObjectRepair;

  /// No description provided for @confirmed_status.
  ///
  /// In de, this message translates to:
  /// **'Bestätigt'**
  String get confirmed_status;

  /// No description provided for @madeInDeutschland.
  ///
  /// In de, this message translates to:
  /// **'Made with ❤️ in Deutschland'**
  String get madeInDeutschland;

  /// No description provided for @openSourceLicenses.
  ///
  /// In de, this message translates to:
  /// **'Open-Source-Lizenzen'**
  String get openSourceLicenses;

  /// No description provided for @contact.
  ///
  /// In de, this message translates to:
  /// **'Kontakt'**
  String get contact;

  /// No description provided for @companyInfo.
  ///
  /// In de, this message translates to:
  /// **'Firmeninformationen'**
  String get companyInfo;

  /// No description provided for @followUs.
  ///
  /// In de, this message translates to:
  /// **'Folge uns'**
  String get followUs;

  /// No description provided for @mission.
  ///
  /// In de, this message translates to:
  /// **'Unsere Mission'**
  String get mission;

  /// No description provided for @homeTitle.
  ///
  /// In de, this message translates to:
  /// **'Startseite'**
  String get homeTitle;

  /// No description provided for @profile.
  ///
  /// In de, this message translates to:
  /// **'Profil'**
  String get profile;

  /// No description provided for @reviews.
  ///
  /// In de, this message translates to:
  /// **'Bewertungen'**
  String get reviews;

  /// No description provided for @voiceMode.
  ///
  /// In de, this message translates to:
  /// **'Sprach-Modus'**
  String get voiceMode;

  /// No description provided for @scanDocument.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeugschein scannen'**
  String get scanDocument;

  /// No description provided for @mixedTires.
  ///
  /// In de, this message translates to:
  /// **'Mischbereifung'**
  String get mixedTires;

  /// No description provided for @welcomeDesc3.
  ///
  /// In de, this message translates to:
  /// **'Unser intelligenter Assistent hilft dir bei der Reifenwahl und beantwortet alle Fragen rund ums Fahrzeug.'**
  String get welcomeDesc3;

  /// No description provided for @emergencyTitle.
  ///
  /// In de, this message translates to:
  /// **'Pannen-Modus'**
  String get emergencyTitle;

  /// No description provided for @nearbyWorkshops.
  ///
  /// In de, this message translates to:
  /// **'Werkstätten in der Nähe'**
  String get nearbyWorkshops;

  /// No description provided for @haveAccount.
  ///
  /// In de, this message translates to:
  /// **'Ich habe schon ein Account'**
  String get haveAccount;

  /// No description provided for @registerAtB24.
  ///
  /// In de, this message translates to:
  /// **'Jetzt bei Bereifung24 registrieren'**
  String get registerAtB24;

  /// No description provided for @vehicleRecognized.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeug erkannt!'**
  String get vehicleRecognized;

  /// No description provided for @acceptData.
  ///
  /// In de, this message translates to:
  /// **'Daten übernehmen'**
  String get acceptData;

  /// No description provided for @serviceOffers.
  ///
  /// In de, this message translates to:
  /// **'Serviceangebote'**
  String get serviceOffers;

  /// No description provided for @viewAll.
  ///
  /// In de, this message translates to:
  /// **'Alle →'**
  String get viewAll;

  /// No description provided for @whatIsPlanned.
  ///
  /// In de, this message translates to:
  /// **'Was steht heute an?'**
  String get whatIsPlanned;

  /// No description provided for @emergencyHelp.
  ///
  /// In de, this message translates to:
  /// **'Pannenhilfe'**
  String get emergencyHelp;

  /// No description provided for @findWorkshopNow.
  ///
  /// In de, this message translates to:
  /// **'Werkstatt sofort finden'**
  String get findWorkshopNow;

  /// No description provided for @locationFound.
  ///
  /// In de, this message translates to:
  /// **'Standort gefunden!'**
  String get locationFound;

  /// No description provided for @locatingPosition2.
  ///
  /// In de, this message translates to:
  /// **'Standort wird ermittelt...'**
  String get locatingPosition2;

  /// No description provided for @searchingNearby.
  ///
  /// In de, this message translates to:
  /// **'Wir suchen Werkstätten in deiner Nähe...'**
  String get searchingNearby;

  /// No description provided for @retryLocating.
  ///
  /// In de, this message translates to:
  /// **'Erneut versuchen'**
  String get retryLocating;

  /// No description provided for @manualEntry.
  ///
  /// In de, this message translates to:
  /// **'Manuell eingeben →'**
  String get manualEntry;

  /// No description provided for @flatLay.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeugschein flach hinlegen'**
  String get flatLay;

  /// No description provided for @language.
  ///
  /// In de, this message translates to:
  /// **'Sprache'**
  String get language;

  /// No description provided for @addressMissing.
  ///
  /// In de, this message translates to:
  /// **'Adresse fehlt'**
  String get addressMissing;

  /// No description provided for @addressMissingDesc.
  ///
  /// In de, this message translates to:
  /// **'Bitte hinterlege deine Adresse, um Werkstätten in deiner Nähe zu finden und Termine buchen zu können.'**
  String get addressMissingDesc;

  /// No description provided for @yourAiAdvisor.
  ///
  /// In de, this message translates to:
  /// **'Dein KI-Berater!'**
  String get yourAiAdvisor;

  /// No description provided for @serviceTireChange.
  ///
  /// In de, this message translates to:
  /// **'Reifen-\nwechsel'**
  String get serviceTireChange;

  /// No description provided for @serviceWheelChange.
  ///
  /// In de, this message translates to:
  /// **'Räder-\nwechsel'**
  String get serviceWheelChange;

  /// No description provided for @serviceTireRepair.
  ///
  /// In de, this message translates to:
  /// **'Reifen-\nreparatur'**
  String get serviceTireRepair;

  /// No description provided for @serviceAlignment.
  ///
  /// In de, this message translates to:
  /// **'Achsver-\nmessung'**
  String get serviceAlignment;

  /// No description provided for @serviceMotorcycleTire.
  ///
  /// In de, this message translates to:
  /// **'Motorrad-\nReifen'**
  String get serviceMotorcycleTire;

  /// No description provided for @serviceClimate.
  ///
  /// In de, this message translates to:
  /// **'Klima-\nservice'**
  String get serviceClimate;

  /// No description provided for @winterTireSeason.
  ///
  /// In de, this message translates to:
  /// **'Winterreifen-Saison'**
  String get winterTireSeason;

  /// No description provided for @summerTireSeason.
  ///
  /// In de, this message translates to:
  /// **'Sommerreifen-Saison'**
  String get summerTireSeason;

  /// No description provided for @winterSeasonTip.
  ///
  /// In de, this message translates to:
  /// **'Von O bis O: Oktober bis Ostern. Jetzt Winterreifen aufziehen lassen!'**
  String get winterSeasonTip;

  /// No description provided for @summerSeasonTip.
  ///
  /// In de, this message translates to:
  /// **'Zeit für den Wechsel! Jetzt Termin sichern bevor es voll wird.'**
  String get summerSeasonTip;

  /// No description provided for @co2SavingsTitle.
  ///
  /// In de, this message translates to:
  /// **'Deine CO₂-Einsparung durch Online-Buchungen'**
  String get co2SavingsTitle;

  /// No description provided for @co2BasedOnVehicle.
  ///
  /// In de, this message translates to:
  /// **'Basierend auf deinen Fahrzeugdaten'**
  String get co2BasedOnVehicle;

  /// No description provided for @co2TripsSaved.
  ///
  /// In de, this message translates to:
  /// **'Fahrten\ngespart'**
  String get co2TripsSaved;

  /// No description provided for @co2KmAvoided.
  ///
  /// In de, this message translates to:
  /// **'Fahrtwege\nvermieden'**
  String get co2KmAvoided;

  /// No description provided for @co2Saved.
  ///
  /// In de, this message translates to:
  /// **'CO₂\neingespart'**
  String get co2Saved;

  /// No description provided for @co2FuelSaved.
  ///
  /// In de, this message translates to:
  /// **'Kraftstoff\ngespart'**
  String get co2FuelSaved;

  /// No description provided for @switchVehicle.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeug wechseln'**
  String get switchVehicle;

  /// No description provided for @addAVehicle.
  ///
  /// In de, this message translates to:
  /// **'Füge ein Fahrzeug hinzu'**
  String get addAVehicle;

  /// No description provided for @forPersonalizedRec.
  ///
  /// In de, this message translates to:
  /// **'für personalisierte Empfehlungen'**
  String get forPersonalizedRec;

  /// No description provided for @appForCustomersOnly.
  ///
  /// In de, this message translates to:
  /// **'Diese App ist für Kunden. Für die Werkstattverwaltung nutze bitte das Web-Dashboard.'**
  String get appForCustomersOnly;

  /// No description provided for @trailerServiceOnly.
  ///
  /// In de, this message translates to:
  /// **'Für Anhänger ist nur der Reifenservice verfügbar.'**
  String get trailerServiceOnly;

  /// No description provided for @sortUpcoming.
  ///
  /// In de, this message translates to:
  /// **'Kommender Termin'**
  String get sortUpcoming;

  /// No description provided for @sortPrice.
  ///
  /// In de, this message translates to:
  /// **'Preis'**
  String get sortPrice;

  /// No description provided for @sortBookedDate.
  ///
  /// In de, this message translates to:
  /// **'Buchungsdatum'**
  String get sortBookedDate;

  /// No description provided for @bookingsLoadError.
  ///
  /// In de, this message translates to:
  /// **'Termine konnten nicht geladen werden'**
  String get bookingsLoadError;

  /// No description provided for @noBookingsDesc.
  ///
  /// In de, this message translates to:
  /// **'Du hast noch keine Buchungen. Suche eine Werkstatt und buche deinen ersten Termin!'**
  String get noBookingsDesc;

  /// No description provided for @myVehicles.
  ///
  /// In de, this message translates to:
  /// **'Meine Fahrzeuge'**
  String get myVehicles;

  /// No description provided for @vehiclesLoadError.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeuge konnten nicht geladen werden'**
  String get vehiclesLoadError;

  /// No description provided for @noVehiclesDesc.
  ///
  /// In de, this message translates to:
  /// **'Füge dein erstes Fahrzeug hinzu, um schneller buchen zu können.'**
  String get noVehiclesDesc;

  /// No description provided for @buildYear.
  ///
  /// In de, this message translates to:
  /// **'Bj. {year}'**
  String buildYear(String year);

  /// No description provided for @tireSummer.
  ///
  /// In de, this message translates to:
  /// **'Sommer'**
  String get tireSummer;

  /// No description provided for @tireWinter.
  ///
  /// In de, this message translates to:
  /// **'Winter'**
  String get tireWinter;

  /// No description provided for @tireAllSeason.
  ///
  /// In de, this message translates to:
  /// **'Ganzjahr'**
  String get tireAllSeason;

  /// No description provided for @daysCount.
  ///
  /// In de, this message translates to:
  /// **'{count} Tage'**
  String daysCount(String count);

  /// No description provided for @locationFailedPermission.
  ///
  /// In de, this message translates to:
  /// **'Standort konnte nicht ermittelt werden.\nBitte aktiviere die Standortfreigabe.'**
  String get locationFailedPermission;

  /// No description provided for @errorOccurred.
  ///
  /// In de, this message translates to:
  /// **'Ein Fehler ist aufgetreten.'**
  String get errorOccurred;

  /// No description provided for @workshopsFoundNearby.
  ///
  /// In de, this message translates to:
  /// **'{count} Werkstatt in deiner Nähe gefunden'**
  String workshopsFoundNearby(String count);

  /// No description provided for @workshopsFoundNearbyPlural.
  ///
  /// In de, this message translates to:
  /// **'{count} Werkstätten in deiner Nähe gefunden'**
  String workshopsFoundNearbyPlural(String count);

  /// No description provided for @noWorkshopsNearby.
  ///
  /// In de, this message translates to:
  /// **'Keine Werkstätten in der Nähe gefunden'**
  String get noWorkshopsNearby;

  /// No description provided for @emergencyBottomHint.
  ///
  /// In de, this message translates to:
  /// **'Rufe die Werkstatt an und vereinbare eine Soforthilfe. Deinen nächsten Service kannst du danach direkt über B24 buchen.'**
  String get emergencyBottomHint;

  /// No description provided for @noWorkshopsIn25km.
  ///
  /// In de, this message translates to:
  /// **'Leider gibt es keine Werkstätten in 25 km Umkreis.'**
  String get noWorkshopsIn25km;

  /// No description provided for @emergencyNumbers.
  ///
  /// In de, this message translates to:
  /// **'Notfall-Nummern'**
  String get emergencyNumbers;

  /// No description provided for @policeEmergency.
  ///
  /// In de, this message translates to:
  /// **'Polizei / Notruf'**
  String get policeEmergency;

  /// No description provided for @openStatus.
  ///
  /// In de, this message translates to:
  /// **'Geöffnet'**
  String get openStatus;

  /// No description provided for @closedStatus.
  ///
  /// In de, this message translates to:
  /// **'Geschlossen'**
  String get closedStatus;

  /// No description provided for @callAnyway.
  ///
  /// In de, this message translates to:
  /// **'Trotzdem anrufen'**
  String get callAnyway;

  /// No description provided for @legal.
  ///
  /// In de, this message translates to:
  /// **'Rechtliches'**
  String get legal;

  /// No description provided for @termsOfService.
  ///
  /// In de, this message translates to:
  /// **'AGB'**
  String get termsOfService;

  /// No description provided for @imprint.
  ///
  /// In de, this message translates to:
  /// **'Impressum'**
  String get imprint;

  /// No description provided for @noName.
  ///
  /// In de, this message translates to:
  /// **'Kein Name'**
  String get noName;

  /// No description provided for @requiredField.
  ///
  /// In de, this message translates to:
  /// **'Pflichtfeld'**
  String get requiredField;

  /// No description provided for @minEightChars.
  ///
  /// In de, this message translates to:
  /// **'Mindestens 8 Zeichen'**
  String get minEightChars;

  /// No description provided for @confirmPasswordLabel.
  ///
  /// In de, this message translates to:
  /// **'Passwort bestätigen'**
  String get confirmPasswordLabel;

  /// No description provided for @passwordsDoNotMatch.
  ///
  /// In de, this message translates to:
  /// **'Passwörter stimmen nicht überein'**
  String get passwordsDoNotMatch;

  /// No description provided for @currentPasswordWrong.
  ///
  /// In de, this message translates to:
  /// **'Aktuelles Passwort ist falsch'**
  String get currentPasswordWrong;

  /// No description provided for @passwordChangeError.
  ///
  /// In de, this message translates to:
  /// **'Fehler beim Ändern des Passworts'**
  String get passwordChangeError;

  /// No description provided for @changeButton.
  ///
  /// In de, this message translates to:
  /// **'Ändern'**
  String get changeButton;

  /// No description provided for @deleteAccountWarning.
  ///
  /// In de, this message translates to:
  /// **'Dein Konto und alle Daten werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.'**
  String get deleteAccountWarning;

  /// No description provided for @speechInitFailed.
  ///
  /// In de, this message translates to:
  /// **'Spracherkennung konnte nicht initialisiert werden.'**
  String get speechInitFailed;

  /// No description provided for @rolloThinking.
  ///
  /// In de, this message translates to:
  /// **'Rollo denkt nach...'**
  String get rolloThinking;

  /// No description provided for @speechNotAvailableMsg.
  ///
  /// In de, this message translates to:
  /// **'Spracherkennung nicht verfügbar'**
  String get speechNotAvailableMsg;

  /// No description provided for @tireRecommendation.
  ///
  /// In de, this message translates to:
  /// **'Reifen-Empfehlung'**
  String get tireRecommendation;

  /// No description provided for @appHelp.
  ///
  /// In de, this message translates to:
  /// **'App-Hilfe'**
  String get appHelp;

  /// No description provided for @askFreely.
  ///
  /// In de, this message translates to:
  /// **'Frei fragen'**
  String get askFreely;

  /// No description provided for @vehicleTypeCar.
  ///
  /// In de, this message translates to:
  /// **'Auto'**
  String get vehicleTypeCar;

  /// No description provided for @vehicleTypeMotorcycle.
  ///
  /// In de, this message translates to:
  /// **'Motorrad'**
  String get vehicleTypeMotorcycle;

  /// No description provided for @vehicleTypeTrailer.
  ///
  /// In de, this message translates to:
  /// **'Anhänger'**
  String get vehicleTypeTrailer;

  /// No description provided for @fuelPetrol.
  ///
  /// In de, this message translates to:
  /// **'Benzin'**
  String get fuelPetrol;

  /// No description provided for @fuelDiesel.
  ///
  /// In de, this message translates to:
  /// **'Diesel'**
  String get fuelDiesel;

  /// No description provided for @fuelElectric.
  ///
  /// In de, this message translates to:
  /// **'Elektrisch'**
  String get fuelElectric;

  /// No description provided for @fuelHybrid.
  ///
  /// In de, this message translates to:
  /// **'Hybrid'**
  String get fuelHybrid;

  /// No description provided for @fuelPluginHybrid.
  ///
  /// In de, this message translates to:
  /// **'Plug-in Hybrid'**
  String get fuelPluginHybrid;

  /// No description provided for @fuelLpg.
  ///
  /// In de, this message translates to:
  /// **'Autogas (LPG)'**
  String get fuelLpg;

  /// No description provided for @fuelCng.
  ///
  /// In de, this message translates to:
  /// **'Erdgas (CNG)'**
  String get fuelCng;

  /// No description provided for @searchHint.
  ///
  /// In de, this message translates to:
  /// **'Suchen...'**
  String get searchHint;

  /// No description provided for @vehicleUpdated.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeug aktualisiert'**
  String get vehicleUpdated;

  /// No description provided for @vehicleAdded.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeug hinzugefügt'**
  String get vehicleAdded;

  /// No description provided for @tireSizes.
  ///
  /// In de, this message translates to:
  /// **'Reifengrößen'**
  String get tireSizes;

  /// No description provided for @tireSizesDesc.
  ///
  /// In de, this message translates to:
  /// **'Gib die Reifengrößen deines Fahrzeugs ein.'**
  String get tireSizesDesc;

  /// No description provided for @scanVehicleDoc.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeugschein scannen'**
  String get scanVehicleDoc;

  /// No description provided for @autoFillData.
  ///
  /// In de, this message translates to:
  /// **'Alle Fahrzeugdaten automatisch ausfüllen'**
  String get autoFillData;

  /// No description provided for @tireSizeRecognized.
  ///
  /// In de, this message translates to:
  /// **'Reifengröße aus Fahrzeugschein erkannt'**
  String get tireSizeRecognized;

  /// No description provided for @tireSizeNotRecognized.
  ///
  /// In de, this message translates to:
  /// **'Reifengröße nicht erkannt'**
  String get tireSizeNotRecognized;

  /// No description provided for @fuelTypeLabel.
  ///
  /// In de, this message translates to:
  /// **'Kraftstoffart'**
  String get fuelTypeLabel;

  /// No description provided for @selectFuel.
  ///
  /// In de, this message translates to:
  /// **'Kraftstoff wählen'**
  String get selectFuel;

  /// No description provided for @inspectionDate.
  ///
  /// In de, this message translates to:
  /// **'TÜV-Termin'**
  String get inspectionDate;

  /// No description provided for @inspectionReminder.
  ///
  /// In de, this message translates to:
  /// **'An TÜV-Termin erinnern'**
  String get inspectionReminder;

  /// No description provided for @noReminder.
  ///
  /// In de, this message translates to:
  /// **'Keine Erinnerung'**
  String get noReminder;

  /// No description provided for @daysBefore.
  ///
  /// In de, this message translates to:
  /// **'{days} Tage vorher'**
  String daysBefore(String days);

  /// No description provided for @frontWheel.
  ///
  /// In de, this message translates to:
  /// **'Vorderrad'**
  String get frontWheel;

  /// No description provided for @rearWheel.
  ///
  /// In de, this message translates to:
  /// **'Hinterrad'**
  String get rearWheel;

  /// No description provided for @differentFrontRear.
  ///
  /// In de, this message translates to:
  /// **'Unterschiedliche Vorder-/Hinterreifen'**
  String get differentFrontRear;

  /// No description provided for @mixedTireSizesLabel.
  ///
  /// In de, this message translates to:
  /// **'Mischbereifung (unterschiedliche Größen)'**
  String get mixedTireSizesLabel;

  /// No description provided for @summerTiresLabel.
  ///
  /// In de, this message translates to:
  /// **'Sommerreifen'**
  String get summerTiresLabel;

  /// No description provided for @winterTiresLabel.
  ///
  /// In de, this message translates to:
  /// **'Winterreifen'**
  String get winterTiresLabel;

  /// No description provided for @allSeasonTiresLabel.
  ///
  /// In de, this message translates to:
  /// **'Ganzjahresreifen'**
  String get allSeasonTiresLabel;

  /// No description provided for @onboardingTitle1.
  ///
  /// In de, this message translates to:
  /// **'Reifenservice zum Festpreis'**
  String get onboardingTitle1;

  /// No description provided for @onboardingDesc1.
  ///
  /// In de, this message translates to:
  /// **'Finde den passenden Reifenservice in deiner Nähe und buche bequem online – zum garantierten Festpreis.'**
  String get onboardingDesc1;

  /// No description provided for @onboardingTitle2.
  ///
  /// In de, this message translates to:
  /// **'Schnell & einfach buchen'**
  String get onboardingTitle2;

  /// No description provided for @onboardingDesc2.
  ///
  /// In de, this message translates to:
  /// **'Wähle deinen Wunschtermin, vergleiche Werkstätten und buche in unter 2 Minuten – alles in einer App.'**
  String get onboardingDesc2;

  /// No description provided for @onboardingTitle3.
  ///
  /// In de, this message translates to:
  /// **'Dein persönlicher KI-Berater'**
  String get onboardingTitle3;

  /// No description provided for @onboardingDesc3.
  ///
  /// In de, this message translates to:
  /// **'Unser intelligenter Assistent hilft dir bei der Reifenwahl und beantwortet alle Fragen rund ums Fahrzeug.'**
  String get onboardingDesc3;

  /// No description provided for @searchForWorkshops.
  ///
  /// In de, this message translates to:
  /// **'Suche nach Werkstätten'**
  String get searchForWorkshops;

  /// No description provided for @searchForWorkshopsDesc.
  ///
  /// In de, this message translates to:
  /// **'Gib eine PLZ oder Stadt ein, um Werkstätten in deiner Nähe zu finden.'**
  String get searchForWorkshopsDesc;

  /// No description provided for @locationNotDetermined.
  ///
  /// In de, this message translates to:
  /// **'Standort konnte nicht ermittelt werden. Bitte gib eine PLZ ein.'**
  String get locationNotDetermined;

  /// No description provided for @searchFailed.
  ///
  /// In de, this message translates to:
  /// **'Suche fehlgeschlagen. Bitte versuche es erneut.'**
  String get searchFailed;

  /// No description provided for @today.
  ///
  /// In de, this message translates to:
  /// **'Heute'**
  String get today;

  /// No description provided for @tomorrow.
  ///
  /// In de, this message translates to:
  /// **'Morgen'**
  String get tomorrow;

  /// No description provided for @inDaysCount.
  ///
  /// In de, this message translates to:
  /// **'In {days} Tagen'**
  String inDaysCount(String days);

  /// No description provided for @breakdownHelp.
  ///
  /// In de, this message translates to:
  /// **'Pannenhilfe'**
  String get breakdownHelp;

  /// No description provided for @tapToSpeak.
  ///
  /// In de, this message translates to:
  /// **'Tippe zum Sprechen'**
  String get tapToSpeak;

  /// No description provided for @aiErrorMessage.
  ///
  /// In de, this message translates to:
  /// **'Entschuldigung, da ist etwas schiefgelaufen. Bitte versuche es nochmal.'**
  String get aiErrorMessage;

  /// No description provided for @noVehicleForAi.
  ///
  /// In de, this message translates to:
  /// **'Du hast noch kein Fahrzeug angelegt. Füge ein Fahrzeug hinzu für personalisierte Empfehlungen.'**
  String get noVehicleForAi;

  /// No description provided for @noPhoneNumber.
  ///
  /// In de, this message translates to:
  /// **'Keine Telefonnummer hinterlegt'**
  String get noPhoneNumber;

  /// No description provided for @closedToday.
  ///
  /// In de, this message translates to:
  /// **'Heute geschlossen'**
  String get closedToday;

  /// No description provided for @closesAt.
  ///
  /// In de, this message translates to:
  /// **'Schließt um {time} Uhr'**
  String closesAt(String time);

  /// No description provided for @opensAt.
  ///
  /// In de, this message translates to:
  /// **'Öffnet um {time} Uhr'**
  String opensAt(String time);

  /// No description provided for @hintModel.
  ///
  /// In de, this message translates to:
  /// **'z.B. Golf, 3er, MT-07'**
  String get hintModel;

  /// No description provided for @invalidYear.
  ///
  /// In de, this message translates to:
  /// **'Ungültiges Jahr'**
  String get invalidYear;

  /// No description provided for @loggedInAs.
  ///
  /// In de, this message translates to:
  /// **'Angemeldet als {role}'**
  String loggedInAs(String role);

  /// No description provided for @helloUser.
  ///
  /// In de, this message translates to:
  /// **'Hallo, {name}!'**
  String helloUser(String name);

  /// No description provided for @saveError.
  ///
  /// In de, this message translates to:
  /// **'Fehler beim Speichern'**
  String get saveError;

  /// No description provided for @monthLabel.
  ///
  /// In de, this message translates to:
  /// **'Monat'**
  String get monthLabel;

  /// No description provided for @yearLabel.
  ///
  /// In de, this message translates to:
  /// **'Jahr'**
  String get yearLabel;

  /// No description provided for @serviceOnlyCarTrailer.
  ///
  /// In de, this message translates to:
  /// **'Dieser Service ist nur für PKW/Anhänger verfügbar.'**
  String get serviceOnlyCarTrailer;

  /// No description provided for @selectMotorcycleFirst.
  ///
  /// In de, this message translates to:
  /// **'Bitte wähle ein Motorrad als Fahrzeug.'**
  String get selectMotorcycleFirst;

  /// No description provided for @adacBreakdown.
  ///
  /// In de, this message translates to:
  /// **'ADAC Pannenhilfe'**
  String get adacBreakdown;

  /// No description provided for @opensOnDay.
  ///
  /// In de, this message translates to:
  /// **'Öffnet {day} {time}'**
  String opensOnDay(String day, String time);

  /// No description provided for @hintYear.
  ///
  /// In de, this message translates to:
  /// **'z.B. 2022'**
  String get hintYear;

  /// No description provided for @hintLicensePlate.
  ///
  /// In de, this message translates to:
  /// **'z.B. M-AB 1234'**
  String get hintLicensePlate;

  /// No description provided for @rolloInitialGreeting.
  ///
  /// In de, this message translates to:
  /// **'Hallo! 👋 Ich bin **Rollo**, dein KI-Reifen-Berater. Wie kann ich dir helfen?'**
  String get rolloInitialGreeting;

  /// No description provided for @voiceModeError.
  ///
  /// In de, this message translates to:
  /// **'Fehler beim Starten des Sprachmodus'**
  String get voiceModeError;

  /// No description provided for @rolloSpeaking.
  ///
  /// In de, this message translates to:
  /// **'Rollo spricht...'**
  String get rolloSpeaking;

  /// No description provided for @noResponseReceived.
  ///
  /// In de, this message translates to:
  /// **'Keine Antwort erhalten.'**
  String get noResponseReceived;

  /// No description provided for @chipRecommendMsg.
  ///
  /// In de, this message translates to:
  /// **'Ich möchte eine Reifen-Empfehlung'**
  String get chipRecommendMsg;

  /// No description provided for @chipHelpMsg.
  ///
  /// In de, this message translates to:
  /// **'Wie funktioniert die B24 App?'**
  String get chipHelpMsg;

  /// No description provided for @chipWorkshopMsg.
  ///
  /// In de, this message translates to:
  /// **'Zeig mir Werkstätten in meiner Nähe'**
  String get chipWorkshopMsg;

  /// No description provided for @chipFreeMsg.
  ///
  /// In de, this message translates to:
  /// **'Ich habe eine Frage zu Reifen'**
  String get chipFreeMsg;

  /// No description provided for @rolloIntroWithVehicle.
  ///
  /// In de, this message translates to:
  /// **'Hallo! Ich bin Rollo, dein Reifenberater. Ich sehe, du fährst einen {vehicle}. Wie kann ich dir helfen?'**
  String rolloIntroWithVehicle(String vehicle);

  /// No description provided for @rolloIntroGeneric.
  ///
  /// In de, this message translates to:
  /// **'Hallo! Ich bin Rollo, dein Reifenberater. Wie kann ich dir helfen?'**
  String get rolloIntroGeneric;

  /// No description provided for @tireNotStoredLabel.
  ///
  /// In de, this message translates to:
  /// **'nicht hinterlegt'**
  String get tireNotStoredLabel;

  /// No description provided for @otherBrand.
  ///
  /// In de, this message translates to:
  /// **'Sonstige'**
  String get otherBrand;

  /// No description provided for @tireTabSummer.
  ///
  /// In de, this message translates to:
  /// **'☀️ Sommer'**
  String get tireTabSummer;

  /// No description provided for @tireTabWinter.
  ///
  /// In de, this message translates to:
  /// **'❄️ Winter'**
  String get tireTabWinter;

  /// No description provided for @tireTabAllSeason.
  ///
  /// In de, this message translates to:
  /// **'🌦️ Ganzjahr'**
  String get tireTabAllSeason;

  /// No description provided for @tireValidationError.
  ///
  /// In de, this message translates to:
  /// **'{label}: Tragfähigkeit und Geschwindigkeitsindex sind Pflichtfelder'**
  String tireValidationError(String label);

  /// No description provided for @tireValidationErrorRear.
  ///
  /// In de, this message translates to:
  /// **'{label} (Hinterachse): Tragfähigkeit und Geschwindigkeitsindex sind Pflichtfelder'**
  String tireValidationErrorRear(String label);

  /// No description provided for @fieldsRecognized.
  ///
  /// In de, this message translates to:
  /// **'{count} Felder erkannt und übernommen'**
  String fieldsRecognized(int count);

  /// No description provided for @tireSizeApplyHint.
  ///
  /// In de, this message translates to:
  /// **'Diese Größe ist die zugelassene Bereifung laut Fahrzeugschein. Drücke \"Übernehmen\", um sie einzutragen.'**
  String get tireSizeApplyHint;

  /// No description provided for @tireSizeInvalidHint.
  ///
  /// In de, this message translates to:
  /// **'Die gescannte Reifengröße stimmt nicht mit den verfügbaren Werten überein. Bitte scanne den Fahrzeugschein erneut oder gib die Reifengröße von Hand ein.'**
  String get tireSizeInvalidHint;

  /// No description provided for @searchMyLocation.
  ///
  /// In de, this message translates to:
  /// **'Mein Standort'**
  String get searchMyLocation;

  /// No description provided for @searchFindNearby.
  ///
  /// In de, this message translates to:
  /// **'Werkstatt in deiner Nähe finden'**
  String get searchFindNearby;

  /// No description provided for @searchSettings.
  ///
  /// In de, this message translates to:
  /// **'Einstellungen'**
  String get searchSettings;

  /// No description provided for @workshopCountOne.
  ///
  /// In de, this message translates to:
  /// **'1 Werkstatt'**
  String get workshopCountOne;

  /// No description provided for @workshopCountMany.
  ///
  /// In de, this message translates to:
  /// **'{count} Werkstätten'**
  String workshopCountMany(int count);

  /// No description provided for @sortDistance.
  ///
  /// In de, this message translates to:
  /// **'Entfernung'**
  String get sortDistance;

  /// No description provided for @sortRating.
  ///
  /// In de, this message translates to:
  /// **'Bewertung'**
  String get sortRating;

  /// No description provided for @withTires.
  ///
  /// In de, this message translates to:
  /// **'Mit Reifen'**
  String get withTires;

  /// No description provided for @montageOnly.
  ///
  /// In de, this message translates to:
  /// **'Nur Montage'**
  String get montageOnly;

  /// No description provided for @tireCount2.
  ///
  /// In de, this message translates to:
  /// **'2 Reifen'**
  String get tireCount2;

  /// No description provided for @tireCount4.
  ///
  /// In de, this message translates to:
  /// **'4 Reifen'**
  String get tireCount4;

  /// No description provided for @disposal.
  ///
  /// In de, this message translates to:
  /// **'Entsorgung'**
  String get disposal;

  /// No description provided for @runflat.
  ///
  /// In de, this message translates to:
  /// **'Runflat'**
  String get runflat;

  /// No description provided for @threepmsfLabel.
  ///
  /// In de, this message translates to:
  /// **'3PMSF'**
  String get threepmsfLabel;

  /// No description provided for @categoryCheapest.
  ///
  /// In de, this message translates to:
  /// **'Günstigster'**
  String get categoryCheapest;

  /// No description provided for @categoryBest.
  ///
  /// In de, this message translates to:
  /// **'Beste Eigensch.'**
  String get categoryBest;

  /// No description provided for @categoryPremium.
  ///
  /// In de, this message translates to:
  /// **'Premium'**
  String get categoryPremium;

  /// No description provided for @categoryCheapestBadge.
  ///
  /// In de, this message translates to:
  /// **'💰 Günstigster'**
  String get categoryCheapestBadge;

  /// No description provided for @categoryPremiumBadge.
  ///
  /// In de, this message translates to:
  /// **'⭐ Premium'**
  String get categoryPremiumBadge;

  /// No description provided for @categoryBestBadge.
  ///
  /// In de, this message translates to:
  /// **'👍 Beste Eigenschaften'**
  String get categoryBestBadge;

  /// No description provided for @frontTire.
  ///
  /// In de, this message translates to:
  /// **'Vorderreifen'**
  String get frontTire;

  /// No description provided for @rearTire.
  ///
  /// In de, this message translates to:
  /// **'Hinterreifen'**
  String get rearTire;

  /// No description provided for @bothTires.
  ///
  /// In de, this message translates to:
  /// **'Beide'**
  String get bothTires;

  /// No description provided for @oldTireDisposal.
  ///
  /// In de, this message translates to:
  /// **'♻️ Altreifenentsorgung'**
  String get oldTireDisposal;

  /// No description provided for @motoOwnTiresHint.
  ///
  /// In de, this message translates to:
  /// **'💡 Sie bringen Ihre eigenen Motorradreifen mit. Räder müssen ausgebaut zur Werkstatt gebracht werden.'**
  String get motoOwnTiresHint;

  /// No description provided for @radial.
  ///
  /// In de, this message translates to:
  /// **'Radial'**
  String get radial;

  /// No description provided for @radialDesc.
  ///
  /// In de, this message translates to:
  /// **'Standard für moderne Motorräder'**
  String get radialDesc;

  /// No description provided for @diagonal.
  ///
  /// In de, this message translates to:
  /// **'Diagonal'**
  String get diagonal;

  /// No description provided for @diagonalDesc.
  ///
  /// In de, this message translates to:
  /// **'Chopper, Enduro & Oldtimer'**
  String get diagonalDesc;

  /// No description provided for @additionalOptions.
  ///
  /// In de, this message translates to:
  /// **'Zusätzliche Optionen'**
  String get additionalOptions;

  /// No description provided for @balancing.
  ///
  /// In de, this message translates to:
  /// **'Auswuchten'**
  String get balancing;

  /// No description provided for @storage.
  ///
  /// In de, this message translates to:
  /// **'Einlagerung'**
  String get storage;

  /// No description provided for @washing.
  ///
  /// In de, this message translates to:
  /// **'Waschen'**
  String get washing;

  /// No description provided for @aiRecommendation.
  ///
  /// In de, this message translates to:
  /// **'KI-Empfehlung'**
  String get aiRecommendation;

  /// No description provided for @montageLabel.
  ///
  /// In de, this message translates to:
  /// **'Montage'**
  String get montageLabel;

  /// No description provided for @runflatSurcharge.
  ///
  /// In de, this message translates to:
  /// **'RunFlat-Zuschlag'**
  String get runflatSurcharge;

  /// No description provided for @balancing4Wheels.
  ///
  /// In de, this message translates to:
  /// **'Auswuchten (4 Räder)'**
  String get balancing4Wheels;

  /// No description provided for @oldTireDisposalLabel.
  ///
  /// In de, this message translates to:
  /// **'Altreifenentsorgung'**
  String get oldTireDisposalLabel;

  /// No description provided for @extraServices.
  ///
  /// In de, this message translates to:
  /// **'Zusatzleistungen'**
  String get extraServices;

  /// No description provided for @baseLabel.
  ///
  /// In de, this message translates to:
  /// **'Basis'**
  String get baseLabel;

  /// No description provided for @tiresFallback.
  ///
  /// In de, this message translates to:
  /// **'Reifen'**
  String get tiresFallback;

  /// No description provided for @totalWithPrice.
  ///
  /// In de, this message translates to:
  /// **'Gesamt {price}€'**
  String totalWithPrice(String price);

  /// No description provided for @tiresAvailable.
  ///
  /// In de, this message translates to:
  /// **'Reifen verfügbar'**
  String get tiresAvailable;

  /// No description provided for @noTiresLabel.
  ///
  /// In de, this message translates to:
  /// **'Keine Reifen'**
  String get noTiresLabel;

  /// No description provided for @fixedPrice.
  ///
  /// In de, this message translates to:
  /// **'Festpreis {price}€'**
  String fixedPrice(String price);

  /// No description provided for @priceOnRequest.
  ///
  /// In de, this message translates to:
  /// **'Preis auf Anfrage'**
  String get priceOnRequest;

  /// No description provided for @newBadge.
  ///
  /// In de, this message translates to:
  /// **'Neu'**
  String get newBadge;

  /// No description provided for @moreTiresAvailable.
  ///
  /// In de, this message translates to:
  /// **'Weitere Reifen bei dieser Werkstatt verfügbar'**
  String get moreTiresAvailable;

  /// No description provided for @noMatchingTires.
  ///
  /// In de, this message translates to:
  /// **'Keine passenden Reifen verfügbar'**
  String get noMatchingTires;

  /// No description provided for @noMatchingMotoTires.
  ///
  /// In de, this message translates to:
  /// **'Keine passenden Motorradreifen verfügbar'**
  String get noMatchingMotoTires;

  /// No description provided for @selectVehicleForPrices.
  ///
  /// In de, this message translates to:
  /// **'Wähle oben dein Fahrzeug, um Preise zu sehen'**
  String get selectVehicleForPrices;

  /// No description provided for @addVehicleForPrices.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeug hinzufügen, um Preise zu sehen'**
  String get addVehicleForPrices;

  /// No description provided for @selectVehicleForPricesShort.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeug wählen für Preise'**
  String get selectVehicleForPricesShort;

  /// No description provided for @axleSelect.
  ///
  /// In de, this message translates to:
  /// **'Achse wählen'**
  String get axleSelect;

  /// No description provided for @axleSelectDesc.
  ///
  /// In de, this message translates to:
  /// **'Dein Fahrzeug hat Mischbereifung. Bitte wähle Vorderachse oder Hinterachse, um Werkstätten zu finden.'**
  String get axleSelectDesc;

  /// No description provided for @noWorkshopsFound.
  ///
  /// In de, this message translates to:
  /// **'Keine Werkstätten gefunden'**
  String get noWorkshopsFound;

  /// No description provided for @tryDifferentSearch.
  ///
  /// In de, this message translates to:
  /// **'Versuche einen anderen Suchbegriff oder erweitere den Radius.'**
  String get tryDifferentSearch;

  /// No description provided for @noWinterSize.
  ///
  /// In de, this message translates to:
  /// **'Keine Winterreifengröße gespeichert. Bitte hinterlege die Größe in deinem Fahrzeugprofil.'**
  String get noWinterSize;

  /// No description provided for @noAllSeasonSize.
  ///
  /// In de, this message translates to:
  /// **'Keine Ganzjahresreifengröße gespeichert. Bitte hinterlege die Größe in deinem Fahrzeugprofil.'**
  String get noAllSeasonSize;

  /// No description provided for @noSummerSize.
  ///
  /// In de, this message translates to:
  /// **'Keine Sommerreifengröße gespeichert. Bitte hinterlege die Größe in deinem Fahrzeugprofil.'**
  String get noSummerSize;

  /// No description provided for @brakeService.
  ///
  /// In de, this message translates to:
  /// **'Bremsendienst'**
  String get brakeService;

  /// No description provided for @batteryService.
  ///
  /// In de, this message translates to:
  /// **'Batterieservice'**
  String get batteryService;

  /// No description provided for @alignMeasureBoth.
  ///
  /// In de, this message translates to:
  /// **'📐 Vermessung — Beide Achsen'**
  String get alignMeasureBoth;

  /// No description provided for @alignMeasureFront.
  ///
  /// In de, this message translates to:
  /// **'📐 Vermessung — Vorderachse'**
  String get alignMeasureFront;

  /// No description provided for @alignMeasureRear.
  ///
  /// In de, this message translates to:
  /// **'📐 Vermessung — Hinterachse'**
  String get alignMeasureRear;

  /// No description provided for @alignAdjustBoth.
  ///
  /// In de, this message translates to:
  /// **'🔧 Einstellung — Beide Achsen'**
  String get alignAdjustBoth;

  /// No description provided for @alignAdjustFront.
  ///
  /// In de, this message translates to:
  /// **'🔧 Einstellung — Vorderachse'**
  String get alignAdjustFront;

  /// No description provided for @alignAdjustRear.
  ///
  /// In de, this message translates to:
  /// **'🔧 Einstellung — Hinterachse'**
  String get alignAdjustRear;

  /// No description provided for @alignFullService.
  ///
  /// In de, this message translates to:
  /// **'⭐ Komplett mit Inspektion'**
  String get alignFullService;

  /// No description provided for @alignDescMeasureBoth.
  ///
  /// In de, this message translates to:
  /// **'Komplette Vermessung von Spur, Sturz und Nachlauf an beiden Achsen'**
  String get alignDescMeasureBoth;

  /// No description provided for @alignDescMeasureFront.
  ///
  /// In de, this message translates to:
  /// **'Vermessung der Vorderachse inkl. Spur und Sturz'**
  String get alignDescMeasureFront;

  /// No description provided for @alignDescMeasureRear.
  ///
  /// In de, this message translates to:
  /// **'Vermessung der Hinterachse inkl. Spur und Sturz'**
  String get alignDescMeasureRear;

  /// No description provided for @alignDescAdjustBoth.
  ///
  /// In de, this message translates to:
  /// **'Komplette Vermessung und Einstellung beider Achsen'**
  String get alignDescAdjustBoth;

  /// No description provided for @alignDescAdjustFront.
  ///
  /// In de, this message translates to:
  /// **'Vermessung und präzise Einstellung der Vorderachse'**
  String get alignDescAdjustFront;

  /// No description provided for @alignDescAdjustRear.
  ///
  /// In de, this message translates to:
  /// **'Vermessung und präzise Einstellung der Hinterachse'**
  String get alignDescAdjustRear;

  /// No description provided for @alignDescFullService.
  ///
  /// In de, this message translates to:
  /// **'Achsvermessung, Einstellung und vollständiger Fahrwerks-Check'**
  String get alignDescFullService;

  /// No description provided for @repairForeignObject.
  ///
  /// In de, this message translates to:
  /// **'Fremdkörper'**
  String get repairForeignObject;

  /// No description provided for @repairValveDamage.
  ///
  /// In de, this message translates to:
  /// **'Ventilschaden'**
  String get repairValveDamage;

  /// No description provided for @repairDescForeignObject.
  ///
  /// In de, this message translates to:
  /// **'Professionelle Reparatur bei Nagel, Schraube oder anderen Fremdkörpern im Reifen'**
  String get repairDescForeignObject;

  /// No description provided for @repairDescValveDamage.
  ///
  /// In de, this message translates to:
  /// **'Austausch oder Reparatur eines defekten Reifenventils'**
  String get repairDescValveDamage;

  /// No description provided for @climateCheck.
  ///
  /// In de, this message translates to:
  /// **'🔍 Basis-Check'**
  String get climateCheck;

  /// No description provided for @climateBasic.
  ///
  /// In de, this message translates to:
  /// **'❄️ Standard-Service'**
  String get climateBasic;

  /// No description provided for @climateComfort.
  ///
  /// In de, this message translates to:
  /// **'🌡️ Komfort-Service'**
  String get climateComfort;

  /// No description provided for @climatePremium.
  ///
  /// In de, this message translates to:
  /// **'⭐ Premium-Service'**
  String get climatePremium;

  /// No description provided for @climateDescCheck.
  ///
  /// In de, this message translates to:
  /// **'Sichtprüfung der Klimaanlage, Funktionstest und Temperaturmessung'**
  String get climateDescCheck;

  /// No description provided for @climateDescBasic.
  ///
  /// In de, this message translates to:
  /// **'Funktionscheck, Druckprüfung und Kältemittel-Nachfüllung'**
  String get climateDescBasic;

  /// No description provided for @climateDescComfort.
  ///
  /// In de, this message translates to:
  /// **'Standard-Service inkl. Kältemittel-Wechsel und Desinfektion'**
  String get climateDescComfort;

  /// No description provided for @climateDescPremium.
  ///
  /// In de, this message translates to:
  /// **'Kompletter Service: Kältemittel, Filter, Desinfektion und Leistungstest'**
  String get climateDescPremium;

  /// No description provided for @pkgMeasureFront.
  ///
  /// In de, this message translates to:
  /// **'Messung vorne'**
  String get pkgMeasureFront;

  /// No description provided for @pkgMeasureRear.
  ///
  /// In de, this message translates to:
  /// **'Messung hinten'**
  String get pkgMeasureRear;

  /// No description provided for @pkgMeasureBoth.
  ///
  /// In de, this message translates to:
  /// **'Messung beide Achsen'**
  String get pkgMeasureBoth;

  /// No description provided for @pkgAdjustFront.
  ///
  /// In de, this message translates to:
  /// **'Einstellung vorne'**
  String get pkgAdjustFront;

  /// No description provided for @pkgAdjustRear.
  ///
  /// In de, this message translates to:
  /// **'Einstellung hinten'**
  String get pkgAdjustRear;

  /// No description provided for @pkgAdjustBoth.
  ///
  /// In de, this message translates to:
  /// **'Einstellung beide Achsen'**
  String get pkgAdjustBoth;

  /// No description provided for @pkgFullService.
  ///
  /// In de, this message translates to:
  /// **'Komplett-Service'**
  String get pkgFullService;

  /// No description provided for @pkgForeignObject.
  ///
  /// In de, this message translates to:
  /// **'Fremdkörper-Reparatur'**
  String get pkgForeignObject;

  /// No description provided for @pkgValveDamage.
  ///
  /// In de, this message translates to:
  /// **'Ventilschaden'**
  String get pkgValveDamage;

  /// No description provided for @pkgClimateCheck.
  ///
  /// In de, this message translates to:
  /// **'Klima-Check'**
  String get pkgClimateCheck;

  /// No description provided for @pkgBasicService.
  ///
  /// In de, this message translates to:
  /// **'Basis-Service'**
  String get pkgBasicService;

  /// No description provided for @pkgComfortService.
  ///
  /// In de, this message translates to:
  /// **'Comfort-Service'**
  String get pkgComfortService;

  /// No description provided for @pkgPremiumService.
  ///
  /// In de, this message translates to:
  /// **'Premium-Service'**
  String get pkgPremiumService;

  /// No description provided for @pkgFrontWheel.
  ///
  /// In de, this message translates to:
  /// **'Vorderrad'**
  String get pkgFrontWheel;

  /// No description provided for @pkgRearWheel.
  ///
  /// In de, this message translates to:
  /// **'Hinterrad'**
  String get pkgRearWheel;

  /// No description provided for @pkgBothWheels.
  ///
  /// In de, this message translates to:
  /// **'Beide Räder'**
  String get pkgBothWheels;

  /// No description provided for @pkgMontage4.
  ///
  /// In de, this message translates to:
  /// **'Montage (4 Reifen)'**
  String get pkgMontage4;

  /// No description provided for @pkgMontage2.
  ///
  /// In de, this message translates to:
  /// **'Montage (2 Reifen)'**
  String get pkgMontage2;

  /// No description provided for @missingTireSizeTitle.
  ///
  /// In de, this message translates to:
  /// **'Keine {season}-Größe gespeichert'**
  String missingTireSizeTitle(String season);

  /// No description provided for @missingTireSizeDesc.
  ///
  /// In de, this message translates to:
  /// **'Um {season} zu suchen, hinterlege bitte die passende Reifengröße in deinem Fahrzeugprofil.'**
  String missingTireSizeDesc(String season);

  /// No description provided for @storeTireSizeButton.
  ///
  /// In de, this message translates to:
  /// **'{season}-Größe hinterlegen'**
  String storeTireSizeButton(String season);

  /// No description provided for @reviewsCountLabel.
  ///
  /// In de, this message translates to:
  /// **'({count} Bewertungen)'**
  String reviewsCountLabel(int count);

  /// No description provided for @vehicleLoadError.
  ///
  /// In de, this message translates to:
  /// **'Fahrzeuge konnten nicht geladen werden'**
  String get vehicleLoadError;

  /// No description provided for @errorServiceCarOnly.
  ///
  /// In de, this message translates to:
  /// **'Dieser Service ist nur für PKW/Anhänger verfügbar. Bitte wähle \"Motorrad-Reifen\" als Service.'**
  String get errorServiceCarOnly;

  /// No description provided for @errorNeedMotorcycle.
  ///
  /// In de, this message translates to:
  /// **'Bitte wähle ein Motorrad als Fahrzeug, um Motorrad-Reifen zu suchen.'**
  String get errorNeedMotorcycle;

  /// No description provided for @errorTrailerTireOnly.
  ///
  /// In de, this message translates to:
  /// **'Für Anhänger ist nur der Reifenservice (Reifenwechsel / Räderwechsel) verfügbar.'**
  String get errorTrailerTireOnly;

  /// No description provided for @errorLocationFailed.
  ///
  /// In de, this message translates to:
  /// **'Standort konnte nicht ermittelt werden. Bitte gib eine PLZ ein.'**
  String get errorLocationFailed;

  /// No description provided for @errorSearchFailed.
  ///
  /// In de, this message translates to:
  /// **'Suche fehlgeschlagen. Bitte versuche es erneut.'**
  String get errorSearchFailed;

  /// No description provided for @selectWidth.
  ///
  /// In de, this message translates to:
  /// **'Breite wählen (mm):'**
  String get selectWidth;

  /// No description provided for @selectAspectRatio.
  ///
  /// In de, this message translates to:
  /// **'Querschnitt wählen (%):'**
  String get selectAspectRatio;

  /// No description provided for @selectRimSize.
  ///
  /// In de, this message translates to:
  /// **'Felgengröße wählen (Zoll):'**
  String get selectRimSize;

  /// No description provided for @selectLoadIndex.
  ///
  /// In de, this message translates to:
  /// **'Tragfähigkeit wählen:'**
  String get selectLoadIndex;

  /// No description provided for @selectSpeedIndex.
  ///
  /// In de, this message translates to:
  /// **'Geschwindigkeitsindex wählen:'**
  String get selectSpeedIndex;

  /// No description provided for @availableTimes.
  ///
  /// In de, this message translates to:
  /// **'Verfügbare Uhrzeiten'**
  String get availableTimes;

  /// No description provided for @selectedTire.
  ///
  /// In de, this message translates to:
  /// **'Ausgewählter Reifen'**
  String get selectedTire;

  /// No description provided for @selectedTireAxle.
  ///
  /// In de, this message translates to:
  /// **'Ausgewählter Reifen – {axle}'**
  String selectedTireAxle(String axle);

  /// No description provided for @tireRecommendations.
  ///
  /// In de, this message translates to:
  /// **'Reifenempfehlungen'**
  String get tireRecommendations;

  /// No description provided for @tireRecommendationsAxle.
  ///
  /// In de, this message translates to:
  /// **'Reifenempfehlungen – {axle}'**
  String tireRecommendationsAxle(String axle);

  /// No description provided for @encryptedPayment.
  ///
  /// In de, this message translates to:
  /// **'Verschlüsselte & sichere Zahlung über Stripe'**
  String get encryptedPayment;

  /// No description provided for @bookingAgreementPrefix.
  ///
  /// In de, this message translates to:
  /// **'Mit der Buchung stimmst du unseren '**
  String get bookingAgreementPrefix;

  /// No description provided for @termsLink.
  ///
  /// In de, this message translates to:
  /// **'AGBs'**
  String get termsLink;

  /// No description provided for @andThe.
  ///
  /// In de, this message translates to:
  /// **' und der '**
  String get andThe;

  /// No description provided for @agreementSuffix.
  ///
  /// In de, this message translates to:
  /// **' zu.'**
  String get agreementSuffix;

  /// No description provided for @bookAndPay.
  ///
  /// In de, this message translates to:
  /// **'Jetzt buchen & bezahlen – {price} €'**
  String bookAndPay(String price);

  /// No description provided for @bookBinding.
  ///
  /// In de, this message translates to:
  /// **'Jetzt verbindlich buchen'**
  String get bookBinding;

  /// No description provided for @bookingInProgress.
  ///
  /// In de, this message translates to:
  /// **'Wird gebucht...'**
  String get bookingInProgress;

  /// No description provided for @creditCard.
  ///
  /// In de, this message translates to:
  /// **'Kreditkarte'**
  String get creditCard;

  /// No description provided for @pleaseSelectService.
  ///
  /// In de, this message translates to:
  /// **'Bitte Service wählen'**
  String get pleaseSelectService;

  /// No description provided for @pleaseSelectTires.
  ///
  /// In de, this message translates to:
  /// **'Bitte Reifen wählen'**
  String get pleaseSelectTires;

  /// No description provided for @pleaseSelectBothTires.
  ///
  /// In de, this message translates to:
  /// **'Bitte VA + HA Reifen wählen'**
  String get pleaseSelectBothTires;

  /// No description provided for @pleaseAddVehicle.
  ///
  /// In de, this message translates to:
  /// **'Bitte Fahrzeug hinzufügen'**
  String get pleaseAddVehicle;

  /// No description provided for @pleaseSelectDate.
  ///
  /// In de, this message translates to:
  /// **'Bitte Datum wählen'**
  String get pleaseSelectDate;

  /// No description provided for @pleaseSelectTime.
  ///
  /// In de, this message translates to:
  /// **'Bitte Uhrzeit wählen'**
  String get pleaseSelectTime;

  /// No description provided for @bookAppointmentAt.
  ///
  /// In de, this message translates to:
  /// **'Termin buchen – {time}'**
  String bookAppointmentAt(String time);

  /// No description provided for @bookTireAndMontageAt.
  ///
  /// In de, this message translates to:
  /// **'Reifen & Montage buchen – {time}'**
  String bookTireAndMontageAt(String time);

  /// No description provided for @reviewsLoadError.
  ///
  /// In de, this message translates to:
  /// **'Bewertungen konnten nicht geladen werden'**
  String get reviewsLoadError;

  /// No description provided for @payButtonLabel.
  ///
  /// In de, this message translates to:
  /// **'Bezahlen'**
  String get payButtonLabel;

  /// No description provided for @paymentTookTooLong.
  ///
  /// In de, this message translates to:
  /// **'Zahlung hat zu lange gedauert. Bitte versuche es erneut.'**
  String get paymentTookTooLong;

  /// No description provided for @feedbackQuestion.
  ///
  /// In de, this message translates to:
  /// **'Wie zufrieden bist du mit Bereifung24?'**
  String get feedbackQuestion;

  /// No description provided for @feedbackSubtitle.
  ///
  /// In de, this message translates to:
  /// **'Deine Meinung ist uns wichtig! Bewerte uns und hinterlasse optional einen Kommentar.'**
  String get feedbackSubtitle;

  /// No description provided for @commentOptional.
  ///
  /// In de, this message translates to:
  /// **'Kommentar (optional)'**
  String get commentOptional;

  /// No description provided for @sending.
  ///
  /// In de, this message translates to:
  /// **'Wird gesendet...'**
  String get sending;

  /// No description provided for @sendFeedback.
  ///
  /// In de, this message translates to:
  /// **'Feedback senden'**
  String get sendFeedback;

  /// No description provided for @thankYou.
  ///
  /// In de, this message translates to:
  /// **'Vielen Dank!'**
  String get thankYou;

  /// No description provided for @feedbackThankYou.
  ///
  /// In de, this message translates to:
  /// **'Dein Feedback hilft uns, Bereifung24 noch besser zu machen.'**
  String get feedbackThankYou;

  /// No description provided for @ratingVeryBad.
  ///
  /// In de, this message translates to:
  /// **'Sehr schlecht'**
  String get ratingVeryBad;

  /// No description provided for @ratingBad.
  ///
  /// In de, this message translates to:
  /// **'Schlecht'**
  String get ratingBad;

  /// No description provided for @ratingOkay.
  ///
  /// In de, this message translates to:
  /// **'Okay'**
  String get ratingOkay;

  /// No description provided for @ratingGood.
  ///
  /// In de, this message translates to:
  /// **'Gut'**
  String get ratingGood;

  /// No description provided for @ratingExcellent.
  ///
  /// In de, this message translates to:
  /// **'Ausgezeichnet'**
  String get ratingExcellent;

  /// No description provided for @submitReview.
  ///
  /// In de, this message translates to:
  /// **'Bewertung absenden'**
  String get submitReview;

  /// No description provided for @rateLater.
  ///
  /// In de, this message translates to:
  /// **'Später bewerten'**
  String get rateLater;

  /// No description provided for @reviewNotGood.
  ///
  /// In de, this message translates to:
  /// **'Nicht gut'**
  String get reviewNotGood;

  /// No description provided for @reviewExcellent.
  ///
  /// In de, this message translates to:
  /// **'Hervorragend'**
  String get reviewExcellent;

  /// No description provided for @paymentType.
  ///
  /// In de, this message translates to:
  /// **'Zahlungsart'**
  String get paymentType;

  /// No description provided for @paymentStatusLabel.
  ///
  /// In de, this message translates to:
  /// **'Zahlungsstatus'**
  String get paymentStatusLabel;

  /// No description provided for @basePrice.
  ///
  /// In de, this message translates to:
  /// **'Grundpreis'**
  String get basePrice;

  /// No description provided for @couponLabel.
  ///
  /// In de, this message translates to:
  /// **'Gutschein ({code})'**
  String couponLabel(String code);

  /// No description provided for @discountLabel.
  ///
  /// In de, this message translates to:
  /// **'Rabatt'**
  String get discountLabel;

  /// No description provided for @missionText.
  ///
  /// In de, this message translates to:
  /// **'Bereifung24 verbindet Autofahrer mit den besten Reifenwerkstätten in der Nähe. Wir machen Reifenwechsel, Montage und Service so einfach wie eine Online-Bestellung – transparent, fair und zuverlässig.'**
  String get missionText;

  /// No description provided for @balancingX4.
  ///
  /// In de, this message translates to:
  /// **'Auswuchten (×4)'**
  String get balancingX4;

  /// No description provided for @howWasYourVisit.
  ///
  /// In de, this message translates to:
  /// **'Wie war Ihr Besuch?'**
  String get howWasYourVisit;

  /// No description provided for @reviewHelpsOthers.
  ///
  /// In de, this message translates to:
  /// **'Bewerten Sie Ihren Termin und helfen Sie anderen Kunden bei der Suche.'**
  String get reviewHelpsOthers;

  /// No description provided for @reviewThankYou.
  ///
  /// In de, this message translates to:
  /// **'Ihre Bewertung hilft anderen Kunden bei der Werkstattsuche.'**
  String get reviewThankYou;

  /// No description provided for @pleaseSelectRating.
  ///
  /// In de, this message translates to:
  /// **'Bitte wähle eine Bewertung'**
  String get pleaseSelectRating;

  /// No description provided for @reviewTitle.
  ///
  /// In de, this message translates to:
  /// **'Bewertung'**
  String get reviewTitle;

  /// No description provided for @detailsCouldNotLoad.
  ///
  /// In de, this message translates to:
  /// **'Details konnten nicht geladen werden'**
  String get detailsCouldNotLoad;

  /// No description provided for @bookingLabel.
  ///
  /// In de, this message translates to:
  /// **'Buchung'**
  String get bookingLabel;

  /// No description provided for @bookingNumber.
  ///
  /// In de, this message translates to:
  /// **'Buchungs-Nr: {id}'**
  String bookingNumber(String id);

  /// No description provided for @durationLabel.
  ///
  /// In de, this message translates to:
  /// **'Dauer: ca. {minutes} Minuten'**
  String durationLabel(int minutes);

  /// No description provided for @tireSizeLabel.
  ///
  /// In de, this message translates to:
  /// **'Größe: {size}'**
  String tireSizeLabel(String size);

  /// No description provided for @tireQuantityLabel.
  ///
  /// In de, this message translates to:
  /// **'Anzahl: {count} Stück'**
  String tireQuantityLabel(int count);

  /// No description provided for @wheelWashing.
  ///
  /// In de, this message translates to:
  /// **'Räder waschen'**
  String get wheelWashing;

  /// No description provided for @rateWorkshopButton.
  ///
  /// In de, this message translates to:
  /// **'Werkstatt bewerten'**
  String get rateWorkshopButton;

  /// No description provided for @tagline.
  ///
  /// In de, this message translates to:
  /// **'Dein Reifenservice – einfach & schnell'**
  String get tagline;

  /// No description provided for @appointmentConfirmed.
  ///
  /// In de, this message translates to:
  /// **'Dein Termin wurde bestätigt'**
  String get appointmentConfirmed;

  /// No description provided for @waitingConfirmation.
  ///
  /// In de, this message translates to:
  /// **'Wartet auf Bestätigung der Werkstatt'**
  String get waitingConfirmation;

  /// No description provided for @beingProcessed.
  ///
  /// In de, this message translates to:
  /// **'Wird gerade bearbeitet'**
  String get beingProcessed;

  /// No description provided for @completedStatus.
  ///
  /// In de, this message translates to:
  /// **'Abgeschlossen'**
  String get completedStatus;

  /// No description provided for @appointmentCancelled.
  ///
  /// In de, this message translates to:
  /// **'Dieser Termin wurde storniert'**
  String get appointmentCancelled;

  /// No description provided for @errorSendingReview.
  ///
  /// In de, this message translates to:
  /// **'Fehler beim Senden. Bitte versuche es erneut.'**
  String get errorSendingReview;
}

class _SDelegate extends LocalizationsDelegate<S> {
  const _SDelegate();

  @override
  Future<S> load(Locale locale) {
    return SynchronousFuture<S>(lookupS(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>[
        'de',
        'en',
        'es',
        'fr',
        'it',
        'ru',
        'tr'
      ].contains(locale.languageCode);

  @override
  bool shouldReload(_SDelegate old) => false;
}

S lookupS(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'de':
      return SDe();
    case 'en':
      return SEn();
    case 'es':
      return SEs();
    case 'fr':
      return SFr();
    case 'it':
      return SIt();
    case 'ru':
      return SRu();
    case 'tr':
      return STr();
  }

  throw FlutterError(
      'S.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
