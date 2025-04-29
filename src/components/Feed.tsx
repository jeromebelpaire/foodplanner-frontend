import React, { useState, useEffect, lazy, Suspense } from "react";
import { fetchFromBackend } from "./fetchFromBackend";
import { FeedEvent } from "../types/FeedEvent";
import FeedItemCard from "./FeedItemCard";

// Lazy load the FollowUsers component
const FollowUsers = lazy(() => import("./FollowUsers"));

const Feed: React.FC = () => {
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showFollowModal, setShowFollowModal] = useState<boolean>(false);

  useEffect(() => {
    const loadFeed = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchFromBackend("/api/feed/items/");
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
              <i className="bi bi-person-plus me-1"></i> {/* Optional icon */}
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
        </div>
      </div>

      {/* Follow Users Modal */}
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
