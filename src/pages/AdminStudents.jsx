import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  ArrowUpDown,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  GraduationCap,
  Award,
  BookOpen,
  Github,
  Linkedin,
  Code,
  X,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import apiClient from '../services/api';
import Button from '../components/Button';
import Badge from '../components/Badge';
import CompanyLogo from '../components/CompanyLogo';
import { useToast } from '../contexts/ToastContext';

export default function AdminStudents() {
  const toast = useToast();
  const [students, setStudents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [department, setDepartment] = useState('All');
  const [graduationYear, setGraduationYear] = useState('All');
  const [placementGoal, setPlacementGoal] = useState('All');
  const [profileCompleted, setProfileCompleted] = useState('All');
  const [sortBy, setSortBy] = useState('name_asc');
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Deletion modal state
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/students', {
        params: {
          search: searchQuery,
          department,
          graduationYear,
          placementGoal,
          profileCompleted,
          sortBy,
        },
      });
      setStudents(res.data?.data || []);
      if (res.data?.totalCount !== undefined) {
        setTotalCount(res.data.totalCount);
      } else if (res.data?.pagination?.grandTotal !== undefined) {
        setTotalCount(res.data.pagination.grandTotal);
      } else if (res.data?.pagination?.total !== undefined) {
        setTotalCount(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [searchQuery, department, graduationYear, placementGoal, profileCompleted, sortBy]);

  const handleStudentClick = async (student) => {
    setSelectedStudent(student);
    setIsLoadingDetails(true);
    try {
      const res = await apiClient.get(`/admin/students/${student.id}`);
      setStudentDetails(res.data?.student || student);
    } catch (err) {
      setStudentDetails(student);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/admin/students/${studentToDelete.id}`);
      toast.success(`Removed "${studentToDelete.name || studentToDelete.email}" from database.`);
      
      // Close detail drawer if deleting currently viewed student
      if (selectedStudent && selectedStudent.id === studentToDelete.id) {
        setSelectedStudent(null);
        setStudentDetails(null);
      }
      setStudentToDelete(null);
      fetchStudents();
    } catch (err) {
      console.error('Failed to delete student:', err);
      toast.error(err.response?.data?.message || 'Failed to remove student from database.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await apiClient.get('/admin/students/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sastra_students_directory.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-indigo-500/20">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>SASTRA Admin Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Student Database & Placement Records
          </h1>
          <p className="text-sm text-indigo-200/80 max-w-2xl font-medium">
            Single Source of Truth: Centralized management for SASTRA University student profiles, academic metrics, and removal operations.
          </p>
        </div>

        {/* Total Student Metric Cards */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 text-center min-w-[130px]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200 block">Total Enrolled</span>
            <span className="text-xl font-black text-white block mt-0.5">{totalCount || students.length}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 text-center min-w-[130px]">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-200 block">Filtered Count</span>
            <span className="text-xl font-black text-amber-300 block mt-0.5">{students.length}</span>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchStudents}
              className="gap-2 bg-white/10 hover:bg-white/20 border-white/20 text-white"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportCSV}
              className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Name or Roll Number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white"
            >
              <option value="All">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="IT">IT</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
              <option value="AIDS">AIDS</option>
            </select>
          </div>

          {/* Graduation Year */}
          <div>
            <select
              value={graduationYear}
              onChange={(e) => setGraduationYear(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white"
            >
              <option value="All">All Batch Years</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white"
            >
              <option value="name_asc">Name (A - Z)</option>
              <option value="name_desc">Name (Z - A)</option>
              <option value="cgpa_desc">CGPA (High to Low)</option>
              <option value="cgpa_asc">CGPA (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-4 px-6">Student Name</th>
                <th className="py-4 px-4">Roll Number</th>
                <th className="py-4 px-4">Department</th>
                <th className="py-4 px-4">Batch</th>
                <th className="py-4 px-4">CGPA</th>
                <th className="py-4 px-4">Target Goal</th>
                <th className="py-4 px-4">Profile Status</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                      <span>Loading Student Directory from Supabase...</span>
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No matching student records found. Try adjusting your search query or filters.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student.id}
                    onClick={() => handleStudentClick(student)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-6 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 border border-indigo-200 dark:border-indigo-800">
                        {student.avatar ? (
                          <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          student.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{student.name}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 font-normal">{student.email}</div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {student.rollNumber}
                    </td>

                    <td className="py-4 px-4 font-medium text-slate-700 dark:text-slate-300">
                      <Badge variant="neutral" size="sm">{student.department}</Badge>
                    </td>

                    <td className="py-4 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {student.graduationYear}
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-slate-100">
                      <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{student.cgpa}</span>
                    </td>

                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400 max-w-[180px] truncate">
                      {student.placementGoal}
                    </td>

                    <td className="py-4 px-4">
                      {student.profileCompleted ? (
                        <Badge variant="success" size="sm" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Complete
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm" className="gap-1">
                          <XCircle className="w-3 h-3" /> Incomplete
                        </Badge>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => handleStudentClick(student)}
                          className="gap-1"
                        >
                          <span>Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                        <button
                          type="button"
                          onClick={() => setStudentToDelete(student)}
                          title={`Remove ${student.name} from database`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Drawer Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border-l border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-extrabold text-xl flex items-center justify-center overflow-hidden border border-indigo-200 dark:border-indigo-800 shadow-sm">
                  {selectedStudent.avatar ? (
                    <img src={selectedStudent.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    selectedStudent.name.charAt(0)
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedStudent.name}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                    {selectedStudent.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingDetails ? (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                <p>Loading full profile records from Supabase PostgreSQL...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Academic Snapshot */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Roll Number</div>
                    <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">{studentDetails?.rollNumber}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Department</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{studentDetails?.department}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">Graduation Year</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{studentDetails?.graduationYear}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-medium">CGPA</div>
                    <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{studentDetails?.cgpa}</div>
                  </div>
                </div>

                {/* Placement Goal */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Role & Placement Goal</h3>
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl">
                    <div className="text-base font-bold text-indigo-900 dark:text-indigo-200">{studentDetails?.placementGoal}</div>
                  </div>
                </div>

                {/* Coding Profiles */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Coding Handles & Profiles</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {studentDetails?.github && (
                      <a href={studentDetails.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600">
                        <Github className="w-4 h-4 text-slate-900 dark:text-white" />
                        <span className="truncate">GitHub Profile</span>
                      </a>
                    )}
                    {studentDetails?.linkedin && (
                      <a href={studentDetails.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600">
                        <Linkedin className="w-4 h-4 text-blue-600" />
                        <span className="truncate">LinkedIn Profile</span>
                      </a>
                    )}
                    {studentDetails?.leetcode && (
                      <a href={studentDetails.leetcode} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600">
                        <Code className="w-4 h-4 text-amber-500" />
                        <span className="truncate">LeetCode Handle</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Saved Companies */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Saved Target Companies ({studentDetails?.savedCompanies?.length || 0})</h3>
                  {studentDetails?.savedCompanies?.length === 0 ? (
                    <p className="text-xs text-slate-400">No saved target companies yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {studentDetails?.savedCompanies?.map((s) => (
                        <div key={s.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2.5">
                          <CompanyLogo logoUrl={s.logoUrl} name={s.name} size="sm" />
                          <span className="truncate">{s.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Admin Danger Zone: Delete Student */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Admin Danger Zone</span>
                  </h3>
                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => setStudentToDelete(selectedStudent)}
                    className="w-full justify-center gap-2 py-3 shadow-md"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove Student Record from Database</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Student Deletion */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center animate-scaleUp">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center border border-red-200 dark:border-red-900">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Confirm Removal</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure you want to permanently delete student{' '}
                <strong className="text-slate-900 dark:text-slate-100 font-bold">{studentToDelete.name || studentToDelete.email}</strong>{' '}
                ({studentToDelete.rollNumber}) from the SASTRA University database?
              </p>
            </div>

            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-left text-xs text-red-700 dark:text-red-300 font-medium">
              ⚠️ Warning: This will delete the student profile, saved target companies, and all associated placement data permanently.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setStudentToDelete(null)}
                isDisabled={isDeleting}
                className="flex-1 justify-center"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleDeleteConfirm}
                isLoading={isDeleting}
                className="flex-1 justify-center gap-2 bg-red-600 hover:bg-red-700 shadow-md"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Student</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
