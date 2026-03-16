import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: signalId } = await params;
    const { action, userId, reason, parsedRecommendations, suggestedChanges } = await request.json();

    if (!action || !userId) {
      return NextResponse.json(
        { error: 'action and userId are required' },
        { status: 400 }
      );
    }

    // Handle different actions
    switch (action) {
      case 'accept':
        return await handleAcceptAction(signalId, userId, parsedRecommendations, suggestedChanges);

      case 'reject':
        return await handleRejectAction(signalId, userId, reason);

      case 'review':
        return await handleReviewAction(signalId, userId);

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Must be 'accept', 'reject', or 'review'` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error processing CI signal action:', error);
    return NextResponse.json(
      { error: 'Failed to process action', details: error.message },
      { status: 500 }
    );
  }
}

async function handleAcceptAction(
  signalId: string,
  userId: string,
  parsedRecommendations: any[],
  suggestedChanges?: any[]
) {
  try {
    // Get full CI signal details
    const signal = await db.getCISignal(signalId);

    if (!signal) {
      return NextResponse.json(
        { error: 'CI signal not found' },
        { status: 404 }
      );
    }

    // Get current procedure and steps
    const procedure = await db.getProcedureWithSteps(signal.procedure_id) as any;

    if (!procedure) {
      return NextResponse.json(
        { error: 'Procedure not found' },
        { status: 404 }
      );
    }

    // Get current version
    const currentVersion = procedure.current_version || '1.0';

    // Calculate new version (increment minor version)
    const [major, minor] = currentVersion.split('.').map(Number);
    const newVersion = `${major}.${minor + 1}`;

    // Identify affected steps
    // If suggestedChanges provided, use those; otherwise, try to infer from recommendations
    let affectedSteps: any[] = [];

    if (suggestedChanges && suggestedChanges.length > 0) {
      // Use AI-provided suggested changes - map to confirmationData format
      affectedSteps = suggestedChanges.map((change: any) => {
        // Find the actual step to get the step name
        const actualStep = procedure.steps?.find((s: any) =>
          s.step_id === change.stepId || s.step_number === change.stepNumber
        );

        return {
          stepId: change.stepId,
          stepNumber: change.stepNumber,
          stepName: actualStep?.step_name || `Step ${change.stepNumber}`,
          currentContent: change.currentContent,
          proposedContent: change.suggestedContent, // Map suggestedContent → proposedContent
          changeReason: change.reason || 'Based on CI signal recommendation'
        };
      });
    } else if (parsedRecommendations) {
      // Try to infer changes from parsed recommendations
      // For now, we'll flag this as requiring manual review rather than auto-applying
      // This is the safer approach for the "preview then confirm" workflow

      // Generate placeholder affected steps based on signal context
      const targetSteps = procedure.steps?.filter((step: any) => {
        // If signal has a specific step_id, use that
        if (signal.step_id === step.step_id) return true;

        // Otherwise, look for steps mentioned in recommendations
        const mentioned = parsedRecommendations.some((rec: any) =>
          rec.affectedSteps?.includes(step.step_id) ||
          rec.description?.includes(`Step ${step.step_number}`)
        );
        return mentioned;
      }) || [];

      affectedSteps = targetSteps.map((step: any) => ({
        stepId: step.step_id,
        stepNumber: step.step_number,
        stepName: step.step_name,
        currentContent: step.description || step.step_name,
        proposedContent: `[AI Review Required] ${signal.recommendation_text.substring(0, 200)}`,
        changeReason: 'Based on CI signal recommendation'
      }));

      // If no steps found, target the step mentioned in signal or first step
      if (affectedSteps.length === 0) {
        const targetStep = signal.step_id
          ? procedure.steps?.find((s: any) => s.step_id === signal.step_id)
          : procedure.steps?.[0];

        if (targetStep) {
          affectedSteps = [{
            stepId: targetStep.step_id,
            stepNumber: targetStep.step_number,
            stepName: targetStep.step_name,
            currentContent: targetStep.description || targetStep.step_name,
            proposedContent: `${targetStep.description || targetStep.step_name}\n\n[Recommended Improvement]: ${signal.recommendation_text}`,
            changeReason: 'Addressing CI signal'
          }];
        }
      }
    }

    // Return confirmation data (DO NOT apply changes yet - user must confirm)
    return NextResponse.json({
      success: true,
      requiresConfirmation: true,
      confirmationData: {
        procedureId: signal.procedure_id,
        currentVersion,
        newVersion,
        affectedSteps,
        estimatedImpact: {
          expectedComplianceIncrease: signal.evidence?.skip_rate
            ? Math.round(signal.evidence.skip_rate * 0.5) // Optimistic: 50% improvement
            : undefined,
          expectedIncidentReduction: signal.evidence?.incident_rate
            ? Math.round(signal.evidence.incident_rate * 0.3) // Conservative: 30% reduction
            : undefined
        }
      },
      message: 'Review proposed changes before applying'
    });

  } catch (error: any) {
    console.error('Error handling accept action:', error);
    return NextResponse.json(
      { error: 'Failed to prepare changes', details: error.message },
      { status: 500 }
    );
  }
}

async function handleRejectAction(
  signalId: string,
  userId: string,
  reason?: string
) {
  try {
    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Reject the CI signal
    await db.rejectCISignal(signalId, userId, reason);

    return NextResponse.json({
      success: true,
      message: 'CI signal rejected successfully',
      signalId,
      status: 'rejected'
    });

  } catch (error: any) {
    console.error('Error handling reject action:', error);
    return NextResponse.json(
      { error: 'Failed to reject signal', details: error.message },
      { status: 500 }
    );
  }
}

async function handleReviewAction(
  signalId: string,
  userId: string
) {
  try {
    // Mark signal as under review and navigate to editor
    await db.updateCISignalStatus(signalId, 'under_review', userId);

    // Get signal details for editor URL
    const signal = await db.getCISignal(signalId);

    if (!signal) {
      return NextResponse.json(
        { error: 'CI signal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Signal marked for review',
      signalId,
      status: 'under_review',
      editorUrl: `/mso/procedures/${signal.procedure_id}?signal=${signalId}&recommendation=${encodeURIComponent(signal.recommendation_text)}`
    });

  } catch (error: any) {
    console.error('Error handling review action:', error);
    return NextResponse.json(
      { error: 'Failed to mark for review', details: error.message },
      { status: 500 }
    );
  }
}
