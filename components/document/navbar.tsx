"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Cog6ToothIcon, UserIcon } from "@heroicons/react/24/outline";

import { DocumentInput } from "./document-input";
import { PanelLeftIcon, PanelRightIcon } from "lucide-react";

import { type Document } from "@/lib/documents";

interface NavbarProps {
  document: Document;
  updateTitle: (title: string) => Promise<void>;
  isSaving: boolean;
  showIndexSidebar: boolean;
  showAiSidebar: boolean;
  onToggleIndexSidebar: () => void;
  onToggleAiSidebar: () => void;
  onManualSave?: () => Promise<void>;
}

export const Navbar = ({
  document,
  updateTitle,
  isSaving,
  showIndexSidebar,
  showAiSidebar,
  onToggleIndexSidebar,
  onToggleAiSidebar,
  onManualSave,
}: NavbarProps) => {
  const { user, signOut } = useAuth();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-profile-dropdown]")) {
        setIsProfileDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileDropdownOpen(false);
      }
    };

    globalThis.document.addEventListener("mousedown", handleClickOutside);
    globalThis.document.addEventListener("keydown", handleKeyDown);
    return () => {
      globalThis.document.removeEventListener("mousedown", handleClickOutside);
      globalThis.document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // 사용자 프로필 이미지 URL 가져오기
  const userProfileImage =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userName =
    user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email;

  return (
    <nav className="flex items-center justify-between mx-4">
      <Link href="/dashboard">
        <Image src="/ciara.svg" alt="logo" width={32} height={32} />
      </Link>

      <DocumentInput
        document={document}
        updateTitle={updateTitle}
        isSaving={isSaving}
        onManualSave={onManualSave}
      />

      {/* Profile Section with Sidebar Toggles */}
      {user && (
        <div className="flex items-center space-x-4">
          {/* 사이드바 토글 버튼들 */}
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleIndexSidebar}
              className={`p-2 rounded-full transition-all duration-200 ${
                showIndexSidebar
                  ? "bg-gray-100 text-gray-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
              title={
                showIndexSidebar ? "왼쪽 사이드바 숨기기" : "왼쪽 사이드바 보기"
              }
            >
              <PanelLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onToggleAiSidebar}
              className={`p-2 rounded-full transition-all duration-200 ${
                showAiSidebar
                  ? "bg-gray-100 text-gray-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
              title={
                showAiSidebar
                  ? "오른쪽 사이드바 숨기기"
                  : "오른쪽 사이드바 보기"
              }
            >
              <PanelRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="relative" data-profile-dropdown>
            <button
              className="flex items-center space-x-3 p-2 rounded-full hover:bg-gray-50/80 transition-all duration-200"
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            >
              {userProfileImage ? (
                <Image
                  src={userProfileImage}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                  width={32}
                  height={32}
                />
              ) : (
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-gray-600" />
                </div>
              )}
            </button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {isProfileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-3 w-64 bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-xl z-[9999]"
                >
                  <div className="p-4 border-b border-gray-100/50">
                    <div className="flex items-center space-x-3">
                      {userProfileImage ? (
                        <Image
                          src={userProfileImage}
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover"
                          width={48}
                          height={48}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {userName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50/80 rounded-xl transition-colors">
                      <Cog6ToothIcon className="h-4 w-4" />
                      <span>계정 설정</span>
                    </button>
                    <button className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50/80 rounded-xl transition-colors">
                      <UserIcon className="h-4 w-4" />
                      <span>프로필 관리</span>
                    </button>

                    <div className="border-t border-gray-100/50 mt-2 pt-2">
                      <button
                        onClick={signOut}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50/80 rounded-xl transition-colors"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        <span>로그아웃</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </nav>
  );
};
