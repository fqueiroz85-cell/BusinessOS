import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  // A cadeia de dependências do @storybook/addon-vitest passa por pacotes
  // CommonJS antigos (aria-query, lz-string, dequal...) cujos named/default
  // exports o pré-bundler do Vite não consegue detectar sozinho. Sem isto, os
  // 11 arquivos de story falham no *import* — a suíte inteira nunca chega a
  // rodar um teste sequer ("does not provide an export named 'elementRoles'",
  // depois "...named 'default'"). Listar os pacotes em optimizeDeps.include
  // força a conversão para ESM com interop correto.
  optimizeDeps: {
    include: [
      'aria-query',
      'lz-string',
      'dequal',
      '@testing-library/dom',
      '@testing-library/user-event',
    ],
  },
  resolve: {
    // @testing-library/dom traz uma cópia aninhada de aria-query@5.3.0; a raiz
    // tem a 5.3.2. Duas cópias do mesmo pacote CJS confundem o otimizador.
    dedupe: ['aria-query', 'lz-string'],
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
