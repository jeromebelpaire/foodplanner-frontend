import React, { useState, useEffect } from "react";
import { fetchFromBackend } from "./fetchFromBackend";
import { FeedEvent } from "../types/FeedEvent";
import { Link } from "react-router-dom";

const Feed: React.FC = () => {
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeed = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchFromBackend("/api/feed/feed/");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: FeedEvent[] = await response.json();
        setFeedEvents(data);
      } catch (err) {
        console.error("Error fetching feed:", err);
        setError(
          `Failed to load feed. ${err instanceof Error ? err.message : "Please try again later."}`
        );
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, []);

  const renderEventContent = (event: FeedEvent) => {
    const eventDate = new Date(event.created_on);
    const formattedDate = eventDate.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const recipeLink = `/recipe/${event.recipe.id}/${event.recipe.slug}`;
    const recipeImage = event.recipe.image;

    const ImageThumbnail = () =>
      // TODO handle css in separate file
      recipeImage ? (
        <img
          src={recipeImage as string}
          alt={event.recipe.title}
          className="img-thumbnail mt-2"
          style={{
            width: "auto",
            maxWidth: "100%",
            maxHeight: "150px",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : null;

    switch (event.event_type) {
      case "new_recipe": {
        return (
          <>
            <div>
              <h5 className="card-title fw-semibold mb-1">New Recipe</h5>
              <h6 className="card-subtitle mb-2 text-muted small">{formattedDate}</h6>
              <p className="card-text mb-0">
                <strong className="text-primary">{event.user_username}</strong> published a new
                recipe:
                <br />
                <Link to={recipeLink} className="link-dark fw-medium">
                  {event.recipe.title}
                </Link>
              </p>
            </div>
            <ImageThumbnail />
          </>
        );
      }
      case "update_recipe": {
        return (
          <>
            <div>
              <h5 className="card-title fw-semibold mb-1">Updated Recipe</h5>
              <h6 className="card-subtitle mb-2 text-muted small">{formattedDate}</h6>
              <p className="card-text mb-0">
                <strong className="text-primary">{event.user_username}</strong> updated a recipe:
                <br />
                <Link to={recipeLink} className="link-dark fw-medium">
                  {event.recipe.title}
                </Link>
              </p>
            </div>
            <ImageThumbnail />
          </>
        );
      }
      case "new_rating": {
        if (!event.rating) return null;
        const displayRating = event.rating.rating / 2;
        return (
          <>
            <div>
              <h5 className="card-title fw-semibold mb-1">New Rating</h5>
              <h6 className="card-subtitle mb-2 text-muted small">{formattedDate}</h6>
              <p className="card-text mb-1">
                <strong className="text-primary">{event.rating.author_username}</strong> rated
                <br />
                <Link to={recipeLink} className="link-dark fw-medium">
                  {event.recipe.title}
                </Link>{" "}
                <span className="badge bg-warning text-dark">{displayRating.toFixed(1)} ★</span>
              </p>
              {event.rating.comment && (
                <blockquote className="blockquote mt-1 mb-0 border-start border-2 ps-2">
                  <p className="mb-0 fs-6 fst-italic text-muted">"{event.rating.comment}"</p>
                </blockquote>
              )}
            </div>
            <ImageThumbnail />
          </>
        );
      }
      case "update_rating": {
        if (!event.rating) return null;
        const displayRating = event.rating.rating / 2;
        return (
          <>
            <div>
              <h5 className="card-title fw-semibold mb-1">Updated Rating</h5>
              <h6 className="card-subtitle mb-2 text-muted small">{formattedDate}</h6>
              <p className="card-text mb-1">
                <strong className="text-primary">{event.rating.author_username}</strong> updated
                rating for
                <br />
                <Link to={recipeLink} className="link-dark fw-medium">
                  {event.recipe.title}
                </Link>{" "}
                <span className="badge bg-warning text-dark">{displayRating.toFixed(1)} ★</span>
              </p>
              {event.rating.comment && (
                <blockquote className="blockquote mt-1 mb-0 border-start border-2 ps-2">
                  <p className="mb-0 fs-6 fst-italic text-muted">"{event.rating.comment}"</p>
                </blockquote>
              )}
            </div>
            <ImageThumbnail />
          </>
        );
      }
      default: {
        // Define a minimal type for logging purposes
        type UnknownEvent = { event_type?: string };
        const unknownEvent = event as UnknownEvent;

        // Handle potential unknown event types gracefully
        console.warn("Unhandled feed event type:", unknownEvent?.event_type);
        return (
          <div className="alert alert-warning py-2 px-3 small">
            Unknown event type: {unknownEvent?.event_type || "N/A"}
          </div>
        );
      }
    }
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-md-10">
          <h2 className="mb-4 text-center">Activity Feed</h2>

          {loading && (
            <div className="d-flex justify-content-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-danger text-center" role="alert">
              {error}
            </div>
          )}

          {!loading && !error && feedEvents.length === 0 && (
            <div className="alert alert-secondary text-center" role="alert">
              No recent activity to display.
            </div>
          )}

          {!loading && !error && feedEvents.length > 0 && (
            <div className="list-group">
              {feedEvents.map((event) => (
                <div
                  key={event.id}
                  className="py-3 px-3 mb-3 border rounded shadow-sm bg-white"
                  aria-current="true"
                >
                  <div>{renderEventContent(event)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feed;
