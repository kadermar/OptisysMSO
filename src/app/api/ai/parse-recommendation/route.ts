import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { recommendationText, suggestedChange, procedureId, evidence } = await request.json();

    if (!recommendationText || !procedureId) {
      return NextResponse.json(
        { error: 'recommendationText and procedureId are required' },
        { status: 400 }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });

    // Fetch procedure context with full step details
    let procedureContext = '';
    let procedureSteps: any[] = [];
    try {
      const procedure = await db.getProcedureWithSteps(procedureId) as any;
      if (procedure) {
        procedureSteps = procedure.steps || [];
        procedureContext = `
Procedure: ${procedure.name} (${procedureId})
Category: ${procedure.category}
Total Steps: ${procedure.total_steps}
Description: ${procedure.description || 'N/A'}

Current Steps (with full content):
${procedureSteps.map((s: any) => `
Step ${s.step_number} (ID: ${s.step_id}): ${s.step_name}
Current Content: ${s.step_content || s.description || 'No content'}
Duration: ${s.typical_duration_minutes} minutes | Criticality: ${s.criticality}
`).join('\n---\n')}
`;
      }
    } catch (err) {
      console.error('Failed to fetch procedure context:', err);
    }

    // Prepare structured prompt
    const prompt = `You are a technical writing expert specializing in industrial procedures. Your job is to REWRITE procedure steps with improvements already applied - NOT to describe what should be improved.

**CONTEXT:**
${procedureContext}

**EVIDENCE:**
${JSON.stringify(evidence, null, 2)}

**RECOMMENDATION:**
${recommendationText}

${suggestedChange ? `**SUGGESTED CHANGE:**\n${suggestedChange}\n` : ''}

**YOUR TASK:**
Rewrite the affected procedure step(s) with the recommendation already incorporated. The rewritten text should be ready to use immediately.

**CRITICAL EXAMPLES:**

Example 1 - Adding Measurements:
Current: "Check the pressure gauge"
Recommendation: "Add specific pressure thresholds"
❌ BAD: "action": "Add specific pressure thresholds"
✅ GOOD: "suggestedContent": "Check the pressure gauge and verify reading is between 50-75 PSI. If outside range, immediately notify supervisor and record deviation in system log."

Example 2 - Clarifying Language:
Current: "Inspect equipment"
Recommendation: "Clarify inspection criteria"
❌ BAD: "action": "Clarify inspection criteria"
✅ GOOD: "suggestedContent": "Inspect equipment for: (1) visible cracks or damage, (2) loose bolts or fasteners, (3) fluid leaks, (4) unusual sounds during operation. Document all findings with photos."

Example 3 - Adding Safety Steps:
Current: "Remove cover"
Recommendation: "Add lockout/tagout verification"
❌ BAD: "action": "Add lockout/tagout verification"
✅ GOOD: "suggestedContent": "Before removing cover, verify lockout/tagout is in place: (1) Confirm all energy sources are isolated, (2) Test with voltage meter (must read <50V), (3) Document lock serial numbers and technician name, (4) Get second-person verification signature before proceeding."

**REQUIREMENTS:**
1. Read the CURRENT step content from the procedure above
2. Identify which step needs improvement based on the recommendation
3. REWRITE the step with improvements incorporated (don't describe - REWRITE!)
4. Make it specific: include numbers, thresholds, tools, measurements
5. Make it actionable: use imperative verbs (verify, measure, document, confirm)
6. Keep the original purpose but add the missing details

**OUTPUT FORMAT:**
You MUST return valid JSON with this exact structure:

{
  "actionableItems": [
    {
      "id": "1",
      "action": "Brief summary (e.g., 'Added specific pressure thresholds')",
      "description": "Why this helps (e.g., 'Reduces ambiguity and operator errors')",
      "priority": "high",
      "affectedSteps": ["COR-5"]
    }
  ],
  "suggestedStepChanges": [
    {
      "stepId": "COR-5",
      "stepNumber": 5,
      "currentContent": "The EXACT current content from procedure above",
      "suggestedContent": "The COMPLETE REWRITTEN text with all improvements - this must be actual procedure language, not a description",
      "reason": "Adds specific measurement thresholds to reduce 68% skip rate"
    }
  ],
  "confidence": 0.95
}

**VALIDATION CHECKLIST:**
Before responding, verify:
✓ "suggestedContent" is actual procedure text (not a description)
✓ "suggestedContent" includes specific values/measurements/tools
✓ "suggestedContent" is longer and more detailed than "currentContent"
✓ "suggestedContent" can be copied directly into the procedure

Respond ONLY with the JSON object. No markdown, no explanation, no additional text.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o', // Use gpt-4o for better instruction following
      messages: [
        {
          role: 'system',
          content: 'You are a technical writing expert. You REWRITE procedure steps with improvements applied - you do NOT describe what should be done. You output ONLY valid JSON with actual rewritten procedure text in "suggestedContent" field, never descriptions or summaries.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2, // Very low temperature for precise, consistent output
      max_tokens: 3000, // More tokens for detailed rewrites
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content || '{}';

    // Parse the JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);

      // Ensure suggestedStepChanges exists
      if (!parsedResponse.suggestedStepChanges || parsedResponse.suggestedStepChanges.length === 0) {
        console.warn('AI did not provide suggestedStepChanges, using fallback');
        // Try to infer from the first step if available
        if (procedureSteps.length > 0) {
          const firstStep = procedureSteps[0];
          parsedResponse.suggestedStepChanges = [{
            stepId: firstStep.step_id,
            stepNumber: firstStep.step_number,
            currentContent: firstStep.step_content || firstStep.description,
            suggestedContent: suggestedChange || recommendationText,
            reason: 'Addresses CI signal recommendation'
          }];
        }
      }
    } catch (parseErr) {
      console.error('Failed to parse AI response:', responseText);
      // Fallback: Create basic structure from raw recommendation
      parsedResponse = {
        actionableItems: [{
          id: '1',
          action: recommendationText.substring(0, 60),
          description: suggestedChange || recommendationText,
          priority: 'high'
        }],
        suggestedStepChanges: procedureSteps.length > 0 ? [{
          stepId: procedureSteps[0].step_id,
          stepNumber: procedureSteps[0].step_number,
          currentContent: procedureSteps[0].step_content || procedureSteps[0].description,
          suggestedContent: suggestedChange || recommendationText,
          reason: 'Addresses CI signal recommendation'
        }] : [],
        confidence: 0.5
      };
    }

    // Cache the parsed recommendations in the database (if signal_id is provided in future)
    // For now, just return the parsed data

    return NextResponse.json({
      ...parsedResponse,
      raw_recommendation: recommendationText,
      procedure_id: procedureId
    });

  } catch (error: any) {
    console.error('Error parsing recommendation:', error);

    // Return a friendly error with fallback
    return NextResponse.json(
      {
        error: 'Failed to parse recommendation',
        details: error.message,
        // Provide fallback structure
        actionableItems: [{
          id: '1',
          action: 'Review recommendation manually',
          description: 'AI parsing failed. Please review the original recommendation text.',
          priority: 'high'
        }],
        confidence: 0
      },
      { status: 200 } // Return 200 with fallback data rather than error
    );
  }
}
