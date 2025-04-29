import { useState, useCallback, useTransition } from "react";
import { Link } from "react-router-dom";
import { FeedEvent } from "../types/FeedEvent";
import { FeedItemComment } from "../types/FeedItemComment";
import { fetchFromBackend } from "./fetchFromBackend";
import { useAuth } from "./AuthContext";

// --- Helper Components ---

// Reusable Image Thumbnail (moved from Feed.tsx)
const ImageThumbnail: React.FC<{ event: FeedEvent }> = ({ event }) => {
  const recipeImage = event.recipe.image;
  return recipeImage ? (
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
};

// Formatted Date Component
const FormattedEventDate: React.FC<{ dateString: string }> = ({ dateString }) => {
  const eventDate = new Date(dateString);
  const formattedDate = eventDate.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return <h6 className="card-subtitle mb-2 text-muted small">{formattedDate}</h6>;
};

// Comment Display Component
interface CommentDisplayProps {
  comment: FeedItemComment;
  currentUserUsername: string | null;
  onDelete: (commentId: number) => void;
  onUpdate: (commentId: number, newText: string) => Promise<boolean>;
}

const CommentDisplay: React.FC<CommentDisplayProps> = ({
  comment,
  currentUserUsername,
  onDelete,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [isSubmittingEdit, startEditTransition] = useTransition();
  const [editError, setEditError] = useState<string | null>(null);

  const isAuthor = currentUserUsername === comment.user_username;

  const commentDate = new Date(comment.created_at);
  const formattedDate = commentDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleEditClick = () => {
    setEditText(comment.text);
    setIsEditing(true);
    setEditError(null);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setEditError(null);
  };

  const handleSaveClick = () => {
    if (!editText.trim() || editText === comment.text) {
      setIsEditing(false);
      return;
    }
    setEditError(null);
    startEditTransition(async () => {
      const success = await onUpdate(comment.id, editText);
      if (success) {
        setIsEditing(false);
      } else {
        setEditError("Failed to save comment.");
      }
    });
  };

  const handleDeleteClick = () => {
    onDelete(comment.id);
  };

  return (
    <div className="d-flex mb-2 position-relative" data-comment-id={comment.id}>
      <div className="flex-shrink-0 small pt-1 me-2 text-muted">
        <i className="bi bi-person-circle"></i>
      </div>
      <div className="flex-grow-1">
        <span className="fw-semibold small me-2">{comment.user_username}</span>
        <span className="text-muted small align-middle">{formattedDate}</span>

        {isEditing ? (
          <div className="mt-1">
            <textarea
              className="form-control form-control-sm"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={2}
              required
              aria-label="Edit comment"
              disabled={isSubmittingEdit}
            />
            {editError && <div className="text-danger small mt-1">{editError}</div>}
            <div className="mt-1 d-flex justify-content-end gap-2">
              <button
                className="btn btn-sm btn-secondary py-0 px-1"
                onClick={handleCancelClick}
                disabled={isSubmittingEdit}
              >
                Cancel
              </button>
              <button
                className="btn btn-sm btn-primary py-0 px-1"
                onClick={handleSaveClick}
                disabled={isSubmittingEdit || !editText.trim() || editText === comment.text}
              >
                {isSubmittingEdit ? (
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        ) : (
          <p className="mb-0 small mt-1" style={{ whiteSpace: "pre-wrap" }}>
            {comment.text}
          </p>
        )}
      </div>

      {isAuthor && !isEditing && (
        <div className="position-absolute end-0 top-0">
          <button
            className="btn btn-sm btn-link text-secondary p-0 me-1"
            onClick={handleEditClick}
            aria-label="Edit comment"
            title="Edit"
          >
            <i className="bi bi-pencil-square"></i>
          </button>
          <button
            className="btn btn-sm btn-link text-danger p-0"
            onClick={handleDeleteClick}
            aria-label="Delete comment"
            title="Delete"
          >
            <i className="bi bi-trash"></i>
          </button>
        </div>
      )}
    </div>
  );
};

// --- Main FeedItemCard Component ---

interface FeedItemCardProps {
  event: FeedEvent;
}

const FeedItemCard: React.FC<FeedItemCardProps> = ({ event }) => {
  const { user, csrfToken } = useAuth();
  const currentUserUsername = user?.username;

  // State for Likes
  const [isLiked, setIsLiked] = useState(event.is_liked_by_user);
  const [currentLikeCount, setCurrentLikeCount] = useState(event.like_count);
  const [isLikeTransitioning, startLikeTransition] = useTransition();
  const [likeError, setLikeError] = useState<string | null>(null);

  // State for Comments
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<FeedItemComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [currentCommentCount, setCurrentCommentCount] = useState(event.comment_count);

  // State for New Comment Input
  const [newCommentText, setNewCommentText] = useState("");
  const [isPostingComment, startCommentPostTransition] = useTransition();
  const [postCommentError, setPostCommentError] = useState<string | null>(null);

  // --- Event Content Rendering ---
  const renderEventSpecificContent = () => {
    const recipeLink = `/recipe/${event.recipe.id}/${event.recipe.slug}`;

    switch (event.event_type) {
      case "new_recipe":
        return (
          <>
            <div>
              <h5 className="card-title fw-semibold mb-1">New Recipe</h5>
              <FormattedEventDate dateString={event.created_on} />
              <p className="card-text mb-0">
                <strong className="text-primary">{event.user_username}</strong> published a new
                recipe:
                <br />
                <Link to={recipeLink} className="link-dark fw-medium">
                  {event.recipe.title}
                </Link>
              </p>
            </div>
            <ImageThumbnail event={event} />
          </>
        );
      case "update_recipe":
        return (
          <>
            <div>
              <h5 className="card-title fw-semibold mb-1">Updated Recipe</h5>
              <FormattedEventDate dateString={event.created_on} />
              <p className="card-text mb-0">
                <strong className="text-primary">{event.user_username}</strong> updated a recipe:
                <br />
                <Link to={recipeLink} className="link-dark fw-medium">
                  {event.recipe.title}
                </Link>
              </p>
            </div>
            <ImageThumbnail event={event} />
          </>
        );
      case "new_rating":
      case "update_rating": {
        if (!event.rating) return null;
        const displayRating = event.rating.rating / 2;
        const isUpdate = event.event_type === "update_rating";
        return (
          <>
            <div>
              <h5 className="card-title fw-semibold mb-1">{isUpdate ? "Updated" : "New"} Rating</h5>
              <FormattedEventDate dateString={event.created_on} />
              <p className="card-text mb-1">
                <strong className="text-primary">{event.rating.author_username}</strong>{" "}
                {isUpdate ? "updated rating for" : "rated"}
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
            <ImageThumbnail event={event} />
          </>
        );
      }
      default:
        console.warn("Unhandled feed event type:", event.event_type);
        return (
          <div className="alert alert-warning py-2 px-3 small">
            Unknown event type: {event.event_type || "N/A"}
          </div>
        );
    }
  };

  // --- Like Handling ---
  const handleLikeToggle = useCallback(() => {
    if (isLikeTransitioning || !csrfToken) return;
    setLikeError(null);

    const originalLiked = isLiked;
    const originalCount = currentLikeCount;
    const newLiked = !isLiked;
    const newCount = newLiked ? originalCount + 1 : originalCount - 1;

    setIsLiked(newLiked);
    setCurrentLikeCount(newCount);

    startLikeTransition(async () => {
      const url = `/api/feed/items/${event.id}/like/`;
      const method = newLiked ? "POST" : "DELETE";
      try {
        const response = await fetchFromBackend(url, {
          method,
          headers: { "X-CSRFToken": csrfToken },
        });

        if (!response.ok && response.status !== 304) {
          setIsLiked(originalLiked);
          setCurrentLikeCount(originalCount);
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Failed to ${newLiked ? "like" : "unlike"}.`);
        }
      } catch (err) {
        console.error("Like toggle error:", err);
        setIsLiked(originalLiked);
        setCurrentLikeCount(originalCount);
        setLikeError(err instanceof Error ? err.message : "Could not update like status.");
      }
    });
  }, [event.id, isLiked, currentLikeCount, isLikeTransitioning, csrfToken]);

  // --- Comment Handling ---
  const fetchComments = useCallback(async () => {
    setIsLoadingComments(true);
    setCommentError(null);
    try {
      const response = await fetchFromBackend(`/api/feed/items/${event.id}/comments/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: FeedItemComment[] = await response.json();
      setComments(data);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setCommentError(`Failed to load comments. ${err instanceof Error ? err.message : ""}`);
    } finally {
      setIsLoadingComments(false);
    }
  }, [event.id]);

  const toggleComments = useCallback(() => {
    const newShowState = !showComments;
    setShowComments(newShowState);
    if (newShowState && comments.length === 0) {
      fetchComments();
    }
  }, [showComments, comments.length, fetchComments]);

  const handlePostComment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCommentText.trim() || isPostingComment || !csrfToken) return;

      setPostCommentError(null);
      startCommentPostTransition(async () => {
        const url = `/api/feed/items/${event.id}/comments/`;
        try {
          const response = await fetchFromBackend(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": csrfToken,
            },
            body: JSON.stringify({ text: newCommentText }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || "Failed to post comment.");
          }

          const postedComment: FeedItemComment = await response.json();
          setComments((prev) => [...prev, postedComment]);
          setCurrentCommentCount((prev) => prev + 1);
          setNewCommentText("");
        } catch (err) {
          console.error("Error posting comment:", err);
          setPostCommentError(err instanceof Error ? err.message : "Could not post comment.");
        }
      });
    },
    [event.id, newCommentText, isPostingComment, csrfToken]
  );

  const handleDeleteComment = useCallback(
    async (commentId: number) => {
      if (!csrfToken) return;
      const originalComments = [...comments];
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCurrentCommentCount((prev) => Math.max(0, prev - 1));

      const url = `/api/feed/comments/${commentId}/`;
      try {
        const response = await fetchFromBackend(url, {
          method: "DELETE",
          headers: { "X-CSRFToken": csrfToken },
        });
        if (!response.ok && response.status !== 204) {
          setComments(originalComments);
          setCurrentCommentCount((prev) => prev + 1);
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || "Failed to delete comment.");
        }
      } catch (err) {
        console.error("Delete comment error:", err);
        setComments(originalComments);
        setCurrentCommentCount((prev) => prev + 1);
        setCommentError(err instanceof Error ? err.message : "Could not delete comment.");
      }
    },
    [comments, csrfToken]
  );

  const handleUpdateComment = useCallback(
    async (commentId: number, newText: string): Promise<boolean> => {
      if (!csrfToken) return false;

      const originalComments = [...comments];
      const commentIndex = originalComments.findIndex((c) => c.id === commentId);
      if (commentIndex === -1) return false;

      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, text: newText } : c)));

      const url = `/api/feed/comments/${commentId}/`;
      try {
        const response = await fetchFromBackend(url, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken,
          },
          body: JSON.stringify({ text: newText }),
        });

        if (!response.ok) {
          setComments(originalComments);
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || "Failed to update comment.");
        }
        const updatedCommentFromServer: FeedItemComment = await response.json();
        setComments((prev) => prev.map((c) => (c.id === commentId ? updatedCommentFromServer : c)));
        return true;
      } catch (err) {
        console.error("Update comment error:", err);
        setComments(originalComments);
        setCommentError(err instanceof Error ? err.message : "Could not update comment.");
        return false;
      }
    },
    [comments, csrfToken]
  );

  // --- Render ---
  return (
    <div className="py-3 px-3 mb-3 border rounded shadow-sm bg-white">
      {/* Main Event Content */}
      <div>{renderEventSpecificContent()}</div>

      {/* Like/Comment Action Bar */}
      <div className="mt-2 pt-2 border-top d-flex justify-content-start align-items-center small gap-3">
        <button
          className={`btn btn-sm p-0 border-0 d-flex align-items-center ${
            isLiked ? "text-danger" : "text-secondary"
          }`}
          onClick={handleLikeToggle}
          disabled={isLikeTransitioning || !csrfToken}
          aria-pressed={isLiked}
          aria-label={isLiked ? "Unlike" : "Like"}
        >
          <i className={`bi ${isLiked ? "bi-heart-fill" : "bi-heart"} me-1`}></i>
          <span>{currentLikeCount}</span>
        </button>

        <button
          className="btn btn-sm p-0 border-0 d-flex align-items-center text-secondary"
          onClick={toggleComments}
          aria-expanded={showComments}
        >
          <i className="bi bi-chat-square-text me-1"></i>
          <span>{currentCommentCount}</span>
        </button>
      </div>
      {likeError && <div className="alert alert-danger mt-1 py-1 px-2 small">{likeError}</div>}

      {/* Comment Section (Conditional) */}
      {showComments && (
        <div className="mt-3 pt-3 border-top">
          {isLoadingComments && (
            <div className="text-center text-muted small">Loading comments...</div>
          )}
          {commentError && (
            <div className="alert alert-warning py-1 px-2 small">{commentError}</div>
          )}
          {!isLoadingComments && !commentError && comments.length === 0 && (
            <div className="text-center text-muted small">No comments yet.</div>
          )}
          {!isLoadingComments && !commentError && comments.length > 0 && (
            <div className="mb-3">
              {comments.map((comment) => (
                <CommentDisplay
                  key={comment.id}
                  comment={comment}
                  currentUserUsername={currentUserUsername ?? null}
                  onDelete={handleDeleteComment}
                  onUpdate={handleUpdateComment}
                />
              ))}
            </div>
          )}

          {csrfToken && (
            <form onSubmit={handlePostComment} className="d-flex gap-2">
              <textarea
                className="form-control form-control-sm flex-grow-1"
                rows={1}
                placeholder="Add a comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                required
                aria-label="Add a comment"
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!newCommentText.trim() || isPostingComment}
              >
                {isPostingComment ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    <span className="visually-hidden">Posting...</span>
                  </>
                ) : (
                  "Post"
                )}
              </button>
            </form>
          )}
          {postCommentError && (
            <div className="alert alert-danger mt-1 py-1 px-2 small">{postCommentError}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedItemCard;
