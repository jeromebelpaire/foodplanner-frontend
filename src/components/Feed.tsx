import React, { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { fetchFromBackend } from "./fetchFromBackend";
import { FeedEvent, FeedEventType } from "../types/FeedEvent";
import FeedItemCard from "./FeedItemCard";

const FollowUsers = lazy(() => import("./FollowUsers"));

const Feed: React.FC = () => {
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showFollowModal, setShowFollowModal] = useState<boolean>(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  useEffect(() => {
    const loadInitialFeed = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchFromBackend(
          "/api/feed/items/?exclude_event_types=update_recipe"
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setFeedEvents(data.results);
        setNextPageUrl(data.next);
      } catch (err) {
        console.error("Error fetching feed:", err);
        setError(
          `Failed to load feed. ${err instanceof Error ? err.message : "Please try again later."}`
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitialFeed();
  }, []);

  const loadMoreFeedItems = useCallback(async () => {
    if (!nextPageUrl || isLoadingMore || loading) return;

    setIsLoadingMore(true);
    setError(null);
    try {
      const response = await fetchFromBackend(nextPageUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Filter the newly fetched events
      const filteredNewEvents = data.results.filter(
        (event: FeedEvent) => event.event_type !== FeedEventType.UPDATE_RECIPE
      );

      setFeedEvents((prevEvents) => [...prevEvents, ...filteredNewEvents]);
      setNextPageUrl(data.next);
    } catch (err) {
      console.error("Error fetching more feed items:", err);
      setError(
        `Failed to load more items. ${
          err instanceof Error ? err.message : "Please try again later."
        }`
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextPageUrl, isLoadingMore, loading]);

  // --- Effect for scroll detection ---
  useEffect(() => {
    const handleScroll = () => {
      // Check if scrolled close to the bottom
      // Offset (e.g., 300px) determines how early to trigger loading
      const scrolledToBottom =
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 300;

      if (scrolledToBottom) {
        loadMoreFeedItems();
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Cleanup function to remove the event listener
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMoreFeedItems]); // Re-run effect if loadMoreFeedItems changes

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-md-10">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Activity Feed</h2>
            <button
              className="btn btn-outline-secondary btn-sm"
              type="button"
              onClick={() => setShowFollowModal(true)}
              aria-label="Manage users you follow"
            >
              <i className="bi bi-person-plus me-1"></i>
              Manage Following
            </button>
          </div>

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
            <div className="list-group list-group-flush p-0">
              {feedEvents.map((event) => (
                <FeedItemCard key={event.id} event={event} />
              ))}
            </div>
          )}

          {/* Loading indicator for loading more items */}
          {isLoadingMore && (
            <div className="d-flex justify-content-center my-3">
              <div className="spinner-border spinner-border-sm text-secondary" role="status">
                <span className="visually-hidden">Loading more...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`modal fade ${showFollowModal ? "show d-block" : ""}`}
        id="followUsersModal"
        tabIndex={-1}
        aria-labelledby="followUsersModalLabel"
        aria-hidden={!showFollowModal}
        style={{ backgroundColor: showFollowModal ? "rgba(0, 0, 0, 0.5)" : "transparent" }}
        role="dialog"
        onClick={(e) => {
          // Close modal if backdrop is clicked
          if (e.target === e.currentTarget) {
            setShowFollowModal(false);
          }
        }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="followUsersModalLabel">
                Manage Following
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowFollowModal(false)}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <Suspense fallback={<div>Loading component...</div>}>
                {showFollowModal && <FollowUsers />}
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;
