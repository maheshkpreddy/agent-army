import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '/home/z/my-project/marqaiskills/public/images';

const PROMPTS = [
  {
    name: 'hero-dashboard.png',
    prompt: 'Futuristic AI analytics dashboard interface, dark theme with glowing purple and blue data visualizations, charts and graphs floating in 3D space, holographic elements, clean modern design, high quality digital art, no text',
    size: '1440x720'
  },
  {
    name: 'ai-agents.png',
    prompt: 'Network of interconnected AI agents represented as glowing nodes and pathways, futuristic neural network visualization, vibrant purple and cyan colors on dark background, digital art style, high quality, no text',
    size: '1344x768'
  },
  {
    name: 'skills-library.png',
    prompt: 'Modern digital library of AI skills, floating holographic books and skill cards, gradient blue to purple lighting, futuristic knowledge base, clean design, digital illustration, high quality, no text',
    size: '1344x768'
  },
  {
    name: 'ai-directory.png',
    prompt: 'Abstract visualization of an AI project directory, interconnected software repositories shown as glowing crystals, circuit board patterns, deep blue and electric purple gradients, dark futuristic background, digital art, high quality, no text',
    size: '1344x768'
  },
  {
    name: 'role-access.png',
    prompt: 'Abstract representation of role-based access control, four concentric security rings with different colors (red, amber, blue, green), each unlocking different levels, dark futuristic background, digital art style, high quality, no text',
    size: '1024x1024'
  },
  {
    name: 'analytics-chart.png',
    prompt: 'Stylized analytics infographic with colorful bar charts, pie charts, and line graphs, dark background with neon glow effects, data visualization, modern dashboard aesthetic, purple and blue gradients, high quality, no text',
    size: '1344x768'
  },
  {
    name: 'platform-overview.png',
    prompt: 'Birds eye view of an AI platform ecosystem, central hub with radiating modules for skills, agents, directory, and analytics, connected by glowing pathways, isometric 3D style, dark theme with colorful accents, high quality, no text',
    size: '1440x720'
  }
];

async function generateImages() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const zai = await ZAI.create();
  let success = 0;
  let failed = 0;

  for (const item of PROMPTS) {
    const outputPath = path.join(OUTPUT_DIR, item.name);
    if (fs.existsSync(outputPath)) {
      console.log(`SKIP (exists): ${item.name}`);
      success++;
      continue;
    }
    try {
      console.log(`Generating: ${item.name}...`);
      const response = await zai.images.generations.create({
        prompt: item.prompt,
        size: item.size
      });
      const imageBase64 = response.data[0].base64;
      const buffer = Buffer.from(imageBase64, 'base64');
      fs.writeFileSync(outputPath, buffer);
      console.log(`OK: ${item.name} (${(buffer.length / 1024).toFixed(0)}KB)`);
      success++;
    } catch (err) {
      console.error(`FAIL: ${item.name} - ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${success} success, ${failed} failed`);
}

generateImages().catch(console.error);
