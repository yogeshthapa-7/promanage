'use client';

import { useState, useRef } from 'react';
import { Plus, LayoutList, LayoutGrid, Eye, Download } from 'lucide-react';
import { Modal, message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import { CardGridSkeleton } from '@/components/ui/Loaders';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { fetchBudgets, type Budget } from '@/lib/budget-data';
import { apiCall } from '@/lib/api';
import CreateBudgetDrawer from './Create';
import { usePaginatedList, type PaginatedListParams } from '@/hooks/usePaginatedList';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

function fetchBudgetsPage(params: PaginatedListParams): Promise<{ items: Budget[]; total: number }> {
  return fetchBudgets({
    search: (params.search as string) || '',
    fiscalYear: (params.fiscalYear as string) || '',
    start: params.start as number,
    length: params.length as number,
    signal: params.signal,
  }).then((result) => ({
    items: result.budgets,
    total: result.filtered,
  }));
}

export default function BudgetPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [fiscalYearQuery, setFiscalYearQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fiscalYearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: budgets,
    total: totalFiltered,
    loading,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    refetch,
  } = usePaginatedList<Budget>({
    fetcher: (params) => fetchBudgetsPage({ 
      ...params, 
      search: searchQuery,
      fiscalYear: fiscalYearQuery,
    }),
    initialPageSize: 20,
    extraDeps: [searchQuery, fiscalYearQuery],
  });

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleAddNew = () => {
    setEditingBudget(null);
    setShowFormModal(true);
  };

  const handleViewBudget = (budget: Budget) => {
    if (budget.document_url) {
      window.open(budget.document_url, '_blank');
    } else {
      message.info('No document attached to this budget');
    }
  };

  const handleDownloadBudget = (budget: Budget) => {
    if (budget.document_url) {
      const link = document.createElement('a');
      link.href = budget.document_url;
      link.target = '_blank';
      link.download = `${budget.name || 'budget'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      message.info('No document attached to this budget');
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setShowFormModal(true);
  };

  const handleDelete = async (budget: Budget) => {
    Modal.confirm({
      title: 'Delete Budget',
      content: `Are you sure you want to delete "${budget.name || 'this budget'}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await apiCall(`${API_BASE}/DeleteBudgetInfo?id=${budget.id}`, {
            method: 'GET',
          });

          if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

          message.success('Budget deleted successfully');
          queryClient.invalidateQueries({ queryKey: ['budgets'] });
          refetch();
        } catch (err) {
          if (err instanceof Error) {
            message.error(err.message || 'Failed to delete budget');
          }
        }
      },
    });
  };

  return (
    <div className="fade-in text-slate-800">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Budgets</h1>
          <p className="mt-1 text-base text-slate-500">
            Strategic allocation of resources to maximize impact.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="primary" onClick={handleAddNew} icon={<Plus className="h-4 w-4" />}>
            Add Budget
          </Button>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="List view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <hr className="border-slate-200 my-6" />

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4 md:items-end">
        <div>
          <div className="mb-1 text-sm font-medium text-slate-500">Fiscal Year</div>
          <SearchInput
            value={fiscalYearQuery}
            onChange={(value) => {
              setFiscalYearQuery(value);
              if (fiscalYearTimerRef.current) {
                clearTimeout(fiscalYearTimerRef.current);
              }
              fiscalYearTimerRef.current = setTimeout(() => {
                setCurrentPage(1);
              }, 400);
            }}
            placeholder="e.g. 2082/083"
            containerClassName="w-full"
          />
        </div>
        <div className="md:col-span-2">
          <div className="mb-1 text-sm font-medium text-slate-500">Budget Name</div>
          <div className="flex gap-2">
            <SearchInput
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value);
                if (debounceTimerRef.current) {
                  clearTimeout(debounceTimerRef.current);
                }
                 debounceTimerRef.current = setTimeout(() => {
                    setCurrentPage(1);
                  }, 400);
              }}
              placeholder="Search by budget name..."
              containerClassName="flex-1"
            />
            <Button type="primary" onClick={handleSearch}>Search</Button>
          </div>
        </div>
        
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          {/* <div className="flex items-center gap-3">
            <span className="text-base text-slate-500">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-base text-slate-500">entries</span>
          </div> */}
          <span className="text-base text-slate-500">
            {totalFiltered} total records
          </span>
        </div>

        {loading ? (
          viewMode === 'list' ? (
            <Card className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-1.5">
                  <thead>
                    <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                      <th className="rounded-l-xl bg-slate-50 px-5 py-3">Title</th>
                      <th className="bg-slate-50 px-4 py-3">Fiscal Year</th>
                      <th className="bg-slate-50 px-4 py-3">Attachment</th>
                      <th className="rounded-r-xl bg-slate-50 px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgets.map((budget) => (
                      <tr
                        key={budget.id}
                        className="text-sm text-slate-700"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.01)';
                          e.currentTarget.style.transition = 'transform 0.25s cubic-bezier(0.4,0,0.2,1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <td className="rounded-l-xl bg-white px-4 py-3 border-b border-slate-100">
                          <div className="font-semibold text-slate-900">{budget.name || 'Untitled'}</div>
                        </td>
                        <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600 font-medium">
                          {budget.fiscal_year || '—'}
                        </td>
                        <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600 font-medium">
                          {budget.document_url ? (
                            <a href={budget.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              Document
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="rounded-r-xl bg-white px-4 py-3 text-right border-b border-slate-100">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="text"
                              size="small"
                              onClick={() => handleViewBudget(budget)}
                              icon={<Eye className="w-3.5 h-3.5" />}
                              disabled={!budget.document_url}
                            />
                            <Button
                              size="small"
                              onClick={() => handleDownloadBudget(budget)}
                              icon={<Download className="w-3.5 h-3.5" />}
                              disabled={!budget.document_url}
                            />
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => handleEdit(budget)}
                              icon={
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              }
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              danger
                              onClick={() => handleDelete(budget)}
                              icon={
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              }
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <CardGridSkeleton count={8} />
          )
        ) : budgets.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-base text-slate-400">No budgets found</p>
          </div>
        ) : viewMode === 'list' ? (
          <Card className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-1.5">
                <thead>
                  <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                    <th className="rounded-l-xl bg-slate-50 px-5 py-3">Title</th>
                    <th className="bg-slate-50 px-4 py-3">Fiscal Year</th>
                    <th className="bg-slate-50 px-4 py-3">Attachment</th>
                    <th className="rounded-r-xl bg-slate-50 px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((budget) => (
                    <tr
                      key={budget.id}
                      className="text-sm text-slate-700"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.01)';
                        e.currentTarget.style.transition = 'transform 0.25s cubic-bezier(0.4,0,0.2,1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <td className="rounded-l-xl bg-white px-4 py-3 border-b border-slate-100">
                        <div className="font-semibold text-slate-900">{budget.name || 'Untitled'}</div>
                      </td>
                      <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600 font-medium">
                        {budget.fiscal_year || '—'}
                      </td>
                      <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600 font-medium">
                        {budget.document_url ? (
                          <a href={budget.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Document
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="rounded-r-xl bg-white px-4 py-3 text-right border-b border-slate-100">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="text"
                            size="small"
                            onClick={() => handleViewBudget(budget)}
                            icon={<Eye className="w-3.5 h-3.5" />}
                            disabled={!budget.document_url}
                          />
                          <Button
                            size="small"
                            onClick={() => handleDownloadBudget(budget)}
                            icon={<Download className="w-3.5 h-3.5" />}
                            disabled={!budget.document_url}
                          />
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleEdit(budget)}
                            icon={
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            danger
                            onClick={() => handleDelete(budget)}
                            icon={
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {budgets.map((budget) => (
              <Card
                key={budget.id}
                hover
                className="group overflow-hidden"
              >
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors break-words">
                    {budget.name || 'Untitled'}
                  </h3>
                </div>
                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="text-slate-400 shrink-0">Fiscal Year</span>
                    <span className="font-semibold text-slate-700 truncate">{budget.fiscal_year || '—'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="primary"
                    size="sm"
                    onClick={() => handleViewBudget(budget)}
                    icon={<Eye className="h-4 w-4" />}
                    disabled={!budget.document_url}
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDownloadBudget(budget)}
                    icon={<Download className="h-4 w-4" />}
                    disabled={!budget.document_url}
                  >
                    Download
                  </Button>
                  <Button
                    type="primary"
                    size="sm"
                    onClick={() => handleEdit(budget)}
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    }
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    danger
                    onClick={() => handleDelete(budget)}
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    }
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!loading && budgets.length > 0 && (
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

      <CreateBudgetDrawer
        open={showFormModal}
        onClose={() => { setShowFormModal(false); setEditingBudget(null); }}
        onSuccess={refetch}
        editingBudget={editingBudget}
      />
    </div>
  );
}
