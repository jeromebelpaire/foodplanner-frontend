import { useState, useCallback, useTransition, useEffect } from "react";
import AsyncSelect from "react-select/async";
import { StylesConfig } from "react-select";
import { fetchFromBackend } from "./fetchFromBackend";
import { SearchedUser } from "../types/SearchedUser";
import { useAuth } from "./AuthContext";
// Define the structure for react-select options
interface UserOption {
  value: number; // User ID
  label: string; // Username
  is_following: boolean;
}

// Add a simple type for follower data (can reuse SearchedUser if structure matches)
interface Follower {
  id: number;
  username: string;
}

// Type for users the current user is following
interface FollowingUser {
  id: number;
  username: string;
}

function FollowUsers() {
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [isSubmitting, startSubmitting] = useTransition();
  const [followError, setFollowError] = useState<string | null>(null);
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState<boolean>(true);
  const [followersError, setFollowersError] = useState<string | null>(null);
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState<boolean>(true);
  const [followingError, setFollowingError] = useState<string | null>(null);

  const { csrfToken } = useAuth();
  // Debounced function to load user options
  const loadOptions = useCallback(
    (inputValue: string, callback: (options: UserOption[]) => void) => {
      fetchFromBackend(`/api/users/search/?query=${encodeURIComponent(inputValue)}`)
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch users");
          return response.json();
        })
        .then((response) => {
          const data = response.results;
          const options: UserOption[] = data.map((user: SearchedUser) => ({
            value: user.id,
            label: user.username,
            is_following: user.is_following,
          }));
          callback(options);
        })
        .catch((error) => {
          console.error("Error loading users:", error);
          callback([]); // Return empty array on error
        });
    },
    []
  );

  // --- Fetch followers ---
  useEffect(() => {
    const fetchFollowers = async () => {
      setIsLoadingFollowers(true);
      setFollowersError(null);
      try {
        const response = await fetchFromBackend("/api/users/followers/");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setFollowers(data.results || []); // Assuming paginated response
      } catch (err) {
        console.error("Error fetching followers:", err);
        setFollowersError(
          `Failed to load followers. ${err instanceof Error ? err.message : "Please try again."}`
        );
      } finally {
        setIsLoadingFollowers(false);
      }
    };

    fetchFollowers();
  }, []);

  // --- Fetch users the current user is following ---
  useEffect(() => {
    const fetchFollowing = async () => {
      setIsLoadingFollowing(true);
      setFollowingError(null);
      try {
        const response = await fetchFromBackend("/api/users/following/");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setFollowing(data.results || []); // Assuming paginated response
      } catch (err) {
        console.error("Error fetching following list:", err);
        setFollowingError(
          `Failed to load who you are following. ${
            err instanceof Error ? err.message : "Please try again."
          }`
        );
      } finally {
        setIsLoadingFollowing(false);
      }
    };

    fetchFollowing();
  }, []);

  // Handler for follow/unfollow button click
  const handleFollowToggle = useCallback(() => {
    if (!selectedUser || isSubmitting) return;

    setFollowError(null);
    const method = selectedUser.is_following ? "DELETE" : "POST";
    const url = `/api/users/${selectedUser.value}/follow/`;

    startSubmitting(async () => {
      try {
        const response = await fetchFromBackend(url, {
          method,
          headers: { "X-CSRFToken": csrfToken! },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData?.detail || `Failed to ${method === "POST" ? "follow" : "unfollow"} user.`
          );
        }

        // Update the selected user state to reflect the change
        setSelectedUser((prev) => (prev ? { ...prev, is_following: !prev.is_following } : null));
      } catch (err) {
        console.error("Error toggling follow:", err);
        setFollowError(err instanceof Error ? err.message : "An unknown error occurred.");
      }
    });
  }, [selectedUser, isSubmitting]);

  // Custom styles for react-select using StylesConfig
  const selectStyles: StylesConfig<UserOption, false> = {
    container: (provided) => ({
      ...provided,
      minWidth: "250px",
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999, // Ensure dropdown appears above other elements if needed
    }),
  };

  return (
    <div>
      <h5 className="mb-3">Find and Follow Users</h5>
      <div className="mb-3">
        <AsyncSelect
          cacheOptions
          defaultOptions
          loadOptions={loadOptions}
          onChange={(option) => setSelectedUser(option as UserOption)}
          placeholder="Search for users..."
          noOptionsMessage={({ inputValue }) =>
            inputValue.length < 2 ? "Type 2+ characters to search" : "No users found"
          }
          isClearable
          styles={selectStyles}
          value={selectedUser}
          aria-label="Search users to follow"
        />
      </div>

      {selectedUser && (
        <div className="d-flex justify-content-between align-items-center p-2 border rounded bg-light">
          <span>{selectedUser.label}</span>
          <button
            className={`btn btn-sm ${
              selectedUser.is_following ? "btn-outline-danger" : "btn-primary"
            }`}
            onClick={handleFollowToggle}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
                <span className="visually-hidden">Loading...</span>
              </>
            ) : selectedUser.is_following ? (
              "Unfollow"
            ) : (
              "Follow"
            )}
          </button>
        </div>
      )}

      {followError && <div className="alert alert-danger mt-2 py-1 px-2 small">{followError}</div>}

      <hr className="my-4" />

      {/* --- Followers List Section --- */}
      <h5 className="mb-3">Your Followers</h5>
      {isLoadingFollowers && (
        <div className="d-flex justify-content-center my-3">
          <div className="spinner-border spinner-border-sm text-secondary" role="status">
            <span className="visually-hidden">Loading followers...</span>
          </div>
        </div>
      )}
      {followersError && (
        <div className="alert alert-warning text-center py-1 px-2 small" role="alert">
          {followersError}
        </div>
      )}
      {!isLoadingFollowers && !followersError && followers.length === 0 && (
        <div className="text-muted text-center small py-2">You don't have any followers yet.</div>
      )}
      {!isLoadingFollowers && !followersError && followers.length > 0 && (
        <div
          className="list-group list-group-flush overflow-auto mb-3"
          style={{ maxHeight: "150px" }}
        >
          {followers.map((follower) => (
            <div
              key={follower.id}
              className="list-group-item d-flex justify-content-between align-items-center py-1 px-2"
            >
              <span>{follower.username}</span>
              {/* Optional: Add a button/link to view follower's profile */}
            </div>
          ))}
        </div>
      )}

      <hr className="my-4" />

      {/* --- Following List Section --- */}
      <h5 className="mb-3">Users You Follow</h5>
      {isLoadingFollowing && (
        <div className="d-flex justify-content-center my-3">
          <div className="spinner-border spinner-border-sm text-secondary" role="status">
            <span className="visually-hidden">Loading following list...</span>
          </div>
        </div>
      )}
      {followingError && (
        <div className="alert alert-warning text-center py-1 px-2 small" role="alert">
          {followingError}
        </div>
      )}
      {!isLoadingFollowing && !followingError && following.length === 0 && (
        <div className="text-muted text-center small py-2">You are not following anyone yet.</div>
      )}
      {!isLoadingFollowing && !followingError && following.length > 0 && (
        <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: "150px" }}>
          {following.map((followedUser) => (
            <div
              key={followedUser.id}
              className="list-group-item d-flex justify-content-between align-items-center py-1 px-2"
            >
              <span>{followedUser.username}</span>
              {/* Optional: Add unfollow button or link */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FollowUsers;
