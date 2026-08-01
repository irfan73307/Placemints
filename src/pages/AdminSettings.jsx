import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  UserPlus,
  Key,
  Mail,
  Lock,
  UserCheck,
  UserX,
  Trash2,
  RefreshCw,
  Crown,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import apiClient from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import Button from '../components/Button';
import Badge from '../components/Badge';

export default function AdminSettings() {
  const { user } = useAuth();
  const toast = useToast();

  const isPrimaryAdmin = user?.isPrimaryAdmin || user?.email === '127015088@sastra.ac.in';

  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [resetForm, setResetForm] = useState({ newPassword: '', confirmPassword: '' });
  const [selectedTargetAdmin, setSelectedTargetAdmin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/manage');
      setAdmins(res.data?.admins || []);
    } catch (err) {
      console.error('Failed to load admins list:', err);
      toast.error('Failed to retrieve admins list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (addForm.password !== addForm.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/admin/manage/add', addForm);
      toast.success(res.data?.message || 'Secondary Admin created successfully.');
      setShowAddModal(false);
      setAddForm({ fullName: '', email: '', password: '', confirmPassword: '' });
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (adminId) => {
    try {
      const res = await apiClient.patch(`/admin/manage/${adminId}/toggle`);
      toast.success(res.data?.message || 'Admin status updated.');
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle status.');
    }
  };

  const handleRemoveAdmin = async (adminId, adminEmail) => {
    if (!window.confirm(`Are you sure you want to revoke Admin rights for ${adminEmail}?`)) return;

    try {
      const res = await apiClient.delete(`/admin/manage/${adminId}`);
      toast.success(res.data?.message || 'Admin rights revoked.');
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke admin rights.');
    }
  };

  const handleResetAdminPassword = async (e) => {
    e.preventDefault();
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post(`/admin/manage/${showResetPasswordModal.id}/reset-password`, resetForm);
      toast.success(res.data?.message || 'Password reset successfully.');
      setShowResetPasswordModal(null);
      setResetForm({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeOwnPassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/admin/manage/change-password', passwordForm);
      toast.success(res.data?.message || 'Password updated successfully.');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedTargetAdmin) {
      toast.error('Please select an existing admin to transfer ownership.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/admin/manage/transfer', { targetAdminId: selectedTargetAdmin });
      toast.success(res.data?.message || 'Primary Admin ownership transferred.');
      setShowTransferModal(false);
      fetchAdmins();
      window.location.reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to transfer ownership.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Crown className="w-4 h-4" />
            <span>Primary Admin Security Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Admin Accounts & Permissions
          </h1>
          <p className="text-sm text-indigo-200/80 max-w-2xl">
            Database-driven Role-Based Access Control (RBAC): Manage administrator accounts, assign permissions, and control security keys.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isPrimaryAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Admin</span>
            </Button>
          )}
        </div>
      </div>

      {/* Primary Admin Quick Actions Card */}
      {isPrimaryAdmin && (
        <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">You are the Primary Admin</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Full control over administrator accounts, password resets, and ownership transfer.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="secondary" size="xs" onClick={() => setShowPasswordModal(true)} className="gap-1">
                <Key className="w-3.5 h-3.5" />
                <span>Change My Password</span>
              </Button>
              <Button variant="secondary" size="xs" onClick={() => setShowTransferModal(true)} className="gap-1 text-amber-600 dark:text-amber-400">
                <Crown className="w-3.5 h-3.5" />
                <span>Transfer Ownership</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isPrimaryAdmin && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 font-medium">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Secondary Admin Access: You can view administrators. Modifying settings requires Primary Admin privileges.</span>
        </div>
      )}

      {/* Admins Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Registered Administrators ({admins.length})
          </h3>
          <Button variant="secondary" size="xs" onClick={fetchAdmins} className="gap-1">
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[11px]">
                <th className="py-3.5 px-6">Administrator</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Role & Status</th>
                <th className="py-3.5 px-4">Last Active</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Loading admin accounts from Supabase...
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                        {admin.fullName.charAt(0)}
                      </div>
                      <div>
                        <div>{admin.fullName}</div>
                        {admin.isPrimaryAdmin && (
                          <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                            <Crown className="w-3 h-3" /> Primary Admin Owner
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {admin.email}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={admin.isPrimaryAdmin ? 'warning' : 'primary'} size="sm">
                          {admin.isPrimaryAdmin ? 'PRIMARY ADMIN' : 'ADMIN'}
                        </Badge>
                        {admin.isActive ? (
                          <Badge variant="success" size="sm">Active</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">Disabled</Badge>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(admin.lastLogin).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-6 text-right">
                      {isPrimaryAdmin && !admin.isPrimaryAdmin ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(admin.id)}
                            title={admin.isActive ? 'Disable Admin' : 'Enable Admin'}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {admin.isActive ? <UserX className="w-4 h-4 text-amber-600" /> : <UserCheck className="w-4 h-4 text-emerald-600" />}
                          </button>
                          <button
                            onClick={() => setShowResetPasswordModal(admin)}
                            title="Reset Password"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                            title="Revoke Admin Privileges"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">Protected</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Administrator</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Placement Officer Name"
                  value={addForm.fullName}
                  onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">SASTRA Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="admin@sastra.ac.in"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Confirm Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Confirm Password"
                  value={addForm.confirmPassword}
                  onChange={(e) => setAddForm({ ...addForm, confirmPassword: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>Create Admin</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Own Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Change Primary Admin Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangeOwnPassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Current Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">New Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>Update Password</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-amber-600 flex items-center gap-2">
                <Crown className="w-5 h-5" /> Transfer Primary Admin Ownership
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Transferring ownership will make the selected admin the Primary Admin with full privileges. You will remain a Secondary Admin.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Select Target Admin *</label>
              <select
                value={selectedTargetAdmin}
                onChange={(e) => setSelectedTargetAdmin(e.target.value)}
                className="w-full mt-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm dark:text-white"
              >
                <option value="">Select an Admin...</option>
                {admins.filter((a) => !a.isPrimaryAdmin).map((a) => (
                  <option key={a.id} value={a.id}>{a.fullName} ({a.email})</option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowTransferModal(false)}>Cancel</Button>
              <Button type="button" variant="primary" onClick={handleTransferOwnership} isLoading={isSubmitting}>
                Transfer Ownership
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
