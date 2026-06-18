# Notification System Design

## Stage 1

### 1. Approach to Priority Determination
The priority inbox sorts notifications based on a combination of **Category Weight** and **Recency**:
- **Category Weight**: Categories are weighted as follows:
  - `Placement` -> Weight: **3** (Highest)
  - `Result` -> Weight: **2** (Medium)
  - `Event` -> Weight: **1** (Lowest)
- **Recency**: If two notifications have the same category weight, the one with the more recent `Timestamp` takes priority.

The sorting logic compares the weights first. If they differ, the notification with the higher weight is placed first. If the weights are equal, the timestamp strings are converted to JavaScript `Date` objects and compared in descending order (most recent first).

---

### 2. Stream Maintenance: Maintaining Top 10 Notifications Efficiently
In a production system, new notifications continually stream in. Re-sorting the entire list of notifications upon each new arrival has a time complexity of $O(N \log N)$, which is inefficient for large datasets.

To maintain the top `K` (where $K = 10$) highest-priority notifications efficiently, we can use a **Min-Heap (Priority Queue)** of size $K$:
1. **Initialize** a Min-Heap structured to store up to $K$ notifications. The priority comparison in this heap uses the inverse of our sorting logic (i.e., the root of the heap always represents the *lowest* priority notification currently in the top $K$).
2. **Processing Streamed Notifications**:
   - If the heap has fewer than $K$ elements, insert the new notification: $O(\log K)$ complexity.
   - If the heap has exactly $K$ elements, compare the new notification with the root element (the minimum priority among the current top $K$):
     - If the new notification has a **higher** priority than the root element, remove the root (extract-min) and insert the new notification: $O(\log K)$ complexity.
     - If the new notification has a **lower** or equal priority than the root element, discard it: $O(1)$ complexity.
3. **Space Complexity**: $O(K)$ auxiliary memory, which is extremely lightweight (only 10 items).
4. **Time Complexity**: $O(N \log K)$ to process $N$ streaming notifications, which is linear $O(N)$ since $K=10$ is constant.
