import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export async function buildPrompt(promptName, variables = {}) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const filePath = path.join(__dirname, `../prompts/${promptName}.md`);

  const raw = await fs.readFile(filePath, 'utf-8');
  const compiled = new Function(...Object.keys(variables), `return \`${raw}\`;`);
  return compiled(...Object.values(variables));
}
