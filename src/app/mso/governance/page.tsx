'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  FileText,
  Search,
  Filter,
  ChevronDown,
  ArrowRight,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Loader2,
  Plus,
  Eye,
  Trash2,
  MoreVertical,
} from 'lucide-react';

// Tab Button Component
function TabButton({ active, onClick, icon: Icon, label, count }: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
        active
          ? 'bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white shadow-lg'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          active ? 'bg-white/20' : 'bg-gray-200'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function MSOGovernancePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'procedures' | 'regulations'>('procedures');
  const [procedures, setProcedures] = useState<any[]>([]);
  const [regulations, setRegulations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showCreateRegulation, setShowCreateRegulation] = useState(false);

  // Check URL params for initial tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'regulations') setActiveTab('regulations');
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch procedures
      const procRes = await fetch('/api/dashboard/procedures');
      if (procRes.ok) {
        const procData = await procRes.json();
        setProcedures(procData);
      }

      // Fetch regulations (may fail if table doesn't exist yet)
      try {
        const regRes = await fetch('/api/regulations');
        if (regRes.ok) {
          const regData = await regRes.json();
          setRegulations(regData);
        } else {
          // Table may not exist yet, use empty array
          console.warn('Regulations table may not exist yet. Run migration: POST /api/migrate/regulations');
          setRegulations([]);
        }
      } catch (regError) {
        console.warn('Failed to fetch regulations:', regError);
        setRegulations([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(procedures.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  }, [procedures]);

  const filteredProcedures = useMemo(() => {
    return procedures.filter(p => {
      const matchesSearch = !searchQuery ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.procedure_id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [procedures, searchQuery, categoryFilter]);

  const filteredRegulations = useMemo(() => {
    return regulations.filter(r => {
      return !searchQuery ||
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.source?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [regulations, searchQuery]);

  // Reset filters when tab changes
  useEffect(() => {
    setSearchQuery('');
    setCategoryFilter('all');
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#ff0000]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-[#ff0000]" />
            <h1 className="text-3xl font-bold text-[#1c2b40]">Governance</h1>
          </div>
          <p className="text-gray-600">
            Manage procedures and regulatory compliance requirements
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Regulation Insights - Top Level */}
        {filteredRegulations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#1c2b40]">Pending Regulation Updates</h2>
                  <p className="text-sm text-gray-600">
                    {filteredRegulations.length} regulation{filteredRegulations.length !== 1 ? 's' : ''} requiring procedure updates
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredRegulations.map((reg) => (
                <motion.div
                  key={reg.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 overflow-hidden flex flex-col"
                >
                  <div className="px-6 py-4 border-b border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#1c2b40] mb-1">{reg.title}</h3>
                        <p className="text-xs text-gray-600">{reg.id} • {reg.source}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-bold rounded shrink-0 ${
                        reg.priority === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {reg.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="space-y-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span className="font-semibold">Effective Date:</span>
                        </div>
                        <p className="text-sm text-[#1c2b40] font-bold">
                          {new Date(reg.effectiveDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-semibold">Affected Procedures:</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {reg.affectedProcedures.map((procId: string) => (
                            <span key={procId} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                              {procId}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4 mb-4">
                      <p className="text-sm text-amber-800">
                        <strong>AI Analysis:</strong> {reg.affectedProcedures.length} procedure
                        {reg.affectedProcedures.length > 1 ? 's' : ''} require updates. Changes ready for review.
                      </p>
                    </div>

                    <button
                      onClick={() => router.push(`/mso/regulations/${reg.id}`)}
                      className="w-full px-4 py-3 bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-auto"
                    >
                      <span>Review Changes</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Tabbed Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Tab Navigation */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-2">
              <TabButton
                active={activeTab === 'procedures'}
                onClick={() => setActiveTab('procedures')}
                icon={FileText}
                label="Procedures"
                count={filteredProcedures.length}
              />
              <TabButton
                active={activeTab === 'regulations'}
                onClick={() => setActiveTab('regulations')}
                icon={Shield}
                label="Regulations"
                count={filteredRegulations.length}
              />
            </div>
          </div>

          {/* Search and Filters */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab}...`}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff0000] focus:ring-2 focus:ring-red-100"
                />
              </div>

              {activeTab === 'procedures' && categories.length > 0 && (
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff0000] focus:ring-2 focus:ring-red-100 appearance-none bg-white"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              )}

              {activeTab === 'procedures' && (
                <button
                  onClick={() => router.push('/mso/procedures/create')}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Procedure</span>
                </button>
              )}

              {activeTab === 'regulations' && (
                <button
                  onClick={() => setShowCreateRegulation(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Regulation</span>
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Procedures Tab */}
              {activeTab === 'procedures' && (
                <motion.div
                  key="procedures"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3"
                >
                  {filteredProcedures.map((proc) => (
                    <motion.div
                      key={proc.procedure_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-lg transition-all cursor-pointer relative"
                      onClick={() => router.push(`/mso/procedures/${proc.procedure_id}`)}
                    >
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#ff0000] to-[#cc0000] flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-[#1c2b40]">{proc.name}</h3>
                              {proc.has_open_signals && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded flex items-center gap-1">
                                  <TrendingDown className="w-3 h-3" />
                                  CI Signal
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="font-semibold">{proc.procedure_id}</span>
                              <span>•</span>
                              <span>{proc.category}</span>
                              <span>•</span>
                              <span>v{proc.current_version || '1.0'}</span>
                              <span>•</span>
                              <span>{proc.total_steps || 0} steps</span>
                            </div>
                          </div>
                        </div>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(openDropdown === proc.procedure_id ? null : proc.procedure_id);
                            }}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            title="More options"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>
                          {openDropdown === proc.procedure_id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdown(null);
                                }}
                              />
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdown(null);
                                    router.push(`/mso/procedures/${proc.procedure_id}`);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4 text-gray-600" />
                                  <span>View</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdown(null);
                                    if (confirm(`Are you sure you want to delete "${proc.name}"?`)) {
                                      console.log('Delete procedure:', proc.procedure_id);
                                    }
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {filteredProcedures.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">No procedures found</p>
                      <p className="text-sm text-gray-500 mt-1">Try adjusting your search criteria</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Regulations Tab */}
              {activeTab === 'regulations' && (
                <motion.div
                  key="regulations"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3"
                >
                  {filteredRegulations.map((reg) => (
                    <motion.div
                      key={reg.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-lg transition-all cursor-pointer relative"
                      onClick={() => router.push(`/mso/regulations/${reg.id}`)}
                    >
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                            <Shield className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-[#1c2b40]">{reg.title}</h3>
                              <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                                reg.priority === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {reg.priority.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="font-semibold">{reg.id}</span>
                              <span>•</span>
                              <span>{reg.source}</span>
                              <span>•</span>
                              <span>Effective: {new Date(reg.effectiveDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(openDropdown === reg.id ? null : reg.id);
                            }}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            title="More options"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          </button>
                          {openDropdown === reg.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdown(null);
                                }}
                              />
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdown(null);
                                    router.push(`/mso/regulations/${reg.id}`);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4 text-gray-600" />
                                  <span>View</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdown(null);
                                    if (confirm(`Are you sure you want to delete "${reg.title}"?`)) {
                                      console.log('Delete regulation:', reg.id);
                                    }
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {filteredRegulations.length === 0 && (
                    <div className="text-center py-12">
                      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">
                        {regulations.length === 0 ? 'No regulations yet' : 'No regulations found'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {regulations.length === 0
                          ? 'Click "Add Regulation" to add your first regulation'
                          : 'Try adjusting your search criteria'}
                      </p>
                      {regulations.length === 0 && (
                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto text-left">
                          <p className="text-xs font-semibold text-blue-900 mb-2">Setup Required:</p>
                          <p className="text-xs text-blue-800">
                            If you see errors, run the database migration first:
                          </p>
                          <code className="block mt-2 bg-blue-100 text-blue-900 px-3 py-2 rounded text-xs font-mono">
                            curl -X POST http://localhost:3000/api/migrate/regulations
                          </code>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Add Regulation Modal */}
      {showCreateRegulation && (
        <CreateRegulationModal
          onClose={() => setShowCreateRegulation(false)}
          onSuccess={() => {
            setShowCreateRegulation(false);
            fetchData();
          }}
          procedures={procedures}
        />
      )}
    </div>
  );
}

// Add Regulation Modal Component
function CreateRegulationModal({ onClose, onSuccess, procedures }: {
  onClose: () => void;
  onSuccess: () => void;
  procedures: any[];
}) {
  const [formData, setFormData] = useState({
    title: '',
    source: '',
    effectiveDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    affectedProcedures: [] as string[],
    summary: '',
    documentText: '',
    keyChanges: ['']
  });
  const [saving, setSaving] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setAnalyzing(true);

    try {
      // Read file content
      const fileContent = await file.text();

      // Call AI analysis endpoint
      const response = await fetch('/api/regulations/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: fileContent,
          procedures: procedures.map(p => ({
            id: p.procedure_id,
            name: p.name,
            category: p.category
          }))
        })
      });

      if (response.ok) {
        try {
          const analysis = await response.json();
          setAnalysisResult(analysis);

          // Auto-populate form fields
          setFormData(prev => ({
            ...prev,
            title: analysis.title || prev.title,
            source: analysis.source || prev.source,
            priority: analysis.priority || prev.priority,
            summary: analysis.summary || prev.summary,
            documentText: fileContent,
            keyChanges: analysis.keyChanges || prev.keyChanges,
            affectedProcedures: analysis.affectedProcedures || prev.affectedProcedures
          }));
        } catch (parseError) {
          console.error('Failed to parse analysis response:', parseError);
          // Still set the document text even if parsing fails
          setFormData(prev => ({ ...prev, documentText: fileContent }));
          alert('Document uploaded but analysis failed. Please fill in the details manually.');
        }
      } else {
        // Set document text even on error
        setFormData(prev => ({ ...prev, documentText: fileContent }));

        try {
          const errorData = await response.json();
          console.error('Analysis API error:', errorData);
          alert(`Failed to analyze document: ${errorData.error || 'Unknown error'}. Please fill in the details manually.`);
        } catch {
          alert('Failed to analyze document. Please fill in the details manually.');
        }
      }
    } catch (error: any) {
      console.error('File analysis error:', error);
      alert(`Error analyzing document: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/regulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          keyChanges: formData.keyChanges.filter(k => k.trim() !== '')
        })
      });

      if (response.ok) {
        alert('Regulation created successfully!');
        onSuccess();
      } else {
        const error = await response.json();
        alert(`Failed to create regulation: ${error.error}\n${error.details || ''}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleProcedure = (procId: string) => {
    setFormData(prev => ({
      ...prev,
      affectedProcedures: prev.affectedProcedures.includes(procId)
        ? prev.affectedProcedures.filter(id => id !== procId)
        : [...prev.affectedProcedures, procId]
    }));
  };

  const updateKeyChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      keyChanges: prev.keyChanges.map((k, i) => i === index ? value : k)
    }));
  };

  const addKeyChange = () => {
    setFormData(prev => ({
      ...prev,
      keyChanges: [...prev.keyChanges, '']
    }));
  };

  const removeKeyChange = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keyChanges: prev.keyChanges.filter((_, i) => i !== index)
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Add New Regulation</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <Plus className="w-5 h-5 rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Document Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Regulation Document (Optional)
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".txt,.pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
                id="regulation-file-upload"
              />
              <label
                htmlFor="regulation-file-upload"
                className={`block w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                  analyzing
                    ? 'border-blue-400 bg-blue-50'
                    : uploadedFile
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-[#ff0000] hover:bg-gray-50'
                }`}
              >
                {analyzing ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-semibold text-blue-900">Analyzing document with AI...</p>
                    <p className="text-xs text-blue-700">
                      Extracting requirements and identifying affected procedures
                    </p>
                  </div>
                ) : uploadedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 text-green-600" />
                    <p className="text-sm font-semibold text-green-900">{uploadedFile.name}</p>
                    <p className="text-xs text-green-700">
                      ✓ Analyzed - Form fields auto-populated
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setUploadedFile(null);
                        setAnalysisResult(null);
                      }}
                      className="text-xs text-red-600 hover:text-red-700 underline"
                    >
                      Upload different file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-700">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      TXT, PDF, DOC, or DOCX • AI will analyze and extract requirements
                    </p>
                  </div>
                )}
              </label>
            </div>
            {analysisResult && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-green-900 mb-1">✓ AI Analysis Complete</p>
                <p className="text-xs text-green-800">
                  Identified {analysisResult.affectedProcedures?.length || 0} affected procedures and extracted key requirements. Review and adjust the auto-populated fields below.
                </p>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff0000] focus:ring-2 focus:ring-red-100"
              placeholder="e.g., Updated OSHA Safety Requirements"
            />
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Source <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff0000] focus:ring-2 focus:ring-red-100"
              placeholder="e.g., OSHA Standard 1910.147(c)(4)"
            />
          </div>

          {/* Effective Date & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Effective Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff0000] focus:ring-2 focus:ring-red-100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff0000] focus:ring-2 focus:ring-red-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff0000] focus:ring-2 focus:ring-red-100 resize-none"
              placeholder="Brief summary of the regulation and its impact..."
            />
          </div>

          {/* Affected Procedures */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Affected Procedures <span className="text-red-500">*</span>
            </label>
            <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
              {procedures.map((proc) => (
                <label key={proc.procedure_id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={formData.affectedProcedures.includes(proc.procedure_id)}
                    onChange={() => toggleProcedure(proc.procedure_id)}
                    className="w-4 h-4 text-[#ff0000] border-gray-300 rounded focus:ring-[#ff0000]"
                  />
                  <span className="text-sm font-medium text-gray-700">{proc.procedure_id}</span>
                  <span className="text-sm text-gray-600">{proc.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formData.affectedProcedures.length} procedure{formData.affectedProcedures.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          {/* Key Changes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Key Changes
            </label>
            <div className="space-y-3">
              {formData.keyChanges.map((change, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={change}
                    onChange={(e) => updateKeyChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff0000] focus:ring-2 focus:ring-red-100"
                    placeholder={`Key change #${index + 1}`}
                  />
                  {formData.keyChanges.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeKeyChange(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addKeyChange}
                className="text-sm text-[#ff0000] hover:text-[#cc0000] font-semibold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Another Key Change
              </button>
            </div>
          </div>

          {/* Document Text (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Document Text (Optional)
            </label>
            <textarea
              value={formData.documentText}
              onChange={(e) => setFormData({ ...formData, documentText: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#ff0000] focus:ring-2 focus:ring-red-100 resize-none font-mono text-sm"
              placeholder="Paste the full regulation document text here..."
            />
          </div>
        </form>

        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving || formData.affectedProcedures.length === 0}
            className="px-6 py-2.5 bg-gradient-to-r from-[#ff0000] to-[#cc0000] text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>Add Regulation</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Wrap in Suspense to handle useSearchParams
export default function MSOGovernancePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center"><div className="text-gray-600">Loading...</div></div>}>
      <MSOGovernancePageContent />
    </Suspense>
  );
}
