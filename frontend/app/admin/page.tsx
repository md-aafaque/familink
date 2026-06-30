"use client";
import { useRouter } from 'next/navigation';
import { Shield, Users, Settings, ArrowRight, Link2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAppTheme } from '@/components/providers/ThemeProvider';

import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const router = useRouter();
  const { theme } = useAppTheme();

  return (
    <div className="relative space-y-8 overflow-hidden">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10"
      >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Shield className={cn("w-8 h-8", theme.colors.accent)} />
          <h1 className={cn("text-2xl font-bold", theme.colors.text)}>Admin Dashboard</h1>
        </div>
        <p className={theme.colors.textMuted}>Manage users and system settings</p>
      </motion.div>

      {/* Main Actions */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Pending User Approvals */}
        <motion.button
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={() => router.push('/dashboard/manage/users')}
          className="card group hover:shadow-pop-lg transition-all duration-300 cursor-pointer text-left"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={cn("p-3 rounded-lg transition-colors", theme.colors.primaryMuted)}>
              <Users className={cn("w-6 h-6", theme.colors.accent)} />
            </div>
            <ArrowRight className={cn("w-5 h-5 transition-colors opacity-40 group-hover:opacity-100", theme.colors.accent)} />
          </div>
          <h3 className={cn("text-lg font-semibold mb-2", theme.colors.text)}>Pending User Approvals</h3>
          <p className={theme.colors.textMuted}>Review and approve new user accounts</p>
        </motion.button>

        {/* Pending Relationship Approvals */}
        <motion.button
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={() => router.push('/dashboard/manage/proposals')}
          className="card group hover:shadow-pop-lg transition-all duration-300 cursor-pointer text-left"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={cn("p-3 rounded-lg transition-colors", "bg-primary/10 group-hover:bg-primary/20")}>
              <Link2 className={cn("w-6 h-6", "text-primary/70 group-hover:text-primary transition-colors")} />
            </div>
            <ArrowRight className={cn("w-5 h-5 transition-colors opacity-40 group-hover:opacity-100", theme.colors.accent)} />
          </div>
          <h3 className={cn("text-lg font-semibold mb-2", theme.colors.text)}>Pending Relationships</h3>
          <p className={theme.colors.textMuted}>Review and approve family relationships</p>
        </motion.button>

        {/* Settings */}
        <motion.button
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={() => router.push('/admin/settings')}
          className="card group hover:shadow-pop-lg transition-all duration-300 cursor-pointer text-left"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={cn("p-3 rounded-lg transition-colors", theme.colors.primaryMuted)}>
              <Settings className={cn("w-6 h-6", theme.colors.accent)} />
            </div>
            <ArrowRight className={cn("w-5 h-5 transition-colors opacity-40 group-hover:opacity-100", theme.colors.accent)} />
          </div>
          <h3 className={cn("text-lg font-semibold mb-2", theme.colors.text)}>System Settings</h3>
          <p className={theme.colors.textMuted}>Configure system options and preferences</p>
        </motion.button>
      </motion.div>

      {/* Info Cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
        }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="card"
        >
          <div className={cn("text-3xl font-bold mb-2", theme.colors.accent)}>👥</div>
          <h4 className={cn("font-semibold mb-1", theme.colors.text)}>User Management</h4>
          <p className={cn("text-sm", theme.colors.textMuted)}>Approve, reject, and manage user accounts</p>
        </motion.div>
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="card"
        >
          <div className={cn("text-3xl font-bold mb-2", theme.colors.accent)}>🛡️</div>
          <h4 className={cn("font-semibold mb-1", theme.colors.text)}>Admin Controls</h4>
          <p className={cn("text-sm", theme.colors.textMuted)}>Create new admin accounts for other admins</p>
        </motion.div>
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="card"
        >
          <div className={cn("text-3xl font-bold mb-2", theme.colors.textMuted)}>⚙️</div>
          <h4 className={cn("font-semibold mb-1", theme.colors.text)}>Configuration</h4>
          <p className={cn("text-sm", theme.colors.textMuted)}>Manage system settings and preferences</p>
        </motion.div>
      </motion.div>
    </motion.div>
    </div>
  );
}
