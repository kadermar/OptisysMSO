"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Database,
  Settings,
  Smartphone,
  Play,
  Home,
  Shield,
  TrendingDown,
  BookOpen,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AIAssistantButton } from "@/components/layout/AIAssistantButton";
import { MSOTopNav } from "@/components/layout/MSOTopNav";
import { useTourSafe } from "@/components/tour";

export function OptiSysSidebar({ children }: { children: React.ReactNode }) {
  const tour = useTourSafe();
  const pathname = usePathname();
  const isMSOMode = pathname?.startsWith('/mso');

  // Original navigation links
  const originalLinks = [
    {
      label: "Welcome",
      href: "/welcome",
      icon: (
        <Home className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Dashboard",
      href: "/",
      icon: (
        <LayoutDashboard className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Knowledge Base",
      href: "/knowledge-base",
      icon: (
        <Database className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "AI Assistant",
      href: "/chat",
      icon: (
        <MessageSquare className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Field Experience",
      href: "/field-experience",
      icon: (
        <Smartphone className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  // MSO-specific navigation links
  const msoLinks = [
    {
      label: "MS Owner Dashboard",
      href: "/mso",
      icon: (
        <LayoutDashboard className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Knowledge Base",
      href: "/mso/knowledge-base",
      icon: (
        <Database className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "AI Assistant",
      href: "/mso/chat",
      icon: (
        <MessageSquare className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Governance",
      href: "/mso/governance",
      icon: (
        <Shield className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "CI Signals",
      href: "/mso/signals",
      icon: (
        <TrendingDown className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Field Experience",
      href: "/mso/field-experience",
      icon: (
        <Smartphone className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Documentation",
      href: "/mso/docs",
      icon: (
        <BookOpen className="text-white h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  const links = isMSOMode ? msoLinks : originalLinks;
  const [open, setOpen] = useState(false);

  const handleStartTour = () => {
    if (tour) {
      tour.startTour();
    }
  };

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 w-full flex-1 h-screen overflow-hidden">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
            {/* Start Tour Button - Only show in original experience, not MSO */}
            {!isMSOMode && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={handleStartTour}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors w-full",
                    "bg-[#ff0000]/20 hover:bg-[#ff0000]/30 text-white",
                    !open && "justify-center"
                  )}
                >
                  <Play className="h-5 w-5 flex-shrink-0 text-[#ff0000]" />
                  {open && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm font-medium whitespace-pre"
                    >
                      Start Tour
                    </motion.span>
                  )}
                </button>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <SidebarLink
              link={{
                label: "Settings",
                href: "#",
                icon: (
                  <Settings className="text-white h-5 w-5 flex-shrink-0" />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* MSO Top Nav - Only show in MSO mode */}
        {isMSOMode && <MSOTopNav />}

        <main className={cn(
          "flex-1 overflow-auto transition-[padding] duration-300",
          tour?.isActive && !isMSOMode && "pb-44"
        )}>
          {children}
        </main>
      </div>
      <AIAssistantButton />
    </div>
  );
}

export const Logo = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-[#ff0000] rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-bold text-white whitespace-pre text-lg"
      >
        OptiSys
      </motion.span>
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-[#ff0000] rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </Link>
  );
};
