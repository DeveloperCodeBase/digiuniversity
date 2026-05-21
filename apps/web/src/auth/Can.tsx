// =====================================================
// <Can> — render children only if the current user can perform action
// on subject.
// =====================================================
//
// Phase-15 R7. Wraps `@casl/react`'s `createContextualCan` against the
// AbilityContext that AuthProvider already publishes. Usage:
//
//   <Can I="grade" a="Submission">
//     <button onClick={...}>Grade</button>
//   </Can>
//
//   <Can I="read" a="AuditLog">
//     <Link to="/audit">Audit log</Link>
//   </Can>
//
// When the user is unauthenticated, the AbilityContext default is an
// empty ability (`buildAbility(null)`), so every `<Can>` correctly
// renders nothing. That keeps the markup-level guard from leaking
// links a logged-out visitor shouldn't see.
//
// For programmatic checks where JSX isn't a fit, consume
// `useAbility()` from this module directly:
//
//   const ability = useAbility();
//   if (ability.can("delete", "Course")) { ... }
// =====================================================

import React from "react";
import { createContextualCan } from "@casl/react";

import { AbilityContext, type AppAbility } from "./ability";

/**
 * `<Can I="action" a="Subject">…</Can>` — children render only when
 * the current user's ability allows the action on the subject. Uses
 * @casl/react's contextual builder against AbilityContext.
 */
export const Can = createContextualCan<AppAbility>(
  AbilityContext.Consumer as React.Consumer<AppAbility>,
);

/** Programmatic accessor for cases where JSX wrapping is awkward. */
export const useAbility = (): AppAbility => React.useContext(AbilityContext);
