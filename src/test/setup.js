import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// afterEach é global devido a globals: true no vitest.config.js
afterEach(() => {
    cleanup();
});
