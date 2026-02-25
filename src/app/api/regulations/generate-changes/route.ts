import { NextResponse } from 'next/server';

// POST /api/regulations/generate-changes - Generate context-aware proposed changes
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { regulation, procedures } = body;

    if (!regulation || !procedures || !Array.isArray(procedures)) {
      return NextResponse.json(
        { error: 'Missing regulation or procedures data' },
        { status: 400 }
      );
    }

    // Build AI prompt with actual regulation content
    const prompt = `You are an expert in regulatory compliance for industrial procedures. Given this new regulation and the affected procedures, generate specific, actionable proposed changes to make each procedure compliant.

REGULATION:
Title: ${regulation.title}
Source: ${regulation.source}
Summary: ${regulation.summary}
Key Changes: ${regulation.keyChanges?.join('; ') || 'Not specified'}

Document Content:
${regulation.documentText || 'Not provided'}

AFFECTED PROCEDURES:
${procedures.map((proc: any) => `
Procedure: ${proc.name} (${proc.procedure_id})
Category: ${proc.category}
Steps:
${proc.steps?.map((s: any) => `  ${s.step_number}. ${s.step_name}: ${s.description || 'No description'}`).join('\n') || 'No steps found'}
`).join('\n---\n')}

TASK:
For each procedure, identify 1-3 specific steps that need to be modified to comply with this regulation. For each change:
1. Select the most relevant existing step to modify
2. Write the proposed new text that incorporates the regulation's requirements
3. Provide a clear reason citing the specific regulation requirement

Return a JSON array with this structure:
[
  {
    "procedureId": "PROC-XXX",
    "procedureName": "Procedure Name",
    "changes": [
      {
        "stepId": "STEP-XXX",
        "stepNumber": 5,
        "currentText": "Current step description",
        "proposedText": "Modified step description with regulation requirements added",
        "reason": "Specific regulation section/requirement that necessitates this change"
      }
    ]
  }
]

Focus on changes that are:
- Directly related to the regulation's requirements
- Practical and implementable
- Specific to each procedure's context
- Clear about what needs to be added/changed

Return ONLY the JSON array, no other text.`;

    // Call OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in industrial safety and quality regulations. You generate precise, actionable compliance changes for operational procedures.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Failed to generate proposed changes', details: error },
        { status: 500 }
      );
    }

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices[0]?.message?.content || '';

    // Parse JSON response
    let proposedChanges;
    try {
      // Extract JSON from response (in case AI wrapped it in markdown)
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        proposedChanges = JSON.parse(jsonMatch[0]);
      } else {
        proposedChanges = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: aiResponse.substring(0, 500) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      proposedChanges
    });

  } catch (error: any) {
    console.error('Error generating changes:', error);
    return NextResponse.json(
      { error: 'Failed to generate changes', details: error.message },
      { status: 500 }
    );
  }
}
