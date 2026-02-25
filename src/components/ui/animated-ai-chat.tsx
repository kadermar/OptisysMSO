"use client";

import { useEffect, useRef, useCallback, useTransition } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    ImageIcon,
    FileUp,
    Figma,
    MonitorIcon,
    CircleUserRound,
    ArrowUpIcon,
    Paperclip,
    PlusIcon,
    SendIcon,
    XIcon,
    LoaderIcon,
    Sparkles,
    Command,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react"
import ReactMarkdown from 'react-markdown';

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            textarea.style.height = `${minHeight}px`;
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
    icon: React.ReactNode;
    label: string;
    description: string;
    prefix: string;
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className={cn(
        "relative",
        containerClassName
      )}>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0" : "",
            className
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {showRing && isFocused && (
          <motion.span
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-[#ff0000]/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {props.onChange && (
          <div
            className="absolute bottom-2 right-2 opacity-0 w-2 h-2 bg-[#ff0000] rounded-full"
            style={{
              animation: 'none',
            }}
            id="textarea-ripple"
          />
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

interface ProcedureStep {
    step_id: string;
    step_number: number;
    description: string;
    expected_duration_minutes?: number;
    criticality?: string;
    safety_requirements?: string;
}

interface Source {
    id: string;
    name: string;
    type: string;
    metrics?: string;
    // Procedure fields
    category?: string;
    compliance_rate?: number;
    compliant_incidents?: number;
    noncompliant_incidents?: number;
    total_incidents?: number;
    steps?: ProcedureStep[];
    description?: string;
    safety_critical?: boolean;
    // Facility fields
    performance_tier?: string;
    avg_quality_score?: number;
    // Worker fields
    experience_level?: string;
    incident_count?: number;
}

interface Sources {
    procedures: Source[];
    facilities: Source[];
    workers: Source[];
    summary: {
        totalWorkOrders: number;
        overallCompliance: number;
        incidentReduction: number;
    };
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: Sources;
}

interface AnimatedAIChatProps {
    customSuggestions?: CommandSuggestion[];
}

export function AnimatedAIChat({ customSuggestions }: AnimatedAIChatProps = {}) {
    const [value, setValue] = useState("");
    const [attachments, setAttachments] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [recentCommand, setRecentCommand] = useState<string | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });
    const [inputFocused, setInputFocused] = useState(false);
    const commandPaletteRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [selectedSource, setSelectedSource] = useState<Source | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch dashboard data on mount
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [summaryRes, proceduresRes, facilitiesRes, workersRes, workOrdersRes, regulationsRes, ciSignalsRes] = await Promise.all([
                    fetch('/api/dashboard/summary'),
                    fetch('/api/dashboard/procedures'),
                    fetch('/api/dashboard/facilities'),
                    fetch('/api/dashboard/workers'),
                    fetch('/api/dashboard/work-orders'),
                    fetch('/api/regulations'),
                    fetch('/api/ci-signals?status=open'),
                ]);

                const [summary, procedures, facilities, workers, workOrders, regulations, ciSignals] = await Promise.all([
                    summaryRes.json(),
                    proceduresRes.json(),
                    facilitiesRes.json(),
                    workersRes.json(),
                    workOrdersRes.json(),
                    regulationsRes.ok ? regulationsRes.json() : [],
                    ciSignalsRes.ok ? ciSignalsRes.json() : [],
                ]);

                setDashboardData({
                    summary,
                    procedures,
                    facilities,
                    workers,
                    workOrders,
                    regulations,
                    ciSignals,
                });
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchDashboardData();
    }, []);

    // Auto-scroll to latest message - disabled to keep view at top
    // useEffect(() => {
    //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // }, [messages]);

    const defaultSuggestions: CommandSuggestion[] = [
        {
            icon: <Sparkles className="w-4 h-4" />,
            label: "What are the top compliance issues?",
            description: "Review compliance metrics",
            prefix: "What are the top compliance issues?"
        },
        {
            icon: <FileUp className="w-4 h-4" />,
            label: "Which procedures have the most incidents?",
            description: "Review procedure safety",
            prefix: "Which procedures have the most incidents?"
        },
        {
            icon: <CircleUserRound className="w-4 h-4" />,
            label: "How is worker performance trending?",
            description: "Analyze worker metrics",
            prefix: "How is worker performance trending?"
        },
        {
            icon: <MonitorIcon className="w-4 h-4" />,
            label: "Show me facility safety metrics",
            description: "View facility performance",
            prefix: "Show me facility safety metrics"
        },
    ];

    const commandSuggestions = customSuggestions || defaultSuggestions;

    useEffect(() => {
        if (value.startsWith('/') && !value.includes(' ')) {
            setShowCommandPalette(true);

            const matchingSuggestionIndex = commandSuggestions.findIndex(
                (cmd) => cmd.prefix.startsWith(value)
            );

            if (matchingSuggestionIndex >= 0) {
                setActiveSuggestion(matchingSuggestionIndex);
            } else {
                setActiveSuggestion(-1);
            }
        } else {
            setShowCommandPalette(false);
        }
    }, [value]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const commandButton = document.querySelector('[data-command-button]');

            if (commandPaletteRef.current &&
                !commandPaletteRef.current.contains(target) &&
                !commandButton?.contains(target)) {
                setShowCommandPalette(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showCommandPalette) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestion(prev =>
                    prev < commandSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestion(prev =>
                    prev > 0 ? prev - 1 : commandSuggestions.length - 1
                );
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                if (activeSuggestion >= 0) {
                    const selectedCommand = commandSuggestions[activeSuggestion];
                    setValue(selectedCommand.prefix + ' ');
                    setShowCommandPalette(false);

                    setRecentCommand(selectedCommand.label);
                    setTimeout(() => setRecentCommand(null), 3500);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowCommandPalette(false);
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                handleSendMessage();
            }
        }
    };

    const handleSendMessage = async () => {
        if (!value.trim() || !dashboardData) return;

        const userMessage = value.trim();

        // Add user message to chat
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setValue("");
        adjustHeight(true);
        setIsTyping(true);

        try {
            const response = await fetch('/api/ai/assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',
                },
                body: JSON.stringify({
                    question: userMessage,
                    dashboardData,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get AI response');
            }

            const data = await response.json();

            // Add AI response to chat with sources
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.answer,
                sources: data.sources
            }]);
        } catch (error) {
            console.error('Error calling AI assistant:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error processing your request. Please try again.'
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleAttachFile = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const fileNames = Array.from(files).map(file => file.name);
            setAttachments(prev => [...prev, ...fileNames]);
            // Reset the input so the same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const selectCommandSuggestion = (index: number) => {
        const selectedCommand = commandSuggestions[index];
        setValue(selectedCommand.prefix + ' ');
        setShowCommandPalette(false);

        setRecentCommand(selectedCommand.label);
        setTimeout(() => setRecentCommand(null), 2000);
    };

    return (
        <div className="h-full flex flex-col w-full items-center bg-transparent text-[#1c2b40] relative overflow-hidden">
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/5 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
                <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-gray-400/5 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
            </div>
            <motion.div
                className="w-full max-w-5xl mx-auto relative flex flex-col h-full px-6"
                initial={false}
                animate={{
                    paddingTop: messages.length === 0 ? "20vh" : "2rem",
                    paddingBottom: "1.5rem",
                }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
            >
                {/* Messages Area */}
                <motion.div
                    className={cn(
                        "relative z-10 transition-all duration-700 ease-in-out",
                        messages.length === 0 ? "flex-none" : "flex-1 overflow-y-auto mb-6 min-h-0"
                    )}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    style={{ scrollbarWidth: 'thin' }}
                >
                    {messages.length === 0 ? (
                        <div className="text-center space-y-3 mb-12">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="inline-block"
                            >
                                <h1 className="text-3xl font-medium tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#1c2b40] to-[#ff0000] pb-1">
                                    How can I help today?
                                </h1>
                                <motion.div
                                    className="h-px bg-gradient-to-r from-transparent via-[#ff0000]/30 to-transparent"
                                    initial={{ width: 0, opacity: 0 }}
                                    animate={{ width: "100%", opacity: 1 }}
                                    transition={{ delay: 0.5, duration: 0.8 }}
                                />
                            </motion.div>
                            <motion.p
                                className="text-sm text-gray-600"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                Optisys
                            </motion.p>
                        </div>
                    ) : (
                        <div className="space-y-4 pb-4 px-2">
                                {messages.map((message, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className={cn(
                                            "flex gap-3",
                                            message.role === 'user' ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        {message.role === 'assistant' && (
                                            <div className="w-8 h-8 rounded-full bg-[#ff0000] flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-medium text-white">AI</span>
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-2 max-w-[80%]">
                                            <div
                                                className={cn(
                                                    message.role === 'user'
                                                        ? "px-5 py-4 rounded-2xl bg-[#ff0000] text-white"
                                                        : "px-5 py-4 rounded-2xl bg-white border border-gray-200 shadow-sm text-[#1c2b40]"
                                                )}
                                            >
                                                {message.role === 'user' ? (
                                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                                ) : (
                                                    <div className="prose prose-sm max-w-none prose-headings:text-[#1c2b40] prose-headings:font-semibold prose-p:text-[#1c2b40] prose-p:leading-relaxed prose-strong:text-[#ff0000] prose-strong:font-semibold prose-ul:text-[#1c2b40] prose-ol:text-[#1c2b40] prose-li:text-[#1c2b40] prose-li:my-1">
                                                        <ReactMarkdown
                                                            components={{
                                                                h1: ({node, ...props}) => <h1 className="text-lg font-semibold mb-2 text-[#1c2b40]" {...props} />,
                                                                h2: ({node, ...props}) => <h2 className="text-base font-semibold mb-2 text-[#1c2b40]" {...props} />,
                                                                h3: ({node, ...props}) => <h3 className="text-sm font-semibold mb-1 text-[#1c2b40]" {...props} />,
                                                                p: ({node, ...props}) => <p className="mb-2 last:mb-0 text-[#1c2b40] leading-relaxed" {...props} />,
                                                                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                                                                ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                                                                li: ({node, ...props}) => <li className="text-[#1c2b40] leading-relaxed" {...props} />,
                                                                strong: ({node, ...props}) => <strong className="font-semibold text-[#ff0000]" {...props} />,
                                                                em: ({node, ...props}) => <em className="italic text-gray-700" {...props} />,
                                                                code: ({node, ...props}) => <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs font-mono text-[#1c2b40]" {...props} />,
                                                            }}
                                                        >
                                                            {message.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                )}
                                            </div>
                                            {message.role === 'assistant' && message.sources && (
                                                <>
                                                    {(message.sources.procedures.length > 0 || message.sources.facilities.length > 0 || message.sources.workers.length > 0) && (
                                                        <motion.div
                                                            className="space-y-2"
                                                            initial={{ opacity: 0, y: -5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.2 }}
                                                        >
                                                            <div className="flex items-center gap-1.5 text-gray-600 mb-2">
                                                                <div className="p-1 bg-gray-100 rounded">
                                                                    <FileUp className="w-3 h-3 text-[#ff0000]" />
                                                                </div>
                                                                <span className="font-semibold text-[#1c2b40] text-xs">Referenced Sources</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {[...message.sources.procedures, ...message.sources.facilities, ...message.sources.workers].map((source, idx) => (
                                                                    <motion.button
                                                                        key={`${source.type}-${source.id}`}
                                                                        onClick={() => setSelectedSource(source)}
                                                                        className="group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200/80 rounded-lg px-3 py-2 text-xs hover:border-[#ff0000]/50 hover:shadow-md transition-all cursor-pointer"
                                                                        whileHover={{ scale: 1.02 }}
                                                                        whileTap={{ scale: 0.98 }}
                                                                        initial={{ opacity: 0, y: 5 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ delay: 0.1 * idx }}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <div className={cn(
                                                                                "w-2 h-2 rounded-full",
                                                                                source.type === 'procedure' && "bg-blue-500",
                                                                                source.type === 'facility' && "bg-green-500",
                                                                                source.type === 'worker' && "bg-purple-500"
                                                                            )} />
                                                                            <div className="flex flex-col items-start">
                                                                                <span className="font-semibold text-[#1c2b40]">{source.name}</span>
                                                                                <span className="text-gray-500 capitalize">{source.type}</span>
                                                                            </div>
                                                                        </div>
                                                                        <motion.div
                                                                            className="absolute inset-0 border border-[#ff0000]/30 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none"
                                                                            layoutId="source-highlight"
                                                                        />
                                                                    </motion.button>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        {message.role === 'user' && (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                <CircleUserRound className="w-5 h-5 text-gray-600" />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                                <div ref={messagesEndRef} />
                        </div>
                    )}
                </motion.div>

                {/* Input Area */}
                <motion.div
                    className="relative backdrop-blur-sm bg-white/80 rounded-2xl border border-gray-200 shadow-2xl z-20 flex-shrink-0"
                    layout
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                >
                        <AnimatePresence>
                            {showCommandPalette && (
                                <motion.div
                                    ref={commandPaletteRef}
                                    className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-sm bg-white rounded-lg z-50 shadow-lg border border-gray-200 overflow-hidden"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <div className="py-1 bg-white">
                                        {commandSuggestions.map((suggestion, index) => (
                                            <motion.div
                                                key={suggestion.prefix}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer",
                                                    activeSuggestion === index
                                                        ? "bg-[#ff0000]/10 text-[#1c2b40]"
                                                        : "text-gray-700 hover:bg-gray-100"
                                                )}
                                                onClick={() => selectCommandSuggestion(index)}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: index * 0.03 }}
                                            >
                                                <div className="w-5 h-5 flex items-center justify-center text-[#ff0000]">
                                                    {suggestion.icon}
                                                </div>
                                                <div className="font-medium">{suggestion.label}</div>
                                                <div className="text-gray-500 text-xs ml-1">
                                                    {suggestion.prefix}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-4">
                            <Textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => {
                                    setValue(e.target.value);
                                    adjustHeight();
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setInputFocused(true)}
                                onBlur={() => setInputFocused(false)}
                                placeholder="Ask about procedures, compliance, or performance..."
                                containerClassName="w-full"
                                className={cn(
                                    "w-full px-4 py-3",
                                    "resize-none",
                                    "bg-transparent",
                                    "border-none",
                                    "text-[#1c2b40] text-sm",
                                    "focus:outline-none",
                                    "placeholder:text-gray-400",
                                    "min-h-[60px]"
                                )}
                                style={{
                                    overflow: "hidden",
                                }}
                                showRing={false}
                            />
                        </div>

                        <AnimatePresence>
                            {attachments.length > 0 && (
                                <motion.div
                                    className="px-4 pb-3 flex gap-2 flex-wrap"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    {attachments.map((file, index) => (
                                        <motion.div
                                            key={index}
                                            className="flex items-center gap-2 text-xs bg-gray-100 py-1.5 px-3 rounded-lg text-gray-700"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                        >
                                            <span>{file}</span>
                                            <button
                                                onClick={() => removeAttachment(index)}
                                                className="text-gray-500 hover:text-[#ff0000] transition-colors"
                                            >
                                                <XIcon className="w-3 h-3" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="p-4 border-t border-gray-200 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.csv,.xls,.xlsx"
                                />
                                <motion.button
                                    type="button"
                                    onClick={handleAttachFile}
                                    whileTap={{ scale: 0.94 }}
                                    className="p-2 text-gray-600 hover:text-[#ff0000] rounded-lg transition-colors relative group"
                                >
                                    <motion.span
                                        className="absolute inset-0 bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity -z-10"
                                        layoutId="button-highlight"
                                    />
                                    <Paperclip className="w-4 h-4 relative z-10" />
                                </motion.button>
                                <motion.button
                                    type="button"
                                    data-command-button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowCommandPalette(prev => !prev);
                                    }}
                                    whileTap={{ scale: 0.94 }}
                                    className={cn(
                                        "p-2 text-gray-600 hover:text-[#ff0000] rounded-lg transition-colors relative group",
                                        showCommandPalette && "bg-gray-100 text-[#ff0000]"
                                    )}
                                >
                                    <motion.span
                                        className="absolute inset-0 bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity -z-10"
                                        layoutId="button-highlight"
                                    />
                                    <Command className="w-4 h-4 relative z-10" />
                                </motion.button>
                            </div>

                            <motion.button
                                type="button"
                                onClick={handleSendMessage}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                disabled={isTyping || !value.trim()}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    "flex items-center gap-2",
                                    value.trim()
                                        ? "bg-[#ff0000] text-white shadow-lg shadow-red-500/20"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                )}
                            >
                                {isTyping ? (
                                    <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                                ) : (
                                    <SendIcon className="w-4 h-4" />
                                )}
                                <span>Send</span>
                            </motion.button>
                        </div>
                </motion.div>

                {/* Command Suggestions - Only shown when no messages */}
                {messages.length === 0 && (
                    <motion.div
                        className="flex flex-wrap items-center justify-center gap-2 mt-6 flex-shrink-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {commandSuggestions.map((suggestion, index) => (
                            <motion.button
                                key={suggestion.prefix}
                                onClick={() => selectCommandSuggestion(index)}
                                className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 rounded-lg text-sm text-gray-600 hover:text-[#ff0000] transition-all relative group border border-gray-200"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {suggestion.icon}
                                <span>{suggestion.label}</span>
                                <motion.div
                                    className="absolute inset-0 border border-[#ff0000]/20 rounded-lg opacity-0 group-hover:opacity-100"
                                    initial={false}
                                    animate={{
                                        opacity: [0, 1],
                                        scale: [0.98, 1],
                                    }}
                                    transition={{
                                        duration: 0.3,
                                        ease: "easeOut",
                                    }}
                                />
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </motion.div>

            <AnimatePresence>
                {isTyping && (
                    <motion.div
                        className="fixed bottom-8 mx-auto transform -translate-x-1/2 backdrop-blur-2xl bg-white rounded-full px-4 py-2 shadow-lg border border-gray-200"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-7 rounded-full bg-[#ff0000] flex items-center justify-center text-center">
                                <span className="text-xs font-medium text-white mb-0.5">AI</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>Thinking</span>
                                <TypingDots />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {inputFocused && (
                <motion.div
                    className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.03] bg-gradient-to-r from-red-500 via-red-600 to-red-400 blur-[96px]"
                    animate={{
                        x: mousePosition.x - 400,
                        y: mousePosition.y - 400,
                    }}
                    transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 150,
                        mass: 0.5,
                    }}
                />
            )}

            {/* Source Detail Modal */}
            <AnimatePresence>
                {selectedSource && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedSource(null)}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 relative"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedSource(null)}
                                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <XIcon className="w-5 h-5 text-gray-500" />
                            </button>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-3 h-3 rounded-full",
                                        selectedSource.type === 'procedure' && "bg-blue-500",
                                        selectedSource.type === 'facility' && "bg-green-500",
                                        selectedSource.type === 'worker' && "bg-purple-500"
                                    )} />
                                    <div>
                                        <h3 className="text-xl font-semibold text-[#1c2b40]">{selectedSource.name}</h3>
                                        <p className="text-sm text-gray-500 capitalize">{selectedSource.type}</p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-4 space-y-4">
                                    {selectedSource.type === 'procedure' && (
                                        <>
                                            {/* Procedure Metadata */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-xs text-gray-500 mb-1">Category</div>
                                                    <div className="text-sm font-semibold text-[#1c2b40]">{selectedSource.category}</div>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-xs text-gray-500 mb-1">Compliance Rate</div>
                                                    <div className="text-sm font-semibold text-[#ff0000]">{selectedSource.compliance_rate}%</div>
                                                </div>
                                            </div>

                                            {/* Safety Critical Badge */}
                                            {selectedSource.safety_critical && (
                                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                                    <span className="text-sm font-semibold text-red-700">Safety Critical Procedure</span>
                                                </div>
                                            )}

                                            {/* Description */}
                                            {selectedSource.description && (
                                                <div className="bg-blue-50 rounded-lg p-3">
                                                    <div className="text-xs text-blue-600 font-semibold mb-1">Description</div>
                                                    <div className="text-sm text-blue-900">{selectedSource.description}</div>
                                                </div>
                                            )}

                                            {/* Incident Statistics */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="bg-green-50 rounded-lg p-3 text-center">
                                                    <div className="text-xs text-green-600 mb-1">Compliant</div>
                                                    <div className="text-lg font-bold text-green-700">{selectedSource.compliant_incidents}</div>
                                                </div>
                                                <div className="bg-red-50 rounded-lg p-3 text-center">
                                                    <div className="text-xs text-red-600 mb-1">Non-Compliant</div>
                                                    <div className="text-lg font-bold text-red-700">{selectedSource.noncompliant_incidents}</div>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                                    <div className="text-xs text-gray-600 mb-1">Total</div>
                                                    <div className="text-lg font-bold text-gray-700">{selectedSource.total_incidents}</div>
                                                </div>
                                            </div>

                                            {/* Procedure Steps */}
                                            {selectedSource.steps && selectedSource.steps.length > 0 && (
                                                <div className="border-t border-gray-200 pt-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-semibold text-[#1c2b40]">Procedure Steps</h4>
                                                        <span className="text-xs text-gray-500">{selectedSource.steps.length} steps</span>
                                                    </div>
                                                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                                        {selectedSource.steps.map((step, idx) => (
                                                            <motion.div
                                                                key={step.step_id}
                                                                className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-3"
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: idx * 0.05 }}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className="flex-shrink-0 w-8 h-8 bg-[#ff0000] text-white rounded-full flex items-center justify-center font-bold text-sm">
                                                                        {step.step_number}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm text-[#1c2b40] leading-relaxed mb-2">{step.description}</p>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {step.criticality && (
                                                                                <span className={cn(
                                                                                    "text-xs px-2 py-1 rounded-full font-medium",
                                                                                    step.criticality === 'high' && "bg-red-100 text-red-700",
                                                                                    step.criticality === 'medium' && "bg-yellow-100 text-yellow-700",
                                                                                    step.criticality === 'low' && "bg-green-100 text-green-700"
                                                                                )}>
                                                                                    {step.criticality} criticality
                                                                                </span>
                                                                            )}
                                                                            {step.expected_duration_minutes && (
                                                                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                                                                    ~{step.expected_duration_minutes} min
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {step.safety_requirements && (
                                                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                                                                <div className="text-xs text-gray-500 mb-1">Safety Requirements</div>
                                                                                <div className="text-xs text-gray-700">{step.safety_requirements}</div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {selectedSource.type === 'facility' && (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-xs text-gray-500 mb-1">Performance Tier</div>
                                                    <div className="text-sm font-semibold text-[#1c2b40] uppercase">{selectedSource.performance_tier}</div>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-xs text-gray-500 mb-1">Compliance Rate</div>
                                                    <div className="text-sm font-semibold text-[#ff0000]">{selectedSource.compliance_rate}%</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-xs text-gray-500 mb-1">Total Incidents</div>
                                                    <div className="text-lg font-bold text-[#1c2b40]">{selectedSource.total_incidents}</div>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-xs text-gray-500 mb-1">Avg Quality Score</div>
                                                    <div className="text-lg font-bold text-[#1c2b40]">{selectedSource.avg_quality_score?.toFixed(1)}</div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {selectedSource.type === 'worker' && (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-xs text-gray-500 mb-1">Experience Level</div>
                                                    <div className="text-sm font-semibold text-[#1c2b40] capitalize">{selectedSource.experience_level}</div>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-xs text-gray-500 mb-1">Compliance Rate</div>
                                                    <div className="text-sm font-semibold text-[#ff0000]">{selectedSource.compliance_rate}%</div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-xs text-gray-500 mb-1">Incident Count</div>
                                                    <div className="text-lg font-bold text-[#1c2b40]">{selectedSource.incident_count}</div>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-xs text-gray-500 mb-1">Avg Quality Score</div>
                                                    <div className="text-lg font-bold text-[#1c2b40]">{selectedSource.avg_quality_score?.toFixed(1)}</div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function TypingDots() {
    return (
        <div className="flex items-center ml-1">
            {[1, 2, 3].map((dot) => (
                <motion.div
                    key={dot}
                    className="w-1.5 h-1.5 bg-[#ff0000] rounded-full mx-0.5"
                    initial={{ opacity: 0.3 }}
                    animate={{
                        opacity: [0.3, 0.9, 0.3],
                        scale: [0.85, 1.1, 0.85]
                    }}
                    transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: dot * 0.15,
                        ease: "easeInOut",
                    }}
                    style={{
                        boxShadow: "0 0 4px rgba(255, 0, 0, 0.3)"
                    }}
                />
            ))}
        </div>
    );
}

const rippleKeyframes = `
@keyframes ripple {
  0% { transform: scale(0.5); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}
`;

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = rippleKeyframes;
    document.head.appendChild(style);
}
