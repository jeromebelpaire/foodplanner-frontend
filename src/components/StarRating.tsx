interface StarRatingProps {
  rating: number;
  count: number;
}

export function StarRating({ rating, count }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;

  return (
    <div className="d-flex align-items-center">
      {[...Array(fullStars)].map((_, i) => (
        <i key={`full-${i}`} className="bi bi-star-fill text-warning"></i>
      ))}
      {halfStar === 1 && <i key="half" className="bi bi-star-half text-warning"></i>}
      {[...Array(emptyStars)].map((_, i) => (
        <i key={`empty-${i}`} className="bi bi-star text-warning"></i>
      ))}
      <span className="ms-2 text-muted small">({count})</span>
    </div>
  );
}
