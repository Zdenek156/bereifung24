import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/professional_widgets.dart';
import '../../models/detailed_models.dart';
import '../../providers/app_providers.dart';

class OfferDetailsScreen extends ConsumerWidget {
  final String offerId;

  const OfferDetailsScreen({
    super.key,
    required this.offerId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offerAsync = ref.watch(offerByIdProvider(offerId));
    final acceptanceState = ref.watch(offerAcceptanceProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        elevation: 0,
        title: const Text(
          'Angebotsdetails',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            letterSpacing: -0.5,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: offerAsync.when(
        loading: () => Center(
          child: CircularProgressIndicator(
            color: AppColors.primary,
          ),
        ),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 60,
                color: AppColors.error,
              ),
              const SizedBox(height: 16),
              Text(
                'Fehler beim Laden',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Text(
                  error.toString(),
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
        data: (offer) => Stack(
          children: [
            SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Workshop Header
                  _buildWorkshopHeader(offer),
                  
                  // Price Summary
                  _buildPriceSummary(offer),
                  
                  // Tire Options
                  _buildTireOptions(context, ref, offer),
                  
                  // Storage Option
                  _buildStorageOption(context, ref, offer),
                  
                  // Commission Info
                  if (offer.commission != null) _buildCommissionInfo(offer.commission!),
                ],
              ),
            ),
            
            // Bottom Action Bar
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: _buildBottomBar(context, ref, offer, acceptanceState),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWorkshopHeader(Offer offer) {
    final workshop = offer.workshop;
    if (workshop == null) return const SizedBox.shrink();
    
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.primary,
            AppColors.primary.withOpacity(0.8),
          ],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.store_rounded,
                  size: 30,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      workshop.companyName,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: -0.5,
                      ),
                    ),
                    if (workshop.street != null && workshop.zipCode != null && workshop.city != null) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.location_on,
                            size: 16,
                            color: Colors.white.withOpacity(0.9),
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              '${workshop.street}, ${workshop.zipCode} ${workshop.city}',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.white.withOpacity(0.9),
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          if (workshop.phone != null && workshop.phone!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(
                  Icons.phone,
                  size: 16,
                  color: Colors.white.withOpacity(0.9),
                ),
                const SizedBox(width: 8),
                Text(
                  workshop.phone!,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPriceSummary(Offer offer) {
    return Container(
      margin: const EdgeInsets.all(20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.secondary.withOpacity(0.1),
            AppColors.secondary.withOpacity(0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.secondary.withOpacity(0.3),
          width: 2,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Gesamtpreis',
                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                _formatPrice(offer.totalPrice),
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  color: AppColors.secondary,
                  letterSpacing: -1,
                ),
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.success.withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.local_offer,
                  size: 16,
                  color: AppColors.success,
                ),
                const SizedBox(width: 6),
                Text(
                  'Bestes Angebot',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.success,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTireOptions(BuildContext context, WidgetRef ref, Offer offer) {
    final selectedIds = ref.watch(offerAcceptanceProvider).selectedTireOptionIds;
    final tireOptions = offer.tireOptions ?? [];
    
    if (tireOptions.isEmpty) return const SizedBox.shrink();
    
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Reifenoptionen',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Wählen Sie Ihre bevorzugten Reifen',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            )
          ),
          const SizedBox(height: 16),
          ...tireOptions.map((option) {
            final isSelected = selectedIds.contains(option.id);
            return GestureDetector(
              onTap: () {
                ref.read(offerAcceptanceProvider.notifier).toggleTireOption(option.id);
              },
              child: Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSelected ? AppColors.primary : Colors.transparent,
                    width: 2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isSelected ? AppColors.primary : AppColors.textSecondary,
                          width: 2,
                        ),
                        color: isSelected ? AppColors.primary : Colors.transparent,
                      ),
                      child: isSelected
                          ? const Icon(
                              Icons.check,
                              size: 16,
                              color: Colors.white,
                            )
                          : null,
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            option.brand,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            option.model,
                            style: TextStyle(
                              fontSize: 14,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              _buildSpecBadge(Icons.speed, option.speedRating),
                              const SizedBox(width: 8),
                              _buildSpecBadge(Icons.fitness_center, '${option.loadIndex}'),
                              if (option.isRunflat) ...[
                                const SizedBox(width: 8),
                                _buildSpecBadge(Icons.verified, 'Runflat'),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          _formatPrice(option.pricePerTire),
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: AppColors.secondary,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'pro Reifen',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildSpecBadge(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            size: 12,
            color: AppColors.primary,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStorageOption(BuildContext context, WidgetRef ref, Offer offer) {
    if (offer.storagePrice == null || offer.storagePrice! == 0) return const SizedBox.shrink();
    
    final wantsStorage = ref.watch(offerAcceptanceProvider).wantsStorage;
    
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      child: GestureDetector(
        onTap: () {
          ref.read(offerAcceptanceProvider.notifier).toggleStorage();
        },
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: wantsStorage ? AppColors.secondary : Colors.transparent,
              width: 2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: wantsStorage ? AppColors.secondary : AppColors.textSecondary,
                    width: 2,
                  ),
                  color: wantsStorage ? AppColors.secondary : Colors.transparent,
                ),
                child: wantsStorage
                    ? const Icon(
                        Icons.check,
                        size: 16,
                        color: Colors.white,
                      )
                    : null,
              ),
              const SizedBox(width: 16),
              Icon(
                Icons.storage_rounded,
                size: 32,
                color: AppColors.secondary,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Reifeneinlagerung',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Sichere Lagerung Ihrer Reifen',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Text(
                _formatPrice(offer.storagePrice!),
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: AppColors.secondary,
                  letterSpacing: -0.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCommissionInfo(Commission commission) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.primary.withOpacity(0.1),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.info_outline,
            size: 20,
            color: AppColors.primary,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Inkl. ${commission.percentage}% Servicegebühr (${_formatPrice(commission.amount)})',
              style: TextStyle(
                fontSize: 13,
                color: AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar(BuildContext context, WidgetRef ref, Offer offer, OfferAcceptanceState state) {
    final canAccept = state.selectedTireOptionIds.isNotEmpty;
    final workshop = offer.workshop;
    
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: ProfessionalButton(
          text: state.isLoading ? 'Wird angenommen...' : 'Angebot annehmen',
          icon: Icons.check_circle_rounded,
          onPressed: canAccept && !state.isLoading
              ? () {
                  _acceptOffer(context, ref, offer);
                }
              : null,
          isLoading: state.isLoading,
        ),
      ),
    );
  }

  void _acceptOffer(BuildContext context, WidgetRef ref, Offer offer) async {
    final workshop = offer.workshop;
    
    final result = await ref.read(offerAcceptanceProvider.notifier).acceptOffer(offer.id);
    
    if (context.mounted) {
      if (result != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Angebot erfolgreich angenommen!'),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
        // Navigate to booking screen
        Navigator.pushReplacementNamed(
          context,
          '/booking',
          arguments: {
            'offerId': offer.id,
            'workshopId': workshop?.id ?? offer.workshopId,
          },
        );
      } else {
        final error = ref.read(offerAcceptanceProvider).error;
        if (error != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(error),
              backgroundColor: AppColors.error,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    }
  }

  String _formatPrice(double price) {
    return '€${price.toStringAsFixed(2)}';
  }
}
