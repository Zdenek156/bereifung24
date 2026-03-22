class Review {
  final String id;
  final int rating;
  final String? comment;
  final String? authorName;
  final String? workshopId;
  final DateTime? createdAt;

  Review({
    required this.id,
    required this.rating,
    this.comment,
    this.authorName,
    this.workshopId,
    this.createdAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    return Review(
      id: json['id']?.toString() ?? '',
      rating: json['rating'] ?? 0,
      comment: json['comment'],
      authorName: user != null
          ? '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim()
          : json['authorName'],
      workshopId: json['workshopId']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'rating': rating,
        if (comment != null) 'comment': comment,
        if (workshopId != null) 'workshopId': workshopId,
      };
}
