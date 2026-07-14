import { NextRequest, NextResponse } from 'next/server';
import { getZAIConfigFromEnv } from '@/lib/zai-init';
import fs from 'fs';
import path from 'path';

let zaiInstance: any = null;
async function getZAI() {
  if (!zaiInstance) {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const envConfig = getZAIConfigFromEnv();
    if (envConfig) {
      zaiInstance = new ZAI(envConfig);
    } else {
      zaiInstance = await ZAI.create();
    }
  }
  return zaiInstance;
}

const BUILD_SYSTEM_PROMPT = `You are a website code generator. When given a description, you must output a JSON object with the following structure:

{
  "files": [
    {
      "path": "index.html",
      "content": "<!DOCTYPE html>..."
    },
    {
      "path": "styles.css",
      "content": "body { ... }"
    },
    {
      "path": "script.js",
      "content": "// JavaScript code..."
    }
  ],
  "description": "Brief description of the website",
  "techStack": "HTML, CSS, JavaScript"
}

CRITICAL RULES:
1. Generate COMPLETE, runnable code — not fragments or pseudocode
2. For a website, always include at least index.html with embedded or linked CSS/JS
3. All CSS should be in style tags or a separate styles.css file
4. All JavaScript should be in script tags or a separate script.js file  
5. The index.html must be a COMPLETE HTML document with <!DOCTYPE html>, <html>, <head>, <body>
6. Make the website visually appealing with modern CSS (gradients, shadows, responsive design)
7. Use inline styles or embedded CSS if keeping it simple, or separate files for larger projects
8. Include proper meta tags, viewport settings for responsive design
9. The website should be fully functional as a standalone static site
10. Return ONLY the JSON object, no markdown fences, no explanation outside the JSON

Generate a beautiful, modern, responsive website based on the user's description.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description, agentId } = body;

    if (!description) {
      return NextResponse.json({ error: 'description is required' }, { status: 400 });
    }

    // Generate code using LLM
    let projectData: any;
    try {
      const zai = await getZAI();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: BUILD_SYSTEM_PROMPT },
          { role: 'user', content: `Build a website with the following description: ${description}` },
        ],
        stream: false,
        thinking: { type: 'disabled' },
      });

      let responseText = completion.choices?.[0]?.message?.content || '';
      
      // Clean up response - remove markdown fences if present
      responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      // Try to parse JSON
      try {
        projectData = JSON.parse(responseText);
      } catch (parseError) {
        // If JSON parsing fails, create a simple HTML wrapper
        projectData = {
          files: [
            {
              path: 'index.html',
              content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Website</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .hero { text-align: center; padding: 4rem 2rem; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); }
    .hero h1 { font-size: 3rem; background: linear-gradient(135deg, #14b8a6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1rem; }
    .hero p { font-size: 1.2rem; color: #94a3b8; max-width: 600px; margin: 0 auto; }
    .content { padding: 2rem; }
    pre { background: #1e293b; padding: 1.5rem; border-radius: 12px; overflow-x: auto; border: 1px solid #334155; }
    code { font-family: 'Fira Code', monospace; font-size: 0.875rem; line-height: 1.7; color: #e2e8f0; white-space: pre-wrap; word-wrap: break-word; }
  </style>
</head>
<body>
  <div class="hero">
    <h1>Generated Website</h1>
    <p>Website built by DevAgent</p>
  </div>
  <div class="content container">
    <pre><code>${responseText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
  </div>
</body>
</html>`
            }
          ],
          description: 'Generated website',
          techStack: 'HTML, CSS'
        };
      }
    } catch (llmError: any) {
      console.error('Build LLM call failed:', llmError?.message);
      return NextResponse.json({ error: 'Failed to generate website: ' + llmError?.message }, { status: 500 });
    }

    // Validate and ensure we have files
    if (!projectData.files || !Array.isArray(projectData.files) || projectData.files.length === 0) {
      return NextResponse.json({ error: 'No files generated' }, { status: 500 });
    }

    // Create project directory
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const projectDir = path.join(process.cwd(), 'generated-projects', projectId);

    // Write files to disk
    for (const file of projectData.files) {
      const filePath = path.join(projectDir, file.path);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, file.content, 'utf-8');
    }

    // Save project metadata
    const metadata = {
      id: projectId,
      description: projectData.description || description,
      techStack: projectData.techStack || 'HTML, CSS, JavaScript',
      files: projectData.files.map((f: any) => f.path),
      createdAt: new Date().toISOString(),
      agentId: agentId || 'agent_dev',
    };
    fs.writeFileSync(path.join(projectDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8');

    // Build the response
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    return NextResponse.json({
      success: true,
      projectId,
      description: metadata.description,
      techStack: metadata.techStack,
      files: metadata.files,
      previewUrl: `${baseUrl}/api/agents/download?projectId=${projectId}&file=index.html&mode=preview`,
      downloadUrl: `${baseUrl}/api/agents/download?projectId=${projectId}&mode=zip`,
      fileTree: projectData.files.map((f: any) => ({
        path: f.path,
        size: f.content.length,
        viewUrl: `${baseUrl}/api/agents/download?projectId=${projectId}&file=${f.path}&mode=preview`,
      })),
    });
  } catch (error: any) {
    console.error('Build error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
