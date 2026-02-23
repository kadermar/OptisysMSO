import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { documentText, procedures } = body;

    if (!documentText) {
      return NextResponse.json(
        { error: 'Document text is required' },
        { status: 400 }
      );
    }

    // Call OpenAI to analyze the regulation document
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.warn('OPENAI_API_KEY not configured, returning mock analysis');
      return mockAnalysis(documentText, procedures);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert regulatory compliance analyst. Analyze regulation documents and extract key information.

Available procedures:
${procedures.map((p: any) => `- ${p.id}: ${p.name} (${p.category})`).join('\n')}

Your task:
1. Extract the regulation title, source/standard number, and priority (low/medium/high/critical)
2. Write a concise summary (2-3 sentences)
3. Identify which procedures are likely affected based on their names and categories
4. List key changes or requirements (3-5 bullet points)

Respond ONLY with valid JSON in this format:
{
  "title": "extracted title",
  "source": "standard/regulation number",
  "priority": "high",
  "summary": "brief summary",
  "affectedProcedures": ["PROC-001", "PROC-002"],
  "keyChanges": ["change 1", "change 2", "change 3"]
}`
          },
          {
            role: 'user',
            content: `Analyze this regulation document:\n\n${documentText.slice(0, 8000)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return mockAnalysis(documentText, procedures);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return mockAnalysis(documentText, procedures);
    }

    // Parse the JSON response
    const analysis = JSON.parse(content);

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error.message },
      { status: 500 }
    );
  }
}

// Mock analysis fallback when OpenAI is not available
function mockAnalysis(documentText: string, procedures: any[]) {
  const doc = documentText.toLowerCase();

  // Try to extract title from first line
  const lines = documentText.split('\n').filter(l => l.trim());
  const title = lines[0]?.substring(0, 100) || 'Regulation Update';

  // Detect priority based on keywords
  let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (doc.includes('critical') || doc.includes('immediate') || doc.includes('mandatory')) {
    priority = 'critical';
  } else if (doc.includes('high priority') || doc.includes('safety') || doc.includes('hazard')) {
    priority = 'high';
  } else if (doc.includes('low priority') || doc.includes('optional')) {
    priority = 'low';
  }

  // Try to find standard/source number
  const sourceMatch = documentText.match(/(?:OSHA|ISO|ANSI|NFPA|EPA)\s*[\d.-]+/i);
  const source = sourceMatch?.[0] || 'Regulatory Standard';

  // Identify potentially affected procedures based on keywords
  const keywords = ['safety', 'maintenance', 'quality', 'environmental', 'inspection', 'lockout', 'tagout', 'equipment'];
  const affectedProcedures = procedures
    .filter(p => {
      const procText = `${p.name} ${p.category}`.toLowerCase();
      return keywords.some(kw => doc.includes(kw) && procText.includes(kw));
    })
    .map(p => p.id)
    .slice(0, 5); // Limit to 5 procedures

  // Extract key changes (simple approach - look for numbered lists or bullet points)
  const keyChanges: string[] = [];
  const changeMatches = documentText.match(/(?:^|\n)\s*[\d\-•]\s*(.+?)(?=\n|$)/g);
  if (changeMatches) {
    keyChanges.push(...changeMatches.slice(0, 5).map(m => m.replace(/^[\s\d\-•]+/, '').trim()));
  }

  if (keyChanges.length === 0) {
    keyChanges.push(
      'Review and update affected procedures',
      'Implement new documentation requirements',
      'Update training materials'
    );
  }

  const summary = lines.slice(1, 4).join(' ').substring(0, 300) ||
    'This regulation introduces new requirements that may affect operational procedures. Please review the full document text below.';

  return NextResponse.json({
    title,
    source,
    priority,
    summary,
    affectedProcedures: affectedProcedures.length > 0 ? affectedProcedures : procedures.slice(0, 3).map((p: any) => p.id),
    keyChanges
  });
}
