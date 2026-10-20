import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Keep one icon set: lucide-react. Keep one Supabase entry point per runtime.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "@supabase/supabase-js", importNames: ["createClient"], message: "Use the helpers in src/lib/supabase/* instead." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/lib/supabase/admin.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
];

export default eslintConfig;
