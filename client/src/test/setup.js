import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Globals are off in vitest, so Testing Library cannot register its own
// auto-cleanup; without this, rendered trees leak between tests.
afterEach(() => {
  cleanup()
  localStorage.clear()
})
