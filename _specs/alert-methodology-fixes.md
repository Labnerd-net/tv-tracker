# Spec for Alert Methodology Fixes

branch: claude/feature/alert-methodology-fixes

## Summary

The current `AlertProvider` / `useAlert` system has two issues: a race condition caused by overlapping `setTimeout` timers, and a leaky API that forces every call site to make three separate state-setter calls in the correct order. This spec addresses both.

## Functional Requirements

- `showAlert` must accept `variant` and `message` as arguments, replacing the need for callers to call `setAlertVariant` and `setAlertMessage` separately before calling `showAlert`.
- `setAlertVariant` and `setAlertMessage` must be removed from the public context interface so callers cannot use the old pattern.
- When `showAlert` is called while an alert is already visible, the previous auto-dismiss timer must be cancelled and a new 5-second timer started from the moment of the new call.
- All existing call sites across the UI must be updated to use the new single-call `showAlert(variant, message)` signature.

## Possible Edge Cases

- Rapid successive calls (e.g. a user double-clicks a button) should result in only the most recent alert being shown, with its own fresh 5-second timer.
- The timer must be cleaned up if the `AlertProvider` unmounts (e.g. during testing teardown) to avoid state updates on unmounted components.

## Acceptance Criteria

- Every call site invokes `showAlert` with exactly two arguments and makes no separate `setAlertVariant` / `setAlertMessage` calls.
- `setAlertVariant` and `setAlertMessage` no longer appear in the context interface or provider value.
- Triggering a second alert before the first one auto-dismisses resets the timer — the second alert stays visible for a full 5 seconds from the moment it appears.
- All existing alert behaviours (success, warning, danger variants; auto-dismiss after 5 seconds) continue to work as before.

## Open Questions

- None.

## Testing Guidelines

No dedicated test file is needed for this change — it is a pure refactor of an internal UI utility with no API surface change. Confirm correctness by:
- Verifying the UI builds without TypeScript errors after the interface change.
- Manually triggering two alerts in quick succession and confirming the second one is not dismissed early.

## Personal Opinion

Both fixes are straightforward and the right call. The race condition is a real bug — it will silently swallow alerts in normal use once the app has more interactive surfaces. The API cleanup reduces boilerplate at every call site and removes an implicit ordering contract that callers shouldn't have to know about. The change is low risk and low complexity. No concerns.
