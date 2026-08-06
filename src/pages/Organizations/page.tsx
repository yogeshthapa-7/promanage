'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Building2 } from 'lucide-react';
import { Modal, message } from 'antd';
import Pagination from '@/components/ui/Pagination';
import { fetchOrganizations, type Organization } from '@/lib/organizations-data';
import CreateOrganizationModal from './Create';
import { apiCall } from '@/lib/api';

export default function OrganizationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetchOrganizations({
      search: searchQuery,
      start: (currentPage - 1) * pageSize,
      length: pageSize,
    })
      .then((result) => {
        setOrganizations(result.organizations);
        setTotalFiltered(result.filtered);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [searchQuery, currentPage, pageSize, refreshKey]);

  const refreshOrganizations = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleAddNew = () => {
    setEditingOrg(null);
    setShowCreateModal(true);
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setShowCreateModal(true);
  };

  const handleDelete = async (org: Organization) => {
    Modal.confirm({
      title: 'Delete Organization',
      content: `Are you sure you want to delete "${org.title}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
        const res = await apiCall(
          `https://datacollection.kathmandu.gov.np:8080/DeleteOrganization?id=${org.id}`,
          { method: 'GET' }
        );

          if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

          message.success(`Organization "${org.title}" deleted successfully`);
          refreshOrganizations();
        } catch (err) {
          if (err instanceof Error) {
            message.error(err.message || 'Failed to delete organization');
          }
        }
      },
    });
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setEditingOrg(null);
    setCurrentPage(1);
    refreshOrganizations();
    message.success('Organization saved successfully');
  };

  return (
    <div className="fade-in text-slate-800">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Organizations</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage organizations, view details, and update or remove entries.
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Organization
        </button>
      </div>
      <hr className="border-slate-200 my-6" />

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
        <div className="md:col-span-2">
          <div className="mb-1 text-xs font-medium text-slate-500">Title</div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <button
              onClick={handleSearch}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-slate-500">entries</span>
          </div>
          <span className="text-sm text-slate-500">
            {totalFiltered} total records
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-slate-100 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : organizations.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm text-slate-400">No organizations found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10 hover:border-purple-200 overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-violet-700 transition-colors truncate">
                        {org.title || 'Untitled'}
                      </h3>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 shrink-0 ml-2">
                    #{org.SN}
                  </span>
                </div>

                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-slate-400 shrink-0">Organization ID</span>
                    <span className="font-semibold text-slate-700 truncate">{org.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-slate-400 shrink-0">Parent Org</span>
                    <span className="font-semibold text-slate-700 truncate">
                      {org.parentOrganizationName || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-slate-400 shrink-0">Parent ID</span>
                    <span className="font-semibold text-slate-700 truncate">{org.parentOrganizationId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleEdit(org)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-600 hover:bg-violet-100 transition cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(org)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && organizations.length > 0 && (
          <Pagination
            total={totalFiltered}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            pageSizeOptions={[20, 50, 100]}
          />
        )}
      </div>

      <CreateOrganizationModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingOrg(null);
        }}
        onSuccess={handleCreateSuccess}
        editingOrganization={editingOrg}
      />
    </div>
  );
}