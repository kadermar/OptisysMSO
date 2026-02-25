'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Shield,
  Calendar,
  AlertTriangle,
  FileText,
  ChevronLeft,
  Check,
  X,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  Edit,
  Save,
} from 'lucide-react';
import Link from 'next/link';

interface RegulationDetail {
  id: string;
  title: string;
  source: string;
  effectiveDate: string;
  priority: 'high' | 'medium' | 'low';
  affectedProcedures: string[];
  status: string;
  documentText: string;
  summary: string;
  keyChanges: string[];
  proposedChanges: {
    procedureId: string;
    procedureName: string;
    changes: {
      stepId: string;
      stepNumber: number;
      currentText: string;
      proposedText: string;
      reason: string;
      status: 'pending' | 'accepted' | 'rejected' | 'implemented';
    }[];
  }[];
}

export default function RegulationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [regulation, setRegulation] = useState<RegulationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDocument, setExpandedDocument] = useState(false);
  const [expandedProcedures, setExpandedProcedures] = useState<Set<string>>(new Set());
  const [editingChanges, setEditingChanges] = useState<Set<string>>(new Set());
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchRegulationDetail();
    }
  }, [params.id]);

  const fetchRegulationDetail = async () => {
    try {
      // Check if params.id exists
      if (!params.id) {
        console.error('No regulation ID provided');
        setLoading(false);
        return;
      }

      // Decode the regulation ID in case it was URL encoded
      const regulationId = decodeURIComponent(params.id as string);

      // Fetch regulation from database
      const regRes = await fetch(`/api/regulations/${encodeURIComponent(regulationId)}`);

      if (!regRes.ok) {
        console.error('Failed to fetch regulation:', regRes.status, 'ID:', regulationId);
        setLoading(false);
        return;
      }

      const regulationData = await regRes.json();
      const affectedProcedureIds = regulationData.affectedProcedures || [];

      // Fetch full procedure details with steps
      const proceduresWithSteps = await Promise.all(
        affectedProcedureIds.map(async (procId: string) => {
          const res = await fetch(`/api/procedures/${procId}`);
          return res.json();
        })
      );

      // Fetch previously accepted changes for this regulation
      const acceptedChangesRes = await fetch(`/api/regulations/accepted-changes?regulationId=${params.id}`);
      const acceptedChangesData = acceptedChangesRes.ok ? await acceptedChangesRes.json() : [];

      // Create a Set of accepted change keys for quick lookup
      const acceptedChangeKeys = new Set(
        acceptedChangesData.map((ac: any) => `${ac.procedure_id}:${ac.step_id}`)
      );

      // Generate AI-powered proposed changes based on actual regulation content
      let proposedChanges = [];
      try {
        const changesRes = await fetch('/api/regulations/generate-changes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            regulation: regulationData,
            procedures: proceduresWithSteps
          })
        });

        if (changesRes.ok) {
          const changesData = await changesRes.json();
          proposedChanges = changesData.proposedChanges || [];

          // Mark changes as implemented if already accepted
          proposedChanges = proposedChanges.map((procChanges: any) => ({
            ...procChanges,
            changes: procChanges.changes.map((change: any) => {
              const changeKey = `${procChanges.procedureId}:${change.stepId}`;
              return {
                ...change,
                status: acceptedChangeKeys.has(changeKey) ? 'implemented' : 'pending'
              };
            })
          }));
        } else {
          console.error('Failed to generate AI changes, using empty array');
          proposedChanges = [];
        }
      } catch (error) {
        console.error('Error generating proposed changes:', error);
        proposedChanges = [];
      }

      // Use regulation document text or show message if not provided
      const documentText = regulationData.documentText ||
        'Document text not provided. The regulation summary and key changes are shown above.';

      const detailData: RegulationDetail = {
        id: regulationData.id,
        title: regulationData.title,
        source: regulationData.source,
        effectiveDate: regulationData.effectiveDate,
        priority: regulationData.priority,
        affectedProcedures: affectedProcedureIds,
        status: regulationData.status,
        summary: regulationData.summary,
        documentText,
        keyChanges: regulationData.keyChanges || [],
        proposedChanges
      };

      setRegulation(detailData);
    } catch (error) {
      console.error('Error fetching regulation detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProcedure = (procedureId: string) => {
    setExpandedProcedures(prev => {
      const next = new Set(prev);
      if (next.has(procedureId)) {
        next.delete(procedureId);
      } else {
        next.add(procedureId);
      }
      return next;
    });
  };

  const handleChangeAction = (procedureId: string, stepId: string, action: 'accept' | 'reject') => {
    setRegulation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        proposedChanges: prev.proposedChanges.map(proc => {
          if (proc.procedureId === procedureId) {
            return {
              ...proc,
              changes: proc.changes.map(change => {
                if (change.stepId === stepId) {
                  return {
                    ...change,
                    status: action === 'accept' ? ('accepted' as const) : ('rejected' as const)
                  };
                }
                return change;
              })
            };
          }
          return proc;
        })
      };
    });
  };

  const handleAcceptAll = () => {
    setRegulation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        proposedChanges: prev.proposedChanges.map(proc => ({
          ...proc,
          changes: proc.changes.map(change => ({
            ...change,
            status: 'accepted' as const
          }))
        }))
      };
    });
  };

  const handleEditChange = (stepId: string, currentText: string) => {
    setEditingChanges(prev => {
      const next = new Set(prev);
      next.add(stepId);
      return next;
    });
    setEditedTexts(prev => ({
      ...prev,
      [stepId]: currentText
    }));
  };

  const handleSaveEdit = (procedureId: string, stepId: string) => {
    const editedText = editedTexts[stepId];
    if (editedText) {
      setRegulation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          proposedChanges: prev.proposedChanges.map(proc => {
            if (proc.procedureId === procedureId) {
              return {
                ...proc,
                changes: proc.changes.map(change => {
                  if (change.stepId === stepId) {
                    return {
                      ...change,
                      proposedText: editedText
                    };
                  }
                  return change;
                })
              };
            }
            return proc;
          })
        };
      });
    }
    setEditingChanges(prev => {
      const next = new Set(prev);
      next.delete(stepId);
      return next;
    });
  };

  const handleCancelEdit = (stepId: string) => {
    setEditingChanges(prev => {
      const next = new Set(prev);
      next.delete(stepId);
      return next;
    });
    setEditedTexts(prev => {
      const { [stepId]: _, ...rest } = prev;
      return rest;
    });
  };

  const handlePublishChanges = async () => {
    if (!regulation) return;

    setPublishing(true);
    try {
      const results = [];

      // Process each procedure with accepted changes
      for (const procedure of regulation.proposedChanges) {
        const acceptedChanges = procedure.changes.filter(c => c.status === 'accepted');
        if (acceptedChanges.length === 0) continue;

        // Fetch current procedure to get all steps
        const procRes = await fetch(`/api/procedures/${procedure.procedureId}`);
        const procData = await procRes.json();

        // Fetch version history to get the latest version number
        const versionsRes = await fetch(`/api/procedures/${procedure.procedureId}/versions`);
        const versions = versionsRes.ok ? await versionsRes.json() : [];

        // Calculate new version from the latest version in history
        let currentVersion = '1.0';
        if (versions.length > 0) {
          // Sort by version to get the highest
          const sortedVersions = versions.sort((a: any, b: any) => {
            const [aMajor, aMinor] = a.version.split('.').map(Number);
            const [bMajor, bMinor] = b.version.split('.').map(Number);
            if (aMajor !== bMajor) return bMajor - aMajor;
            return bMinor - aMinor;
          });
          currentVersion = sortedVersions[0].version;
        }

        const versionParts = currentVersion.split('.');
        const newVersion = `${versionParts[0]}.${parseInt(versionParts[1] || '0') + 1}`;

        // Get all steps from procedure
        const allSteps = procData.steps || [];

        // Build modified steps array
        const modifiedSteps = acceptedChanges.map(change => {
          // Find the actual step by step_number (more reliable than AI-generated step_id)
          const actualStep = allSteps.find((s: any) => s.step_number === change.stepNumber);

          if (!actualStep) {
            console.warn(`Step ${change.stepNumber} not found in procedure ${procedure.procedureId}`);
            return null;
          }

          return {
            stepId: actualStep.step_id, // Use actual step_id from database
            stepContent: change.proposedText,
            stepName: actualStep.step_name,
            description: change.proposedText,
            criticality: actualStep.criticality || 'medium',
            typicalDurationMinutes: actualStep.typical_duration_minutes,
            verificationRequired: true, // Compliance changes require verification
            changeType: 'modified' as const
          };
        }).filter(Boolean); // Remove any null entries

        // Include unchanged steps
        const unchangedSteps = allSteps
          .filter((s: any) => !acceptedChanges.some(c => c.stepNumber === s.step_number))
          .map((s: any) => ({
            stepId: s.step_id,
            changeType: 'unchanged' as const
          }));

        const allStepsForVersion = [...modifiedSteps, ...unchangedSteps];

        // Create new version
        const response = await fetch(`/api/procedures/${procedure.procedureId}/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newVersion,
            createdBy: 'MSO-001', // J. Berg
            changeReason: `Regulatory compliance update: ${regulation.title} (${regulation.id}). ${acceptedChanges.length} step${acceptedChanges.length > 1 ? 's' : ''} updated to meet ${regulation.source} requirements.`,
            modifiedSteps: allStepsForVersion
          })
        });

        if (response.ok) {
          const result = await response.json();

          // Log accepted changes to prevent duplicate recommendations
          for (const change of acceptedChanges) {
            await fetch('/api/regulations/accepted-changes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                regulationId: regulation.id,
                procedureId: procedure.procedureId,
                stepId: change.stepId,
                changeDescription: change.reason,
                changeType: `${regulation.id}_compliance`, // Use regulation ID as change type for tracking
                acceptedBy: 'MSO-001',
                procedureVersion: newVersion
              })
            });
          }

          results.push({
            procedureId: procedure.procedureId,
            procedureName: procedure.procedureName,
            newVersion,
            success: true
          });
        } else {
          const error = await response.json();
          results.push({
            procedureId: procedure.procedureId,
            procedureName: procedure.procedureName,
            success: false,
            error: error.details || error.error
          });
        }
      }

      // Show results
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0 && failCount === 0) {
        alert(`Successfully published changes!\n\n${results.map(r => `✓ ${r.procedureName} updated to v${r.newVersion}`).join('\n')}\n\nAll procedures have been updated with regulatory compliance changes.`);
        // Navigate back to governance page
        router.push('/mso/governance?tab=regulations');
      } else if (successCount > 0 && failCount > 0) {
        alert(`Partially completed:\n\nSuccessful:\n${results.filter(r => r.success).map(r => `✓ ${r.procedureName} v${r.newVersion}`).join('\n')}\n\nFailed:\n${results.filter(r => !r.success).map(r => `✗ ${r.procedureName}: ${r.error}`).join('\n')}`);
      } else {
        alert(`Failed to publish changes:\n\n${results.map(r => `✗ ${r.procedureName}: ${r.error}`).join('\n')}`);
      }
    } catch (error: any) {
      console.error('Error publishing changes:', error);
      alert(`Error publishing changes: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#ff0000]" />
      </div>
    );
  }

  if (!regulation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-2">Regulation not found</p>
          <p className="text-sm text-gray-500 mb-4">The regulation you're looking for doesn't exist or has been removed.</p>
          <Link
            href="/mso/knowledge-base"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Knowledge Base
          </Link>
        </div>
      </div>
    );
  }

  const totalChanges = regulation.proposedChanges.reduce((sum, proc) => sum + proc.changes.length, 0);
  const acceptedChanges = regulation.proposedChanges.reduce(
    (sum, proc) => sum + proc.changes.filter(c => c.status === 'accepted').length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-[1600px] mx-auto">
          <Link
            href="/mso/governance?tab=regulations"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-[#ff0000] mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Governance</span>
          </Link>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-[#1c2b40]">{regulation.title}</h1>
                <span className={`px-3 py-1 text-xs font-bold rounded ${
                  regulation.priority === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {regulation.priority.toUpperCase()} PRIORITY
                </span>
              </div>
              <p className="text-gray-600">{regulation.id} • {regulation.source}</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="font-semibold">Effective Date</span>
              </div>
              <p className="text-lg font-bold text-[#1c2b40]">
                {new Date(regulation.effectiveDate).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-semibold">Affected Procedures</span>
              </div>
              <p className="text-lg font-bold text-[#1c2b40]">
                {regulation.affectedProcedures.length} procedures
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <FileText className="w-4 h-4" />
                <span className="font-semibold">Proposed Changes</span>
              </div>
              <p className="text-lg font-bold text-[#1c2b40]">
                {acceptedChanges}/{totalChanges} accepted
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-[#1c2b40] mb-4">Summary</h2>
          <p className="text-gray-700 leading-relaxed">{regulation.summary}</p>

          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Key Changes:</h3>
            <ul className="space-y-2">
              {regulation.keyChanges.map((change, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setExpandedDocument(!expandedDocument)}
            className="w-full px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <h2 className="text-xl font-bold text-[#1c2b40]">Full Regulation Document</h2>
            {expandedDocument ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {expandedDocument && (
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {regulation.documentText}
              </div>
            </div>
          )}
        </div>

        {/* AI-Proposed Changes */}
        {regulation.proposedChanges.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#1c2b40]">AI-Proposed Changes</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Review and approve changes to affected procedures
                  </p>
                </div>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Accept All</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {regulation.proposedChanges.map((procedure) => (
                <div key={procedure.procedureId} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleProcedure(procedure.procedureId)}
                    className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-[#ff0000]" />
                      <div className="text-left">
                        <h3 className="font-bold text-[#1c2b40]">{procedure.procedureName}</h3>
                        <p className="text-sm text-gray-600">{procedure.procedureId} • {procedure.changes.length} changes</p>
                      </div>
                    </div>
                    {expandedProcedures.has(procedure.procedureId) ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </button>

                  {expandedProcedures.has(procedure.procedureId) && (
                    <div className="p-6 space-y-6">
                      {procedure.changes.map((change) => (
                        <div key={change.stepId} className={`border-l-4 pl-6 py-4 ${
                          change.status === 'implemented'
                            ? 'border-gray-300 opacity-60 bg-gray-50/50'
                            : 'border-blue-500'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-[#1c2b40]">Step {change.stepNumber}</h4>
                            <span className={`px-3 py-1 text-xs font-bold rounded ${
                              change.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              change.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              change.status === 'implemented' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {change.status === 'implemented' ? 'ALREADY IMPLEMENTED' : change.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-2">Current Text:</p>
                              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-gray-800">
                                {change.currentText}
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-gray-600">Proposed Text:</p>
                                {!editingChanges.has(change.stepId) && change.status === 'pending' && (
                                  <button
                                    onClick={() => handleEditChange(change.stepId, change.proposedText)}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                )}
                              </div>
                              {editingChanges.has(change.stepId) ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editedTexts[change.stepId] || change.proposedText}
                                    onChange={(e) => setEditedTexts(prev => ({ ...prev, [change.stepId]: e.target.value }))}
                                    className="w-full bg-green-50 border-2 border-green-400 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap font-mono resize-y min-h-[150px] focus:outline-none focus:border-green-600"
                                    rows={8}
                                  />
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleSaveEdit(procedure.procedureId, change.stepId)}
                                      className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                      <Save className="w-4 h-4" />
                                      <span>Save Changes</span>
                                    </button>
                                    <button
                                      onClick={() => handleCancelEdit(change.stepId)}
                                      className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                      <X className="w-4 h-4" />
                                      <span>Cancel</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap">
                                  {change.proposedText}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4 mb-4">
                            <p className="text-sm text-blue-900">
                              <strong>Reason:</strong> {change.reason}
                            </p>
                          </div>

                          {change.status === 'pending' && (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleChangeAction(procedure.procedureId, change.stepId, 'accept')}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                              >
                                <Check className="w-4 h-4" />
                                <span>Accept Change</span>
                              </button>
                              <button
                                onClick={() => handleChangeAction(procedure.procedureId, change.stepId, 'reject')}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                <span>Reject Change</span>
                              </button>
                            </div>
                          )}

                          {change.status === 'implemented' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                This change has already been implemented and published to a procedure version.
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      {acceptedChanges} of {totalChanges} changes accepted
                    </p>
                    {acceptedChanges > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        {regulation.proposedChanges.filter(p => p.changes.some(c => c.status === 'accepted')).length} procedure{regulation.proposedChanges.filter(p => p.changes.some(c => c.status === 'accepted')).length !== 1 ? 's' : ''} will be updated with new versions
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handlePublishChanges}
                    disabled={acceptedChanges === 0 || publishing}
                    className="px-6 py-3 bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {publishing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <span>Publish Changes</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
                {acceptedChanges > 0 && (
                  <div className="bg-green-50 border-l-4 border-green-500 rounded-r-lg p-3">
                    <p className="text-sm text-green-900">
                      <strong>Ready to publish:</strong> New procedure versions will be created with regulatory compliance updates. All changes will be logged in version history.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
