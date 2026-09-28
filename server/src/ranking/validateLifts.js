// Input validation for one muscle's lifts, kept out of the engine on purpose.
//
// rank() is a pure scorer: it assumes what it is handed is already legal, which
// is what lets the arithmetic (and therefore every realistic score) stay exactly
// as it was. Everything that decides whether a request is legal at all lives
// here, driven by the same config the engine is built from, so a new muscle sets
// its own limits in rankingConfig.js and nothing in this file changes.
//
// Pure: no I/O, no throwing, no dependency on the engine. It reports every
// problem it finds rather than the first, because a form with three bad fields
// should not take three round trips to fix.

function quote(values) {
  return values.map((value) => `"${value}"`).join(", ");
}

// A number the client can act on: "between 1 and 1000", not "1e3".
function range(bounds) {
  return `${bounds.min} and ${bounds.max}`;
}

/**
 * Check one muscle's submitted lifts against its config.
 *
 * @param {object} config a muscle entry from rankingConfig.js
 * @param {unknown} lifts whatever arrived in the request body
 * @returns {{ ok: true, lifts: object } | { ok: false, errors: string[] }}
 *
 * On success the returned `lifts` is a fresh object holding only the configured
 * lifts and only their weight and reps, so the engine can never be reached by a
 * key or a property this function did not look at.
 */
export function validateLifts(config, lifts) {
  // typeof null and typeof [] are both "object", and an array of lifts is a
  // client bug rather than something to interpret, so both are refused here.
  if (lifts === null || typeof lifts !== "object" || Array.isArray(lifts)) {
    return {
      ok: false,
      errors: [
        `"lifts" must be an object with one entry per lift: ` +
          `${quote(config.lifts.map((lift) => lift.key))}.`,
      ],
    };
  }

  const errors = [];
  const checked = {};

  for (const lift of config.lifts) {
    const { key, bounds } = lift;

    // hasOwn, not `in`: a key inherited from Object.prototype is not a lift.
    if (!Object.hasOwn(lifts, key)) {
      errors.push(`Missing lift "${key}". Every lift is required.`);
      continue;
    }

    const entry = lifts[key];
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      errors.push(`Lift "${key}" must be an object with a weight and a reps.`);
      continue;
    }

    const { weight, reps } = entry;

    // typeof first: it is the only check that rejects strings, booleans, null
    // and arrays. Number.isFinite alone would accept none of those, but it would
    // also accept nothing useful to say about them.
    if (typeof weight !== "number" || !Number.isFinite(weight)) {
      errors.push(`Weight for "${key}" must be a number.`);
    } else if (weight < bounds.weight.min || weight > bounds.weight.max) {
      errors.push(`Weight for "${key}" must be between ${range(bounds.weight)} lb.`);
    }

    if (typeof reps !== "number" || !Number.isFinite(reps)) {
      errors.push(`Reps for "${key}" must be a number.`);
    } else if (!Number.isInteger(reps)) {
      errors.push(`Reps for "${key}" must be a whole number.`);
    } else if (reps < bounds.reps.min || reps > bounds.reps.max) {
      errors.push(`Reps for "${key}" must be between ${range(bounds.reps)}.`);
    }

    checked[key] = { weight, reps };
  }

  // Reported rather than ignored: a key the server does not score is almost
  // always a typo in a lift name, and silently scoring 0 for it would hand back
  // a rank the user cannot explain.
  const known = new Set(config.lifts.map((lift) => lift.key));
  for (const key of Object.keys(lifts)) {
    if (!known.has(key)) {
      errors.push(`Unknown lift "${key}". This muscle scores ${quote([...known])}.`);
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, lifts: checked };
}
