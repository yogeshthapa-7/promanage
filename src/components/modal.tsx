'use client';

import { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Plus, Check, FolderPlus, FolderEdit, DollarSign } from 'lucide-react';
import type React from 'react';

export interface ProjectFormData {
  id?: string;
  title: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold' | 'Overdue';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  category: string;
  description: string;
  startDate: string;
  submissionDate: string;
  targetEndDate: string;
  client: string;
  projectManager: string;
  progress: number;
  daysLeft: string;
  tasksCompleted: number;
  totalTasks: number;
  budget: string;
  teamMembers: string;
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProjectFormData) => void;
  initialData?: ProjectFormData | null;
}

const defaultFormData: ProjectFormData = {
  title: '',
  status: 'Not Started',
  priority: 'Medium',
  category: '',
  description: '',
  startDate: '',
  submissionDate: '',
  targetEndDate: '',
  client: '',
  projectManager: 'Kathmandu Shikshalaya',
  progress: 0,
  daysLeft: '',
  tasksCompleted: 0,
  totalTasks: 0,
  budget: '',
  teamMembers: '',
};

export default function ProjectModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: ProjectModalProps) {
  const isEditMode = Boolean(initialData?.id || initialData?.title);

  const [activeTab, setActiveTab] = useState('General Information');
  const [formData, setFormData] = useState<ProjectFormData>(initialData || defaultFormData);

  const tabs = ['General Information', 'Budget', 'Team'];

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
      onClose();
    },
    [formData, onSave, onClose]
  );

  const generalInfoContent = useMemo(
    () => (
      <div className="space-y-4">
        <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider">
          Project Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Project Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter project title"
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:border-purple-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Project ID</label>
            <input
              type="text"
              disabled
              value={formData.id || 'PRJ-2025-00124'}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-slate-100 text-muted-foreground font-medium outline-none cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Status <span className="text-rose-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:border-purple-500 outline-none transition-all cursor-pointer"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Priority <span className="text-rose-500">*</span>
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:border-purple-500 outline-none transition-all cursor-pointer font-medium"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:border-purple-500 outline-none transition-all cursor-pointer"
            >
              <option value="">Select category</option>
              <option value="Development">Development</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Research">Research</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Security">Security</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">
            Description <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <textarea
              name="description"
              rows={3}
              maxLength={500}
              required
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter project description..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:border-purple-500 outline-none transition-all resize-none"
            />
            <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">
              {formData.description.length} / 500
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Start Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                placeholder="Select start date"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:border-purple-500 outline-none transition-all"
              />
              <Calendar className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Submission Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="submissionDate"
                value={formData.submissionDate}
                onChange={handleChange}
                placeholder="Select submission date"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:border-purple-500 outline-none transition-all"
              />
              <Calendar className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Target End Date</label>
            <div className="relative">
              <input
                type="text"
                name="targetEndDate"
                value={formData.targetEndDate}
                onChange={handleChange}
                placeholder="Select target end date"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:border-purple-500 outline-none transition-all"
              />
              <Calendar className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Client <span className="text-rose-500">*</span>
            </label>
            <select
              name="client"
              value={formData.client}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:border-purple-500 outline-none transition-all cursor-pointer"
            >
              <option value="">Select client</option>
              <option value="ByteFlow Solutions">ByteFlow Solutions</option>
              <option value="Apeiron Tech">Apeiron Tech</option>
              <option value="Acme Corp">Acme Corp</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Project Manager <span className="text-rose-500">*</span>
            </label>
            <select
              name="projectManager"
              value={formData.projectManager}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:border-purple-500 outline-none transition-all cursor-pointer"
            >
              <option value="Kathmandu Shikshalaya">Kathmandu Shikshalaya</option>
              <option value="Anisha Gurung">Anisha Gurung</option>
              <option value="Prabin Thapa">Prabin Thapa</option>
            </select>
          </div>
        </div>
      </div>
    ),
    [formData, handleChange]
  );

  const budgetContent = useMemo(
    () => (
      <div className="space-y-4">
        <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider">
          Budget Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Total Budget <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                name="budget"
                required
                value={formData.budget}
                onChange={handleChange}
                placeholder="e.g. $48,000"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:border-purple-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Currency</label>
            <select
              name="currency"
              value="USD"
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:border-purple-500 outline-none transition-all cursor-pointer"
            >
              <option value="USD">USD ($)</option>
              <option value="NPR">NPR (Rs.)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Budget Notes</label>
          <textarea
            name="budgetNotes"
            rows={3}
            value={formData.budget}
            onChange={handleChange}
            placeholder="Add notes about budget allocation, payment schedule, etc..."
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:border-purple-500 outline-none transition-all resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Allocated</label>
            <input
              type="text"
              name="allocated"
              value={formData.budget}
              onChange={handleChange}
              placeholder="e.g. $40,000"
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:border-purple-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Spent</label>
            <input
              type="text"
              name="spent"
              value="$12,850"
              onChange={handleChange}
              placeholder="e.g. $12,850"
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:border-purple-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Remaining</label>
            <input
              type="text"
              name="remaining"
              value="$19,150"
              onChange={handleChange}
              placeholder="e.g. $19,150"
              className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:border-purple-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>
    ),
    [formData, handleChange]
  );

  const teamContent = useMemo(
    () => (
      <div className="space-y-4">
        <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider">
          Team Configuration
        </h3>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">
            Project Manager <span className="text-rose-500">*</span>
          </label>
          <select
            name="projectManager"
            value={formData.projectManager}
            onChange={handleChange}
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:border-purple-500 outline-none transition-all cursor-pointer"
          >
            <option value="Kathmandu Shikshalaya">Kathmandu Shikshalaya</option>
            <option value="Anisha Gurung">Anisha Gurung</option>
            <option value="Prabin Thapa">Prabin Thapa</option>
            <option value="Sagar Tamang">Sagar Tamang</option>
            <option value="Rita Shrestha">Rita Shrestha</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">
            Team Members <span className="text-rose-500">*</span>
          </label>
          <textarea
            name="teamMembers"
            rows={4}
            required
            value={formData.teamMembers}
            onChange={handleChange}
            placeholder="Enter team member names separated by commas&#10;e.g. Anisha Gurung, Prabin Thapa, Sagar Tamang"
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:border-purple-500 outline-none transition-all resize-none"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Add team member names separated by commas
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Team Size</label>
          <input
            type="number"
            name="totalTasks"
            min="0"
            value={formData.totalTasks}
            onChange={handleChange}
            placeholder="e.g. 5"
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-slate-50/50 focus:bg-white focus:border-purple-500 outline-none transition-all"
          />
        </div>
      </div>
    ),
    [formData, handleChange]
  );

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'Budget':
        return budgetContent;
      case 'Team':
        return teamContent;
      case 'General Information':
      default:
        return generalInfoContent;
    }
  }, [activeTab, generalInfoContent, budgetContent, teamContent]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-border/80 my-8 flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
              {isEditMode ? (
                <FolderEdit className="w-5 h-5" />
              ) : (
                <FolderPlus className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {isEditMode ? 'Edit Project' : 'New Project'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isEditMode
                  ? 'Update your project details and settings.'
                  : 'Create a new project and set it up.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1 px-6 border-b border-border/50 overflow-x-auto no-scrollbar shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                activeTab === tab
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
          {tabContent}

          <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-border/50 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white text-xs font-semibold shadow-md shadow-purple-500/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              {isEditMode ? (
                <>
                  <Check className="w-4 h-4" /> Save Changes
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return null;
}
