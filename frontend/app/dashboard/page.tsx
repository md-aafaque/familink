"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import Link from "next/link";

import {
  TreeDeciduous,
  Plus,
  ArrowRight,
  Users,
  ShieldCheck,
  Clock,
  Sparkles,
} from "lucide-react";

import DataState from "../../components/shared/DataState";
import { motion } from "framer-motion";
import Skeleton from "../../components/shared/Skeleton";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Protect route
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // Wait for auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500 text-lg font-medium">
          Loading dashboard...
        </div>
      </div>
    );
  }

  // Prevent render before redirect
  if (!user) {
    return null;
  }

  const {
    data: trees,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["trees"],
    enabled: !!user, // only fetch when authenticated
    queryFn: async () => {
      const token = localStorage.getItem("token");

      const res = await api.get("/trees", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return (res as any).data;
    },
  });

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <div className="space-y-12">
      {/* Welcome Header */}
      <header className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-100"
        >
          <ShieldCheck className="w-3 h-3" />
          Secure Workspace
        </motion.div>

        <h1 className="text-5xl font-black text-slate-900 tracking-tight">
          Welcome back,{" "}
          <span className="text-orange-600">{userName}</span>
        </h1>

        <p className="text-lg text-slate-600 max-w-2xl">
          Your family legacy is growing. Access your trees,
          manage permissions, and preserve history together.
        </p>
      </header>

      {/* Quick Actions / Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          Array(3)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4"
              >
                <Skeleton className="w-12 h-12 rounded-2xl" />

                <div className="space-y-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))
        ) : (
          <>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                <TreeDeciduous className="w-6 h-6 text-orange-600" />
              </div>

              <div>
                <p className="text-3xl font-black text-slate-900">
                  {trees?.length || 0}
                </p>

                <p className="text-sm font-medium text-slate-500">
                  Active Trees
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>

              <div>
                <p className="text-3xl font-black text-slate-900">
                  --
                </p>

                <p className="text-sm font-medium text-slate-500">
                  Family Members
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>

              <div>
                <p className="text-3xl font-black text-slate-900">
                  --
                </p>

                <p className="text-sm font-medium text-slate-500">
                  Recent Updates
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Family Memory Section */}
      <section className="bg-linear-to-r from-orange-500 to-orange-600 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-orange-200">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Sparkles className="w-32 h-32" />
        </div>

        <div className="relative z-10 max-w-xl space-y-6">
          <h2 className="text-3xl font-black leading-tight italic">
            "A family is like a forest; when you are outside it
            is dense, when you are inside you see that each tree
            has its place."
          </h2>

          <p className="text-orange-100 font-medium">
            Take a moment today to record a small memory about a
            grandparent or parent.
          </p>

          <button className="px-6 py-3 bg-white text-orange-600 rounded-2xl font-bold hover:bg-orange-50 transition-all flex items-center gap-2 text-sm shadow-lg">
            Add a Memory Note
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Trees Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            Your Family Trees

            {trees && trees.length > 0 && (
              <span className="text-sm font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {trees.length}
              </span>
            )}
          </h2>

          <Link
            href="/dashboard/new-tree"
            className="flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create New Tree
          </Link>
        </div>

        <DataState
          isLoading={isLoading}
          isError={isError}
          error={error as Error}
        >
          {trees && trees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trees.map((tree: any) => (
                <Link
                  key={tree.id}
                  href={`/tree/${tree.id}`}
                  className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all relative overflow-hidden"
                >
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        Role: {tree.role}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-2xl font-black text-slate-900 group-hover:text-orange-600 transition-colors">
                        {tree.name}
                      </h3>

                      <p className="text-slate-500 text-sm mt-1">
                        Started on{" "}
                        {new Date(
                          tree.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
                      Open Tree

                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center space-y-6">
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-10 h-10 text-orange-400" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">
                  No trees found
                </h3>

                <p className="text-slate-500 max-w-sm mx-auto">
                  You haven't created or joined any family trees
                  yet.
                </p>
              </div>

              <Link
                href="/dashboard/new-tree"
                className="inline-flex items-center gap-3 px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
              >
                Create Your First Tree

                <Plus className="w-5 h-5" />
              </Link>
            </div>
          )}
        </DataState>
      </section>
    </div>
  );
}