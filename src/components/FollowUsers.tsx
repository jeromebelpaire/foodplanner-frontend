import { useState, useCallback, useTransition } from "react";
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

function FollowUsers() {
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [isSubmitting, startSubmitting] = useTransition();
  const [followError, setFollowError] = useState<string | null>(null);

  const { csrfToken } = useAuth();
  // Debounced function to load user options
  const loadOptions = useCallback(
    (inputValue: string, callback: (options: UserOption[]) => void) => {
      // Don't search if input is too short
      if (!inputValue || inputValue.length < 2) {
        callback([]);
        return;
      }

      fetchFromBackend(`/api/users/search/?query=${encodeURIComponent(inputValue)}`)
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch users");
          return response.json();
        })
        .then((data: SearchedUser[]) => {
          const options: UserOption[] = data.map((user) => ({
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
    </div>
  );
}

export default FollowUsers;
