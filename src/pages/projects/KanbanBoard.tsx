'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input, Select, Button, Modal, message, Spin, Dropdown } from 'antd';
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Pencil,
  Eye,
  ListChecks,
} from 'lucide-react';
import { apiCall } from '@/lib/api';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

interface WorkStatus {
  WorkStatusInfoID: number;
  StatusName: string;
  StatusCode: string;
  Color?: string;
  IconName?: string;
}

interface Task {
  TaskInfoID: number;
  TaskName: string;
  Description: string;
  WorkStatusID: number;
  Priority: string;
  DueDate: string;
  ProjectInfoID: number;
  ProjectName?: string;
  AssignedTo?: string;
  Progress?: number;
}

interface TasksByStatus {
  [key: number]: Task[];
}

export default function KanbanBoard() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId?: string }>();
  
  const [workStatuses, setWorkStatuses] = useState<WorkStatus[]>([]);
  const [tasks, setTasks] = useState<TasksByStatus>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || 'all');
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<{ value: string; label: string }[]>([]);
  const [draggedTask, setDraggedTask] = useState<{ taskId: number; fromStatusId: number } | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch work statuses (columns)
  const fetchWorkStatuses = useCallback(async () => {
    try {
      const res = await apiCall(`${API_BASE}/WorkStatus/SelectList`);
      if (!res.ok) throw new Error('Failed to fetch work statuses');
      const data = await res.json();
      setWorkStatuses(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to load work statuses');
    }
  }, []);

  // Fetch tasks grouped by status
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = selectedProjectId === 'all' 
        ? `${API_BASE}/TaskInfo/SelectList`
        : `${API_BASE}/TaskInfo/SelectList?projectId=${selectedProjectId}`;
      
      const res = await apiCall(endpoint);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      
      const data = await res.json();
      const allTasks = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      
      // Group tasks by WorkStatusID
      const grouped: TasksByStatus = {};
      workStatuses.forEach(status => {
        grouped[status.WorkStatusInfoID] = [];
      });
      
      allTasks.forEach((task: Task) => {
        if (grouped[task.WorkStatusID]) {
          grouped[task.WorkStatusID].push(task);
        }
      });
      
      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        Object.keys(grouped).forEach(statusId => {
          grouped[Number(statusId)] = grouped[Number(statusId)].filter(
            task => task.TaskName.toLowerCase().includes(query)
          );
        });
      }
      
      setTasks(grouped);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, searchQuery, workStatuses]);

  // Fetch projects for filter dropdown
  const fetchProjects = useCallback(async () => {
    try {
      const res = await apiCall(`${API_BASE}/ProjectInfo/SelectList`);
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      const options = list.map((p: any) => ({
        value: String(p.ProjectInfoID || p.Value),
        label: p.ProjectName || p.Name,
      }));
      setProjects([{ value: 'all', label: 'All Projects' }, ...options]);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchWorkStatuses();
    fetchProjects();
  }, [fetchWorkStatuses, fetchProjects]);

  // Load tasks when statuses or filters change
  useEffect(() => {
    if (workStatuses.length > 0) {
      fetchTasks();
    }
  }, [workStatuses, selectedProjectId, searchQuery, fetchTasks]);

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      // Trigger search via useEffect
    }, 300);
  };

  // Handle drag start
  const handleDragStart = (taskId: number, statusId: number) => {
    setDraggedTask({ taskId, fromStatusId: statusId });
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = 'rgba(100, 108, 255, 0.05)';
  };

  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.style.backgroundColor = '';
  };

  // Handle drop - update task status
  const handleDrop = async (e: React.DragEvent, targetStatusId: number) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = '';

    if (!draggedTask) return;
    
    const { taskId, fromStatusId } = draggedTask;
    
    if (fromStatusId === targetStatusId) {
      setDraggedTask(null);
      return;
    }

    try {
      // Call ChangeWorkStatus API
      const res = await apiCall(`${API_BASE}/TaskInfo/ChangeWorkStatus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          TaskInfoID: taskId,
          WorkStatusID: targetStatusId,
        }),
      });

      if (!res.ok) throw new Error('Failed to update task status');

      message.success('Task status updated');
      
      // Update local state
      setTasks(prev => {
        const updated = { ...prev };
        
        // Remove from old status
        updated[fromStatusId] = updated[fromStatusId].filter(t => t.TaskInfoID !== taskId);
        
        // Add to new status
        const task = updated[fromStatusId]?.find(t => t.TaskInfoID === taskId);
        if (!updated[targetStatusId]) updated[targetStatusId] = [];
        
        // Find and move the task
        const taskToMove = Object.values(updated)
          .flat()
          .find(t => t.TaskInfoID === taskId);
        
        if (taskToMove) {
          updated[targetStatusId] = [...updated[targetStatusId], { ...taskToMove, WorkStatusID: targetStatusId }];
          updated[fromStatusId] = updated[fromStatusId].filter(t => t.TaskInfoID !== taskId);
        }
        
        return updated;
      });

      setDraggedTask(null);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to update status');
      setDraggedTask(null);
    }
  };

  // Handle delete task
  const handleDeleteTask = (taskId: number) => {
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this task?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await apiCall(`${API_BASE}/DeleteTaskInfo?id=${taskId}`, {
            method: 'GET',
          });
          if (!res.ok) throw new Error('Failed to delete task');
          message.success('Task deleted');
          fetchTasks();
        } catch (err) {
          message.error(err instanceof Error ? err.message : 'Delete failed');
        }
      },
    });
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    const p = priority?.toLowerCase() || '';
    if (p.includes('urgent') || p.includes('high')) return 'bg-red-100 text-red-700';
    if (p.includes('medium')) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  // Get status color (use from API or default)
  const getStatusColor = (status: WorkStatus) => {
    if (status.Color) return status.Color;
    const colors: { [key: number]: string } = {
      1: 'from-red-50 to-red-100 border-red-200',
      2: 'from-blue-50 to-blue-100 border-blue-200',
      3: 'from-yellow-50 to-yellow-100 border-yellow-200',
      4: 'from-green-50 to-green-100 border-green-200',
    };
    return colors[status.WorkStatusInfoID] || 'from-gray-50 to-gray-100 border-gray-200';
  };

  if (loading && workStatuses.length === 0) {
    return <Spin className="flex items-center justify-center h-screen" />;
  }

  return (
    <div className="space-y-4 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kanban Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage tasks by work status</p>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          size="large"
          onClick={() => navigate('/projects')}
        >
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <Input
          placeholder="Search tasks..."
          prefix={<Search className="w-4 h-4 text-gray-400" />}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="md:w-64"
          size="large"
        />
        <Select
          value={selectedProjectId}
          onChange={setSelectedProjectId}
          options={projects}
          className="md:w-48"
          size="large"
        />
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pb-8">
        {workStatuses.map((status) => (
          <div
            key={status.WorkStatusInfoID}
            className={`bg-gradient-to-b ${getStatusColor(status)} rounded-lg border-l-4 min-h-[600px] p-4 flex flex-col`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg text-gray-800">{status.StatusName}</h2>
                <span className="inline-block mt-1 px-2 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded">
                  {tasks[status.WorkStatusInfoID]?.length || 0}
                </span>
              </div>
              <MoreVertical className="w-4 h-4 text-gray-400 cursor-pointer" />
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status.WorkStatusInfoID)}
              className="flex-1 space-y-3 p-2 rounded min-h-[500px] transition-colors duration-200"
            >
              {tasks[status.WorkStatusInfoID]?.map((task) => (
                <div
                  key={task.TaskInfoID}
                  draggable
                  onDragStart={() => handleDragStart(task.TaskInfoID, status.WorkStatusInfoID)}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md p-3 cursor-grab active:cursor-grabbing transition-shadow border-l-4 border-indigo-500"
                >
                  {/* Task Title */}
                  <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 mb-2">
                    {task.TaskName}
                  </h3>

                  {/* Task Description */}
                  {task.Description && (
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {task.Description}
                    </p>
                  )}

                  {/* Task Meta */}
                  <div className="space-y-2 text-xs">
                    {task.ProjectName && (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                          {task.ProjectName}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded font-medium ${getPriorityColor(task.Priority)}`}>
                        {task.Priority}
                      </span>
                      {task.Progress !== undefined && (
                        <span className="text-gray-600">{task.Progress}%</span>
                      )}
                    </div>

                    {task.DueDate && (
                      <div className="text-gray-600">
                        Due: {new Date(task.DueDate).toLocaleDateString()}
                      </div>
                    )}

                    {task.AssignedTo && (
                      <div className="text-gray-600">
                        Assigned: {task.AssignedTo}
                      </div>
                    )}
                  </div>

                  {/* Task Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => navigate(`/projects/${task.ProjectInfoID}/tasks/${task.TaskInfoID}`)}
                      className="flex-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.TaskInfoID)}
                      className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Task Button */}
              {tasks[status.WorkStatusInfoID]?.length === 0 && (
                <div className="flex items-center justify-center h-20 text-gray-400">
                  <p className="text-sm">No tasks yet</p>
                </div>
              )}
            </div>

            {/* Add Task for this Status */}
            <button className="mt-3 w-full px-3 py-2 border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        ))}
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 pt-8 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-xs uppercase text-gray-600 font-semibold">Total Tasks</p>
          <p className="text-2xl font-bold text-gray-800">
            {Object.values(tasks).flat().length}
          </p>
        </div>
        {workStatuses.slice(0, 3).map((status) => (
          <div key={status.WorkStatusInfoID} className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs uppercase text-gray-600 font-semibold">{status.StatusName}</p>
            <p className="text-2xl font-bold text-gray-800">
              {tasks[status.WorkStatusInfoID]?.length || 0}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
