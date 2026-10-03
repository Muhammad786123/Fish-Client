/**
 * Central Error Message Sanitizer for Fish ERP
 * Sanitizes technical, database, or vendor-specific error messages
 * into clean, friendly, user-facing error text.
 */

const VENDOR_TERMS_REGEX = /(firestore|firebase|indexeddb|dexie|permission-denied|unavailable|failed-precondition|unimplemented|quota-exceeded|network-request-failed|wsarecv|tcp|cloudcode)/i;

/**
 * Maps technical error codes or raw errors to generic, branded user messages.
 */
export function sanitizeErrorMessage(err, fallback = "An unexpected error occurred. Please try again.") {
  if (!err) return fallback;

  let msg = typeof err === "string" ? err : err.message || "";
  const code = err.code || "";

  // Handle specific Firebase / Firestore error codes
  if (code === "permission-denied" || msg.includes("permission-denied")) {
    return "Access restricted. You do not have permission to perform this action.";
  }
  if (code === "unavailable" || code === "network-request-failed" || msg.includes("unavailable") || msg.includes("network")) {
    return "Connection issue. Please check your internet connection and try again.";
  }
  if (code === "already-exists" || msg.includes("already-exists")) {
    return "A record with this information already exists.";
  }
  if (code === "not-found" || msg.includes("not-found")) {
    return "The requested record could not be found.";
  }
  if (code === "failed-precondition" || msg.includes("failed-precondition")) {
    return "Operation could not be completed at this time. Please refresh and try again.";
  }

  // Check if raw error string contains vendor/technical terminology
  if (VENDOR_TERMS_REGEX.test(msg)) {
    return fallback;
  }

  // Return clean validation messages (e.g. "Password must be at least 8 characters long")
  return msg || fallback;
}
