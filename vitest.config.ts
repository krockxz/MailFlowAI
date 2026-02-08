/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        include: ['src/**/__tests__/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['node_modules', 'dist'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'dist/',
                'src/test/',
                '**/*.test.ts',
                '**/*.test.tsx',
                '**/*.spec.ts',
                '**/*.spec.tsx',
                'src/main.tsx',
                'src/vite-env.d.ts',
            ],
            thresholds: {
                lines: 90,
                functions: 90,
                branches: 85,
                statements: 90,
            },
        },
    },
});
