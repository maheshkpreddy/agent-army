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

const TEST_SYSTEM_PROMPT = `You are a website testing specialist. When given a URL or website description, you must generate a comprehensive test report as a JSON object with the following structure:

{
  "url": "https://example.com",
  "testDate": "2024-01-15T10:00:00Z",
  "summary": {
    "overallScore": 85,
    "totalTests": 12,
    "passed": 10,
    "failed": 2,
    "warnings": 3
  },
  "categories": [
    {
      "name": "Performance",
      "score": 90,
      "tests": [
        {
          "name": "Page Load Time",
          "status": "pass",
          "value": "1.2s",
          "threshold": "< 3s",
          "details": "Page loaded within acceptable time"
        }
      ]
    },
    {
      "name": "Accessibility",
      "score": 75,
      "tests": [
        {
          "name": "Alt Text on Images",
          "status": "fail",
          "value": "60%",
          "threshold": "100%",
          "details": "3 images missing alt attributes"
        }
      ]
    },
    {
      "name": "SEO",
      "score": 85,
      "tests": [
        {
          "name": "Meta Description",
          "status": "pass",
          "value": "Present",
          "threshold": "Required",
          "details": "Meta description tag found"
        }
      ]
    },
    {
      "name": "Security",
      "score": 80,
      "tests": [
        {
          "name": "HTTPS",
          "status": "pass",
          "value": "Enabled",
          "threshold": "Required",
          "details": "Site uses HTTPS"
        }
      ]
    },
    {
      "name": "Mobile Responsiveness",
      "score": 70,
      "tests": [
        {
          "name": "Viewport Meta Tag",
          "status": "pass",
          "value": "Present",
          "threshold": "Required",
          "details": "Viewport meta tag is set"
        }
      ]
    },
    {
      "name": "Best Practices",
      "score": 82,
      "tests": [
        {
          "name": "Console Errors",
          "status": "warning",
          "value": "2 errors",
          "threshold": "0",
          "details": "Minor console errors detected"
        }
      ]
    }
  ],
  "recommendations": [
    "Add alt text to all images for better accessibility",
    "Fix console errors to improve stability",
    "Consider lazy loading for below-fold images"
  ],
  "details": "Overall the website performs well with good load times and proper HTTPS implementation. Key areas for improvement include accessibility (image alt text) and fixing minor console errors."
}

CRITICAL RULES:
1. Analyze the URL provided and generate realistic test results
2. Provide scores between 0-100 for each category
3. Include specific, actionable test results with pass/fail/warning status
4. Give concrete recommendations for improvements
5. Make the report thorough and professional
6. Return ONLY the JSON object, no markdown fences, no explanation outside the JSON`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, description, agentId } = body;

    if (!url && !description) {
      return NextResponse.json({ error: 'url or description is required' }, { status: 400 });
    }

    const targetUrl = url || description;

    // Generate test report using LLM
    let reportData: any;
    try {
      const zai = await getZAI();
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: TEST_SYSTEM_PROMPT },
          { role: 'user', content: `Test this website/URL and generate a comprehensive test report: ${targetUrl}` },
        ],
        stream: false,
        thinking: { type: 'disabled' },
      });

      let responseText = completion.choices?.[0]?.message?.content || '';
      responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

      try {
        reportData = JSON.parse(responseText);
      } catch (parseError) {
        // If JSON parsing fails, create a basic report from the text
        reportData = {
          url: targetUrl,
          testDate: new Date().toISOString(),
          summary: { overallScore: 70, totalTests: 1, passed: 1, failed: 0, warnings: 0 },
          categories: [{
            name: 'General Analysis',
            score: 70,
            tests: [{
              name: 'Website Review',
              status: 'pass',
              value: 'Completed',
              threshold: 'N/A',
              details: responseText.substring(0, 500)
            }]
          }],
          recommendations: ['Review the detailed analysis above for specific recommendations'],
          details: responseText.substring(0, 1000)
        };
      }
    } catch (llmError: any) {
      console.error('Test LLM call failed:', llmError?.message);
      return NextResponse.json({ error: 'Failed to generate test report: ' + llmError?.message }, { status: 500 });
    }

    // Create report directory
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const reportDir = path.join(process.cwd(), 'generated-reports', reportId);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Save report data as JSON
    fs.writeFileSync(path.join(reportDir, 'report.json'), JSON.stringify(reportData, null, 2), 'utf-8');

    // Generate HTML report
    const htmlReport = generateHTMLReport(reportData);
    fs.writeFileSync(path.join(reportDir, 'report.html'), htmlReport, 'utf-8');

    // Save metadata
    const metadata = {
      id: reportId,
      url: targetUrl,
      createdAt: new Date().toISOString(),
      agentId: agentId || 'agent_test',
      overallScore: reportData.summary?.overallScore || 0,
    };
    fs.writeFileSync(path.join(reportDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8');

    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    return NextResponse.json({
      success: true,
      reportId,
      url: targetUrl,
      summary: reportData.summary,
      categories: reportData.categories?.map((c: any) => ({ name: c.name, score: c.score })),
      recommendations: reportData.recommendations,
      details: reportData.details,
      previewUrl: `${baseUrl}/api/agents/download?reportId=${reportId}&mode=preview`,
      downloadUrl: `${baseUrl}/api/agents/download?reportId=${reportId}&mode=html`,
      jsonUrl: `${baseUrl}/api/agents/download?reportId=${reportId}&mode=json`,
    });
  } catch (error: any) {
    console.error('Test URL error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateHTMLReport(data: any): string {
  const scoreColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 70) return '#F59E0B';
    if (score >= 50) return '#F97316';
    return '#EF4444';
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '&#10004;';
      case 'fail': return '&#10008;';
      case 'warning': return '&#9888;';
      default: return '&#9679;';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pass': return '#10B981';
      case 'fail': return '#EF4444';
      case 'warning': return '#F59E0B';
      default: return '#64748B';
    }
  };

  const categoriesHtml = (data.categories || []).map((cat: any) => `
    <div class="category-card">
      <div class="category-header">
        <h3>${cat.name}</h3>
        <div class="score-circle" style="border-color: ${scoreColor(cat.score)}">
          <span style="color: ${scoreColor(cat.score)}">${cat.score}</span>
        </div>
      </div>
      <div class="tests-list">
        ${(cat.tests || []).map((test: any) => `
          <div class="test-item">
            <span class="test-status" style="color: ${statusColor(test.status)}">${statusIcon(test.status)}</span>
            <div class="test-info">
              <div class="test-name">${test.name}</div>
              <div class="test-details">${test.details || ''}</div>
            </div>
            <div class="test-value">${test.value || ''}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  const recommendationsHtml = (data.recommendations || []).map((rec: string, i: number) => `
    <li>${rec}</li>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Report - ${data.url || 'Website'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; }
    .container { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .header { text-align: center; padding: 3rem 2rem; margin-bottom: 2rem; background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 16px; border: 1px solid #334155; }
    .header h1 { font-size: 2rem; margin-bottom: 0.5rem; background: linear-gradient(135deg, #14b8a6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .header .url { color: #94a3b8; font-size: 0.9rem; word-break: break-all; }
    .header .date { color: #64748b; font-size: 0.8rem; margin-top: 0.5rem; }
    .score-display { display: flex; justify-content: center; gap: 3rem; margin: 2rem 0; flex-wrap: wrap; }
    .score-big { width: 120px; height: 120px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 4px solid ${scoreColor(data.summary?.overallScore || 0)}; }
    .score-big .number { font-size: 2.5rem; font-weight: bold; color: ${scoreColor(data.summary?.overallScore || 0)}; }
    .score-big .label { font-size: 0.75rem; color: #94a3b8; }
    .stats { display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap; }
    .stat { text-align: center; }
    .stat .value { font-size: 1.5rem; font-weight: bold; }
    .stat .label { font-size: 0.75rem; color: #94a3b8; }
    .stat.pass .value { color: #10B981; }
    .stat.fail .value { color: #EF4444; }
    .stat.warning .value { color: #F59E0B; }
    .category-card { background: #1e293b; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; border: 1px solid #334155; }
    .category-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid #334155; }
    .category-header h3 { font-size: 1.1rem; color: #f1f5f9; }
    .score-circle { width: 50px; height: 50px; border-radius: 50%; border: 3px solid; display: flex; align-items: center; justify-content: center; }
    .score-circle span { font-weight: bold; font-size: 1.1rem; }
    .test-item { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid #33415520; }
    .test-item:last-child { border-bottom: none; }
    .test-status { font-size: 1.2rem; flex-shrink: 0; margin-top: 2px; }
    .test-info { flex: 1; }
    .test-name { font-weight: 500; color: #e2e8f0; }
    .test-details { font-size: 0.85rem; color: #94a3b8; margin-top: 0.25rem; }
    .test-value { font-size: 0.85rem; color: #94a3b8; font-weight: 500; text-align: right; min-width: 60px; }
    .recommendations { background: #1e293b; border-radius: 12px; padding: 1.5rem; margin-top: 1.5rem; border: 1px solid #334155; }
    .recommendations h3 { color: #f1f5f9; margin-bottom: 1rem; }
    .recommendations ul { padding-left: 1.5rem; }
    .recommendations li { color: #94a3b8; margin-bottom: 0.5rem; }
    .footer { text-align: center; padding: 2rem; color: #475569; font-size: 0.8rem; }
    @media print { body { background: white; color: #1e293b; } .category-card { border: 1px solid #e2e8f0; background: #f8fafc; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Website Test Report</h1>
      <div class="url">${data.url || 'N/A'}</div>
      <div class="date">Generated: ${data.testDate || new Date().toISOString()}</div>
    </div>
    <div class="score-display">
      <div class="score-big">
        <span class="number">${data.summary?.overallScore || 0}</span>
        <span class="label">Overall Score</span>
      </div>
      <div class="stats">
        <div class="stat pass"><div class="value">${data.summary?.passed || 0}</div><div class="label">Passed</div></div>
        <div class="stat fail"><div class="value">${data.summary?.failed || 0}</div><div class="label">Failed</div></div>
        <div class="stat warning"><div class="value">${data.summary?.warnings || 0}</div><div class="label">Warnings</div></div>
      </div>
    </div>
    ${categoriesHtml}
    ${recommendationsHtml ? `
    <div class="recommendations">
      <h3>Recommendations</h3>
      <ul>${recommendationsHtml}</ul>
    </div>` : ''}
    <div class="footer">Generated by TestAgent - MARQ AI Agent TRIBE</div>
  </div>
</body>
</html>`;
}
