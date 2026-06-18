import { useState, useEffect } from "react";
import { fetchNotifications } from "../api/notifications";
import { Log } from "../../../logging-middleware/index.js";

/**
 * Custom hook to load notifications and handle filters & pagination.
 * @param {Object} params
 * @param {number} params.page - Current page number
 * @param {number} params.limit - Max notifications to load
 * @param {string} params.type - Filter type: 'All' | 'Placement' | 'Result' | 'Event'
 */
export function useNotifications({ page = 1, limit = 10, type = "All" } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(10); // Start with default 10 pages

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Log("frontend", "debug", "hook", `Hook loading notifications (page: ${page}, limit: ${limit}, type: ${type})`);
        
        const data = await fetchNotifications({ page, limit, type });
        
        if (active) {
          setNotifications(data.notifications || []);
          
          // Dynamically adjust total pages based on whether we received a full page of items
          if ((data.notifications || []).length < limit) {
            setTotalPages(page);
          } else {
            setTotalPages(Math.max(totalPages, page + 1));
          }
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Something went wrong");
          await Log("frontend", "error", "hook", `Hook load error: ${err.message}`);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [page, limit, type]);

  return { notifications, totalPages, loading, error };
}
