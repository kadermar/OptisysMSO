import { NextResponse } from 'next/server';

/**
 * POST /api/test/ci-signal-improvement
 * Test the improved CI signal recommendation parsing that generates actual improved content
 */
export async function POST(request: Request) {
  try {
    // Example CI signal data
    const testSignal = {
      procedureId: 'INT-031',
      recommendationText: 'Clarify instruction language with specific measurements and acceptance criteria to reduce operator confusion and skip rates',
      evidence: {
        skip_rate: 68,
        compliance_rate: 74,
        incidents_last_90_days: 3,
        avg_completion_time: 240
      },
      suggestedChange: 'Add specific measurement thresholds and verification steps'
    };

    console.log('Testing improved AI recommendation parsing...');
    console.log('Input:', testSignal.recommendationText);

    // Call the parse-recommendation endpoint
    const response = await fetch(`${request.url.replace('/test/ci-signal-improvement', '/ai/parse-recommendation')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testSignal)
    });

    if (!response.ok) {
      throw new Error(`Parse API failed: ${response.status}`);
    }

    const result = await response.json();

    // Analyze the response
    const analysis = {
      has_actionable_items: result.actionableItems?.length > 0,
      has_suggested_changes: result.suggestedStepChanges?.length > 0,
      actionable_items_count: result.actionableItems?.length || 0,
      suggested_changes_count: result.suggestedStepChanges?.length || 0,
      confidence: result.confidence,

      // Check if AI actually rewrote content (not just generic recommendations)
      content_quality: {
        has_specific_content: false,
        has_measurements: false,
        is_actionable: false,
        example_content: ''
      }
    };

    if (result.suggestedStepChanges && result.suggestedStepChanges.length > 0) {
      const firstChange = result.suggestedStepChanges[0];
      const suggestedContent = firstChange.suggestedContent || '';

      analysis.content_quality = {
        has_specific_content: suggestedContent.length > 100,
        has_measurements: /\d+/.test(suggestedContent) || /specific|measure|verify|threshold|criteria/i.test(suggestedContent),
        is_actionable: suggestedContent !== firstChange.currentContent,
        example_content: suggestedContent.substring(0, 200) + (suggestedContent.length > 200 ? '...' : '')
      };
    }

    // Determine if the improvement is good
    const is_improved =
      analysis.has_suggested_changes &&
      analysis.content_quality.has_specific_content &&
      analysis.content_quality.is_actionable;

    return NextResponse.json({
      test: 'CI Signal Improvement Quality',
      input: {
        procedure_id: testSignal.procedureId,
        recommendation: testSignal.recommendationText
      },
      output: result,
      analysis,
      verdict: {
        passed: is_improved,
        message: is_improved
          ? '✅ AI successfully generated improved step content with specific details'
          : '❌ AI only provided generic recommendations, not actual improved content'
      }
    });

  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error.message
    }, { status: 500 });
  }
}
