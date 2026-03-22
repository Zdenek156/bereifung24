class AuthTokens {
  final String accessToken;
  final String refreshToken;
  final Map<String, dynamic>? user;

  AuthTokens({
    required this.accessToken,
    required this.refreshToken,
    this.user,
  });

  factory AuthTokens.fromJson(Map<String, dynamic> json) => AuthTokens(
        accessToken: json['accessToken'] ?? '',
        refreshToken: json['refreshToken'] ?? '',
        user: json['user'] as Map<String, dynamic>?,
      );
}

class AppVersionInfo {
  final bool updateAvailable;
  final bool forceUpdate;
  final String? latestVersion;
  final String? minVersion;
  final String? updateUrl;
  final String? releaseNotes;

  AppVersionInfo({
    this.updateAvailable = false,
    this.forceUpdate = false,
    this.latestVersion,
    this.minVersion,
    this.updateUrl,
    this.releaseNotes,
  });

  factory AppVersionInfo.fromJson(Map<String, dynamic> json) =>
      AppVersionInfo(
        updateAvailable: json['updateAvailable'] ?? false,
        forceUpdate: json['forceUpdate'] ?? false,
        latestVersion: json['latestVersion'],
        minVersion: json['minVersion'],
        updateUrl: json['updateUrl'],
        releaseNotes: json['releaseNotes'],
      );
}
