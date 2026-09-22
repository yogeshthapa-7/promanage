'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, LayoutList, LayoutGrid, Eye, Download } from 'lucide-react';
import { Modal, message, Select } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import { CardGridSkeleton } from '@/components/ui/Loaders';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import { fetchExpenses, type Expense } from '@/data/expense-data';
import { apiCall } from '@/services/api';
import { fetchFiscalYearSelectList, type FiscalYearSelectOption } from '@/data/fiscal-year-data';
import CreateExpenseDrawer from './Create';
import ViewExpenseDrawer from './View';
import { usePaginatedList, type PaginatedListParams } from '@/hooks/usePaginatedList';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

function fetchExpensesPage(params: PaginatedListParams): Promise<{ items: Expense[]; total: number }> {
  return fetchExpenses({
    search: (params.search as string) || '',
    fiscalYear: (params.fiscalYear as string) || '',
    expenseCode: (params.expenseCode as string) || '',
    start: params.start as number,
    length: params.length as number,
    signal: params.signal,
  }).then((result) => ({
    items: result.expenses,
    total: result.filtered,
  }));
}

const fiscalYearNameCache = new Map<string | number, string>();
function getFiscalYearName(expense: Expense, options: FiscalYearSelectOption[]): string {
  if (expense.fiscal_year) return expense.fiscal_year;
  const raw = expense.fiscal_year_id;
  if (raw === undefined || raw === null) return '—';
  if (fiscalYearNameCache.has(raw)) return fiscalYearNameCache.get(raw)!;
  const match = options.find((opt) => opt.value === String(raw));
  const name = match?.label || String(raw);
  fiscalYearNameCache.set(raw, name);
  return name;
}

export default function ExpensePage() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<string | undefined>(undefined);
  const [fiscalYearOptions, setFiscalYearOptions] = useState<FiscalYearSelectOption[]>([]);
  const [fiscalYearLoading, setFiscalYearLoading] = useState(false);
  const selectedFiscalYear = fiscalYearOptions.find((opt) => opt.value === selectedFiscalYearId);
  const fiscalYearId = selectedFiscalYear?.value || '';
  const [expenseCodeInput, setExpenseCodeInput] = useState('');
  const [expenseCodeQuery, setExpenseCodeQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [showViewDrawer, setShowViewDrawer] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expenseCodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fiscalYearNameCache.clear();
  }, [fiscalYearOptions]);

  useEffect(() => {
    const controller = new AbortController();
    setFiscalYearLoading(true);
    fetchFiscalYearSelectList(controller.signal)
      .then((options) => setFiscalYearOptions(options))
      .finally(() => {
        if (!controller.signal.aborted) setFiscalYearLoading(false);
      });
    return () => controller.abort();
  }, []);

  const {
    data: expenses,
    total: totalFiltered,
    loading,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    refetch,
  } = usePaginatedList<Expense>({
    fetcher: (params) => fetchExpensesPage({ 
      ...params, 
      search: searchQuery,
      fiscalYear: fiscalYearId,
      expenseCode: expenseCodeQuery,
    }),
    initialPageSize: 20,
    extraDeps: [searchQuery, fiscalYearId, expenseCodeQuery],
    extraParams: {
      fiscalYear: fiscalYearId,
      expenseCode: expenseCodeQuery,
    },
  });

  const prevFiscalYearIdRef = useRef(fiscalYearId);
  useEffect(() => {
    if (prevFiscalYearIdRef.current !== fiscalYearId) {
      prevFiscalYearIdRef.current = fiscalYearId;
      refetch();
    }
  }, [fiscalYearId, refetch]);

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleSuccess = useCallback((savedExpense?: { id?: number; document_url?: string; isNew?: boolean }) => {
    if (savedExpense?.id && savedExpense?.document_url) {
      queryClient.setQueriesData({ queryKey: ['expenses'] }, (old: any) => {
        if (!old || !Array.isArray(old?.items)) return old;
        return {
          ...old,
          items: old.items.map((item: Expense) =>
            item.id === savedExpense.id ? { ...item, document_url: savedExpense.document_url } : item
          ),
        };
      });
    }
    queryClient.invalidateQueries({ queryKey: ['expenses'], exact: false });
    refetch();
  }, [queryClient, refetch]);

  const handleAddNew = () => {
    setEditingExpense(null);
    setShowFormModal(true);
  };

  const handleViewExpense = (expense: Expense) => {
    setViewingExpense(expense);
    setShowViewDrawer(true);
  };

  const handleDownloadExpense = (expense: Expense) => {
    if (expense.document_url) {
      const link = document.createElement('a');
      link.href = expense.document_url;
      link.target = '_blank';
      link.download = `${expense.title || 'expense'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      message.info('No document attached to this expense');
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowFormModal(true);
  };

  const handleDelete = async (expense: Expense) => {
    Modal.confirm({
      title: 'Delete Expense',
      content: `Are you sure you want to delete "${expense.title || 'this expense'}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await apiCall(`${API_BASE}/DeleteExpenseInfo?id=${expense.id}`, {
            method: 'GET',
          });

          if (!res.ok) throw new Error(`Failed: ${res.statusText}`);

          message.success('Expense deleted successfully');
          queryClient.invalidateQueries({ queryKey: ['expenses'] });
          refetch();
        } catch (err) {
          if (err instanceof Error) {
            message.error(err.message || 'Failed to delete expense');
          }
        }
      },
    });
  };

  return (
    <div className="fade-in text-slate-800">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Expenses</h1>
          <p className="mt-1 text-base text-slate-500">
            Transparent tracking of costs and financial accountability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="primary" onClick={handleAddNew} icon={<Plus className="h-4 w-4" />}>
            Add Expense
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

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 md:items-end">
        <div>
          <div className="mb-1 text-sm font-medium text-slate-500">Fiscal Year</div>
          <Select
            value={selectedFiscalYearId}
            onChange={(value) => {
              setSelectedFiscalYearId(value);
              setCurrentPage(1);
            }}
            options={fiscalYearOptions}
            loading={fiscalYearLoading}
            placeholder="Select fiscal year"
            allowClear
            className="w-full"
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-medium text-slate-500">Expense Code</div>
          <SearchInput
            value={expenseCodeInput}
            onChange={(value) => {
              setExpenseCodeInput(value);
              if (expenseCodeTimerRef.current) {
                clearTimeout(expenseCodeTimerRef.current);
              }
              expenseCodeTimerRef.current = setTimeout(() => {
                setExpenseCodeQuery(value);
                setCurrentPage(1);
              }, 400);
            }}
            placeholder="e.g. EXP-001"
            containerClassName="w-full"
          />
        </div>
        <div>
          <div className="mb-1 text-sm font-medium text-slate-500">Expense Title</div>
          <div className="flex gap-2 flex-wrap">
            <SearchInput
              value={searchInput}
              onChange={(value) => {
                setSearchInput(value);
                if (debounceTimerRef.current) {
                  clearTimeout(debounceTimerRef.current);
                }
                 debounceTimerRef.current = setTimeout(() => {
                   setSearchQuery(value);
                   setCurrentPage(1);
                 }, 400);
              }}
              placeholder="Search by expense title..."
              containerClassName="flex-1 w-full sm:w-[350px]"
            />
            <Button type="primary" onClick={handleSearch}>Search</Button>
          </div>
        </div>
        
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
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
                      <th className="bg-slate-50 px-4 py-3">Expense Code</th>
                      <th className="bg-slate-50 px-4 py-3">Fiscal Year</th>
                      <th className="bg-slate-50 px-4 py-3">Attachment</th>
                      <th className="rounded-r-xl bg-slate-50 px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr
                        key={expense.id}
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
                          <div className="font-semibold text-slate-900">{expense.title || 'Untitled'}</div>
                        </td>
                        <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600 font-medium">
                          {expense.code || '—'}
                        </td>
                        <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600 font-medium">
                          {getFiscalYearName(expense, fiscalYearOptions)}
                        </td>
                        <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600 font-medium">
                          {expense.document_url ? (
                            <a href={expense.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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
                              onClick={() => handleViewExpense(expense)}
                              icon={<Eye className="w-3.5 h-3.5" />}
                              disabled={!expense.document_url}
                            />
                            <Button
                              size="small"
                              onClick={() => handleDownloadExpense(expense)}
                              icon={<Download className="w-3.5 h-3.5" />}
                              disabled={!expense.document_url}
                            />
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => handleEdit(expense)}
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
                              onClick={() => handleDelete(expense)}
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
        ) : expenses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-base text-slate-400">No expenses found</p>
          </div>
        ) : viewMode === 'list' ? (
          <Card className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-1.5">
                <thead>
                  <tr className="text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                    <th className="rounded-l-xl bg-slate-50 px-5 py-3">Title</th>
                    <th className="bg-slate-50 px-4 py-3">Expense Code</th>
                    <th className="bg-slate-50 px-4 py-3">Fiscal Year</th>
                    <th className="bg-slate-50 px-4 py-3">Attachment</th>
                    <th className="rounded-r-xl bg-slate-50 px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr
                      key={expense.id}
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
                        <div className="font-semibold text-slate-900">{expense.title || 'Untitled'}</div>
                      </td>
                      <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600 font-medium">
                        {expense.code || '—'}
                      </td>
                      <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600 font-medium">
                        {getFiscalYearName(expense, fiscalYearOptions)}
                      </td>
                      <td className="bg-white px-4 py-3 border-b border-slate-100 text-slate-600 font-medium">
                        {expense.document_url ? (
                          <a href={expense.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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
                            onClick={() => handleViewExpense(expense)}
                            icon={<Eye className="w-3.5 h-3.5" />}
                            disabled={!expense.document_url}
                          />
                          <Button
                            size="small"
                            onClick={() => handleDownloadExpense(expense)}
                            icon={<Download className="w-3.5 h-3.5" />}
                            disabled={!expense.document_url}
                          />
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => handleEdit(expense)}
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
                            onClick={() => handleDelete(expense)}
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
            {expenses.map((expense) => (
              <Card
                key={expense.id}
                hover
                className="group overflow-hidden"
              >
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors break-words">
                    {expense.title || 'Untitled'}
                  </h3>
                </div>
                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="text-slate-400 shrink-0">Expense Code</span>
                    <span className="font-semibold text-slate-700 truncate">{expense.code || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm gap-2">
                    <span className="text-slate-400 shrink-0">Fiscal Year</span>
                    <span className="font-semibold text-slate-700 truncate">{getFiscalYearName(expense, fiscalYearOptions)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="primary"
                    size="sm"
                    onClick={() => handleViewExpense(expense)}
                    icon={<Eye className="h-4 w-4" />}
                    disabled={!expense.document_url}
                  >
                    View
                  </Button>
                  <Button
                    type="primary"
                    size="sm"
                    onClick={() => handleEdit(expense)}
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
                    onClick={() => handleDelete(expense)}
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 2v2" />
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

        {!loading && expenses.length > 0 && (
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

      <ViewExpenseDrawer
        open={showViewDrawer}
        onClose={() => { setShowViewDrawer(false); setViewingExpense(null); }}
        expense={viewingExpense}
        fiscalYearOptions={fiscalYearOptions}
      />

      <CreateExpenseDrawer
        open={showFormModal}
        onClose={() => { setShowFormModal(false); setEditingExpense(null); }}
        onSuccess={handleSuccess}
        editingExpense={editingExpense}
      />
    </div>
  );
}
