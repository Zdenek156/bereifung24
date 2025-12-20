import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// Professional button with modern design
class ProfessionalButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isLoading;
  final bool isOutlined;
  final Color? color;

  const ProfessionalButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.icon,
    this.isLoading = false,
    this.isOutlined = false,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final buttonColor = color ?? AppColors.primary;

    if (isOutlined) {
      return SizedBox(
        height: 56,
        width: double.infinity,
        child: OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          style: OutlinedButton.styleFrom(
            foregroundColor: buttonColor,
            side: BorderSide(
              color: buttonColor.withOpacity(0.5),
              width: 1.5,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child: isLoading
              ? SizedBox(
                  height: 24,
                  width: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(buttonColor),
                  ),
                )
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (icon != null) ...[
                      Icon(icon),
                      const SizedBox(width: 8),
                    ],
                    Text(
                      text,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
        ),
      );
    }

    return SizedBox(
      height: 56,
      width: double.infinity,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: buttonColor,
          foregroundColor: Colors.white,
          elevation: 0,
          shadowColor: buttonColor.withOpacity(0.4),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ).copyWith(
          elevation: MaterialStateProperty.resolveWith<double>(
            (Set<MaterialState> states) {
              if (states.contains(MaterialState.pressed)) return 8;
              if (states.contains(MaterialState.hovered)) return 4;
              return 2;
            },
          ),
        ),
        child: isLoading
            ? const SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    Icon(icon),
                    const SizedBox(width: 8),
                  ],
                  Text(
                    text,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.3,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

/// Service card with modern design
class ServiceCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final String status;
  final VoidCallback onTap;
  final Widget? trailing;

  const ServiceCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.status,
    required this.onTap,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Row(
            children: [
              // Icon
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: _getStatusColor(status).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(
                  icon,
                  color: _getStatusColor(status),
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    StatusChip(status: status),
                  ],
                ),
              ),
              // Trailing
              trailing ??
                  const Icon(
                    Icons.chevron_right_rounded,
                    color: AppColors.textSecondary,
                  ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'offen':
        return AppColors.secondary;
      case 'confirmed':
      case 'bestätigt':
        return AppColors.success;
      case 'completed':
      case 'abgeschlossen':
        return AppColors.primary;
      case 'cancelled':
      case 'abgesagt':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }
}

/// Status chip with color coding
class StatusChip extends StatelessWidget {
  final String status;
  final IconData? icon;

  const StatusChip({
    super.key,
    required this.status,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: _getStatusColor(status).withOpacity(0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(
              icon,
              size: 14,
              color: _getStatusColor(status),
            ),
            const SizedBox(width: 4),
          ],
          Text(
            _getStatusText(status),
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: _getStatusColor(status),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'offen':
        return AppColors.secondary;
      case 'confirmed':
      case 'bestätigt':
        return AppColors.success;
      case 'completed':
      case 'abgeschlossen':
        return AppColors.primary;
      case 'cancelled':
      case 'abgesagt':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }

  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Offen';
      case 'confirmed':
        return 'Bestätigt';
      case 'completed':
        return 'Abgeschlossen';
      case 'cancelled':
        return 'Abgesagt';
      default:
        return status;
    }
  }
}

/// Professional text field
class ProfessionalTextField extends StatelessWidget {
  final String label;
  final String? hint;
  final IconData? icon;
  final TextEditingController? controller;
  final String? Function(String?)? validator;
  final TextInputType? keyboardType;
  final bool obscureText;
  final int? maxLines;
  final Widget? suffixIcon;

  const ProfessionalTextField({
    super.key,
    required this.label,
    this.hint,
    this.icon,
    this.controller,
    this.validator,
    this.keyboardType,
    this.obscureText = false,
    this.maxLines = 1,
    this.suffixIcon,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      validator: validator,
      keyboardType: keyboardType,
      obscureText: obscureText,
      maxLines: maxLines,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: icon != null ? Icon(icon, color: AppColors.primary) : null,
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: AppColors.background,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(
            color: AppColors.divider.withOpacity(0.3),
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(
            color: AppColors.primary,
            width: 2,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(
            color: AppColors.error,
            width: 1.5,
          ),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 18,
        ),
      ),
    );
  }
}