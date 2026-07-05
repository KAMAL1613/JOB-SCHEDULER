# Design Decisions & Architectural Trade-offs

This document outlines the major technical decisions, database designs, concurrency strategies, and trade-offs made during the implementation of the Distributed Job Scheduler.

---

## 1. Concurrency Control: Postgres vs. Redis/RabbitMQ
One of the most important decisions was choosing a database-backed task queue over dedicated message brokers like Redis (BullMQ), RabbitMQ, or Kafka.

* **Decision**: Implement the queue directly in PostgreSQL using `SELECT ... FOR UPDATE SKIP LOCKED` transaction semantics.
* **Trade-off Analysis**:
  * **Pros**: 
    * **Simplicity**: No additional infrastructure setup (like Redis or RabbitMQ) is required. The database schema, indexes, transactional integrity, and job records reside in a single, standard Postgres database.
    * **Reliability & Consistency**: Job updates, execution logs, and heartbeat state changes can be performed within ACID-compliant database transactions. If a worker fails mid-claim, Postgres automatically rolls back the transaction.
    * **Ease of Inspection**: The database is the single source of truth, making it extremely easy to build the Dashboard Explorer directly over standard SQL/Prisma schemas.
  * **Cons**:
    * **Polling Overhead**: Database polling places periodic load on the database compared to event-driven push notifications (e.g., Redis pub/sub).
    * **Scalability Limits**: For extremely high-throughput queues (tens of thousands of jobs per second), dedicated in-memory queues (like Redis) perform better than relational databases.
  * **Mitigation**: We throttled the worker polling intervals (2 seconds) and added optimized composite indexes on the `jobs` table (e.g., `(queue_id, status)`) to ensure database queries compile in sub-millisecond execution times.

---

## 2. Atomic Claiming with `SKIP LOCKED`
In a distributed environment, multiple workers poll the database concurrently. Without atomic locking, two workers could read the same `QUEUED` job and execute it twice, leading to duplication issues.

* **Decision**: Implement a native transaction utilizing `FOR UPDATE SKIP LOCKED`.
* **Mechanism**:
  ```sql
  SELECT id FROM jobs 
  WHERE status = 'QUEUED' AND queue_id IN (...)
  ORDER BY priority DESC, created_at ASC 
  LIMIT 1 
  FOR UPDATE SKIP LOCKED
  ```
  * `FOR UPDATE` places a write lock on the matching row, preventing other queries from modifying it.
  * `SKIP LOCKED` instructs other workers trying to read the locked rows to ignore them and move to the next eligible row.
* **Result**: Perfectly concurrent, non-blocking distributed task claiming with zero duplication.

---

## 3. Concurrency Limits Per Queue
Each queue can have a `concurrency_limit` to prevent background tasks from overloading downstream resources (e.g., external API rate limits, database pools).

* **Decision**: Enforce concurrency limits during worker polling.
* **Mechanism**:
  1. The worker fetches all `ACTIVE` queues.
  2. For each queue, it counts the number of jobs currently in the `RUNNING` status.
  3. If a queue's running count is equal to or greater than its `concurrency_limit`, the queue's ID is excluded from the polling search list.
  4. The worker only claims jobs belonging to eligible queues.
* **Trade-off**: This approach guarantees that concurrency limits are respected globally across all active worker instances.

---

## 4. Normalization and Database Indexes
The schema is normalized to **3rd Normal Form (3NF)**:
* Entities like `users`, `organizations`, `projects`, `queues`, `jobs`, `job_executions`, `retry_policies`, and `workers` are split into separate tables with foreign keys.
* **Cascading Deletes**: `onDelete: Cascade` is configured on hierarchical tables (e.g., deleting an organization deletes projects, queues, and jobs inside).
* **Indexes**: 
  * `idx_jobs_queue_status` on `(queue_id, status)` allows rapid lookups during worker polling.
  * `idx_projects_org` on `(organization_id)` speeds up organization-based project queries.
  * `idx_users_email` on `(email)` makes user lookup on login instant.

---

## 5. BigInt to JSON Serialization
Because the PostgreSQL schema uses `BigInt` columns for IDs and duration metrics, standard Express JSON serializers throw errors (JavaScript's `JSON.stringify` does not support serialization of `BigInt` data).

* **Decision**: Registered a global prototype override:
  ```javascript
  BigInt.prototype.toJSON = function() {
      const num = Number(this);
      return Number.isSafeInteger(num) ? num : this.toString();
  };
  ```
* **Reasoning**: This converts safe BigInts into standard numbers, and extremely large numbers into strings, without requiring verbose map-conversion loops in every database query.
