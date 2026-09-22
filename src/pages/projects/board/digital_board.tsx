'use client';

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  Mail,
  MapPin,
  Phone,
  UserRound,
  Building2,
  CircleCheck,
  BriefcaseBusiness,
} from 'lucide-react';
import { apiCall } from '@/services/api';
import type { ApiProject } from '@/data/projects-data';
import NepaliFunctions from '@sajanm/nepali-functions';
import nepallogo from '@/assets/images/nepal_logo.png';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

const projectTypeMap: Record<number, string> = {
  0: 'General',
  1: 'Development',
  2: 'Infrastructure',
  3: 'Design',
};

const NEPALI_MONTHS = [
  'बैशाख',
  'जेठ',
  'असार',
  'श्रावण',
  'भदौ',
  'आश्विन',
  'कार्तिक',
  'मंसिर',
  'पौष',
  'माघ',
  'फागुन',
  'चैत',
];

const toNepaliDate = (dateStr?: string) => {
  if (!dateStr || dateStr.startsWith('0001')) return '—';

  try {
    const parts = dateStr.replace(/-/g, '/').split('/');
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      const bs = NepaliFunctions.AD2BS({ year: y, month: m, day: d }) as { year: number; month: number; day: number };
      const monthName = NEPALI_MONTHS[bs.month - 1] || String(bs.month);
      return `${bs.year} ${monthName} ${bs.day}`;
    }
  } catch {
    return dateStr;
  }
};

function getDerivedStatus(api: ApiProject): string {
  const dueDate = api.ProjectOpenDate || '';
  const progress = getProgressFromDates(api.StartDate, dueDate);
  const finalProgress =
    progress > 0 || (api.StartDate && dueDate)
      ? progress
      : getProgress(api.WorkStatusName || '');

  if (finalProgress === 100) return 'Completed';
  if (finalProgress >= 81) return 'In Progress Final';
  if (finalProgress >= 11) return 'In Progress';
  if (finalProgress >= 1) return 'Started';

  return api.WorkStatusName || 'Not Started';
}

function getProgressFromDates(
  startDateStr: string,
  endDateStr: string
): number {
  if (!startDateStr || !endDateStr) return 0;

  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const now = new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

  if (now <= start) return 0;
  if (now >= end) return 100;

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();

  const progress = Math.round((elapsed / totalDuration) * 100);

  return Math.min(Math.max(progress, 0), 100);
}

function getProgress(status: string): number {
  if (status === 'Completed') return 100;
  if (status === 'In Progress' || status === 'In Progress Final') return 50;
  if (status === 'On Hold') return 20;

  return 0;
}

const DigitalBoardPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<ApiProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    setLoading(true);
    setError(null);

    apiCall(
      `${API_BASE}/GetProjectDetailData?id=${encodeURIComponent(id)}`,
      { method: 'GET' },
      10000
    )
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);

        const json = await res.json();

        const data = json?.Data ?? json?.data;
        const p = data?.ProjectInfo ?? data?.projectInfo;

        if (!p || !p.ProjectInfoID) {
          throw new Error('Project details not found');
        }

        const clientInfo =
          p?.ClientInfo ?? data?.ClientInfo ?? data?.clientInfo;

        if (!cancelled) {
          setProject({
            ...p,
            ClientInfo: clientInfo as ApiProject['ClientInfo'],
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load project'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eef3f9] text-slate-500">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-700 animate-spin" />
          <div className="text-sm font-semibold tracking-wide">
            Loading digital board...
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eef3f9] text-rose-600">
        <div className="rounded-xl border border-rose-200 bg-white px-6 py-5 shadow-lg">
          <div className="text-sm font-semibold">
            {error || 'Project not found'}
          </div>
        </div>
      </div>
    );
  }

  const projectTitle = project.ProjectName || 'Untitled Project';
  const projectType =
    project.ProjectTypeName ||
    projectTypeMap[project.ProjectType ?? 0] ||
    'General';

  const startDate = toNepaliDate(project.StartDate);

  const duration = project.ProjectDuration
    ? `${project.ProjectDuration} days`
    : '—';

  const status = getDerivedStatus(project);
  const clientInfo = project.ClientInfo;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#e9eef5] px-4 py-3 sm:px-6 lg:px-10">

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-blue-200/20 blur-3xl" />

        <div className="absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-slate-300/25 blur-3xl" />

        <div className="absolute bottom-[-220px] left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-[50%] bg-blue-100/30 blur-3xl" />
      </div>

      <button
        onClick={() => navigate('/projects')}
        className="
           fixed
           left-4
           top-3
           z-50
           inline-flex
           items-center
           gap-2
           rounded-lg
           border
           border-slate-200
           bg-white/95
           px-3
           py-1.5
           text-sm
           font-semibold
           text-slate-700
           shadow-md
           backdrop-blur-sm
           transition-all
           duration-200
           hover:border-blue-300
           hover:bg-blue-50
           hover:text-blue-800
           hover:shadow-lg
           md:left-[300px]
           md:top-6
           md:px-4
           md:py-2
        "
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </button>

      <div className="relative mx-auto mt-10 w-full max-w-[1180px] md:mt-12">

        {/* Physical shadow underneath */}
        <div
          className="
            absolute
            left-3
            right-3
            top-4
            bottom-[-10px]
            rounded-[18px]
            bg-slate-900/20
            blur-xl
          "
        />

        {/* Outer board */}
        <div
          className="
            relative
            rounded-[18px]
            bg-[#f8fafc]
            p-[5px]
            shadow-[0_25px_55px_rgba(15,23,42,0.22)]
          "
        >
          <div
            className="
              rounded-[14px]
              border-[3px]
              border-[#164e8f]
              bg-white
              p-[4px]
            "
          >

            <div
              className="
                relative
                overflow-hidden
                rounded-[9px]
                border
                border-[#5d88bd]
                bg-white
              "
            >

              {/* subtle paper background */}
              <div
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  opacity-[0.35]
                "
                style={{
                  backgroundImage: `
                    radial-gradient(
                      circle at 20% 20%,
                      rgba(30, 64, 175, 0.05) 0,
                      transparent 28%
                    ),
                    radial-gradient(
                      circle at 80% 10%,
                      rgba(30, 64, 175, 0.04) 0,
                      transparent 25%
                    ),
                    linear-gradient(
                      135deg,
                      rgba(241,245,249,0.6),
                      rgba(255,255,255,0.95)
                    )
                  `,
                }}
              />

              <div className="relative">

                <header className="border-b-2 border-[#164e8f] px-5 py-5 sm:px-8 lg:px-10">

                  <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-[150px_1fr_150px]">

                    {/* Left Government Logo */}
                    <div className="flex justify-center md:justify-start">
                      <div className="flex h-[72px] w-[72px] items-center justify-center sm:h-[78px] sm:w-[78px]">
                        <img
                          src={nepallogo}
                          alt="Nepal Government"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Center Government Information */}
                    <div className="text-center">

                      <div className="text-[19px] font-extrabold tracking-wide text-[#173f78] sm:text-[23px]">
                        नेपाल सरकार
                      </div>

                      <div className="mt-1 text-[15px] font-bold tracking-wide text-[#244d85] sm:text-[17px]">
                        परियोजना व्यवस्थापन प्रणाली
                      </div>

                      <div className="mx-auto mt-3 h-[2px] w-28 bg-[#164e8f]" />

                      <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 sm:text-[11px]">
                        Government Project Information Board
                      </div>

                    </div>

                    {/* Right Government Logo */}
                    <div className="flex justify-center md:justify-end">
                      <div className="flex h-[72px] w-[72px] items-center justify-center sm:h-[78px] sm:w-[78px]">
                        <img
                          src={nepallogo}
                          alt="Nepal Government"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    </div>

                  </div>

                </header>

                <section className="px-5 pb-3 pt-4 text-center sm:px-8 lg:px-10">

                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5">
                    <BriefcaseBusiness className="h-4 w-4 text-[#164e8f]" />

                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#164e8f] sm:text-xs">
                      Project Information Board
                    </span>
                  </div>

                  <h1
                    className="
                      mt-2
                      break-words
                      text-2xl
                      font-black
                      leading-tight
                      tracking-tight
                      text-[#123f7a]
                      sm:text-3xl
                      lg:text-[38px]
                    "
                  >
                    {projectTitle}
                  </h1>

                  <div className="mx-auto mt-2 h-[3px] w-24 rounded-full bg-[#164e8f]" />

                </section>

                <section className="px-5 pb-6 sm:px-8 lg:px-10">

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

                    <div className="overflow-hidden rounded-md border border-[#9eb8d6] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.06)]">

                      {/* Section Header */}
                      <div className="flex items-center gap-3 bg-[#174f91] px-4 py-3 text-white">

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                          <Building2 className="h-5 w-5" />
                        </div>

                        <div>
                          <h2 className="text-sm font-extrabold tracking-wide sm:text-base">
                            परियोजनाको विवरण
                          </h2>

                          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-blue-100">
                            Project Details
                          </p>
                        </div>

                      </div>

                      {/* Project Rows */}
                      <div className="divide-y divide-slate-200">

                        {/* Project Type */}
                        <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 px-4 py-2.5 sm:px-5">

                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-[#164e8f]">
                            <Building2 className="h-[18px] w-[18px]" />
                          </div>

                          <div>
                            <div className="text-sm font-bold text-[#183b6b]">
                              प्रोजेक्टको प्रकार
                            </div>

                            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                              Project Type
                            </div>
                          </div>

                          <div className="max-w-[180px] text-right text-sm font-bold text-slate-800">
                            {projectType}
                          </div>

                        </div>

                        {/* Start Date */}
                        <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 px-4 py-2.5 sm:px-5">

                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-[#164e8f]">
                            <CalendarDays className="h-[18px] w-[18px]" />
                          </div>

                          <div>
                            <div className="text-sm font-bold text-[#183b6b]">
                              सुरु मिति
                            </div>

                            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                              Start Date
                            </div>
                          </div>

                          <div className="max-w-[180px] text-right text-sm font-bold text-slate-800">
                            {startDate}
                          </div>

                        </div>

                        {/* Duration */}
                        <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 px-4 py-2.5 sm:px-5">

                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-[#164e8f]">
                            <Clock3 className="h-[18px] w-[18px]" />
                          </div>

                          <div>
                            <div className="text-sm font-bold text-[#183b6b]">
                              अवधि
                            </div>

                            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                              Duration
                            </div>
                          </div>

                          <div className="max-w-[180px] text-right text-sm font-bold text-slate-800">
                            {duration}
                          </div>

                        </div>

                        {/* Status */}
                        <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 px-4 py-2.5 sm:px-5">

                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                            <CircleCheck className="h-[18px] w-[18px]" />
                          </div>

                          <div>
                            <div className="text-sm font-bold text-[#183b6b]">
                              स्थिति
                            </div>

                            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                              Work Status
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700">

                              <span className="h-2 w-2 rounded-full bg-emerald-600" />

                              {status}

                            </span>
                          </div>

                        </div>

                      </div>

                    </div>

                    <div className="overflow-hidden rounded-md border border-[#9eb8d6] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.06)]">

                      {/* Section Header */}
                      <div className="flex items-center gap-3 bg-[#174f91] px-4 py-3 text-white">

                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                          <UserRound className="h-5 w-5" />
                        </div>

                        <div>
                          <h2 className="text-sm font-extrabold tracking-wide sm:text-base">
                            ग्राहक विवरण
                          </h2>

                          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-blue-100">
                            Client Information
                          </p>
                        </div>

                      </div>

                      {/* Client Rows */}
                      <div className="divide-y divide-slate-200">

                        {/* Client Name */}
                        <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 px-4 py-2 sm:px-5">

                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-[#164e8f]">
                            <UserRound className="h-[18px] w-[18px]" />
                          </div>

                          <div>
                            <div className="text-sm font-bold text-[#183b6b]">
                              ग्राहकको नाम
                            </div>

                            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                              Client Name
                            </div>
                          </div>

                          <div className="max-w-[200px] break-words text-right text-sm font-bold text-slate-800">
                            {clientInfo?.ClientName ||
                              project.ClientName ||
                              project.ClientInfoName ||
                              '—'}
                          </div>

                        </div>

                        {/* Contact Person */}
                        <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 px-4 py-2 sm:px-5">

                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-[#164e8f]">
                            <UserRound className="h-[18px] w-[18px]" />
                          </div>

                          <div>
                            <div className="text-sm font-bold text-[#183b6b]">
                              सम्पर्क व्यक्ति
                            </div>

                            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                              Contact Person
                            </div>
                          </div>

                          <div className="max-w-[200px] break-words text-right text-sm font-bold text-slate-800">
                            {clientInfo?.ContactPerson || '—'}
                          </div>

                        </div>

                        {/* Contact Number */}
                        <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 px-4 py-2 sm:px-5">

                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-[#164e8f]">
                            <Phone className="h-[18px] w-[18px]" />
                          </div>

                          <div>
                            <div className="text-sm font-bold text-[#183b6b]">
                              सम्पर्क नम्बर
                            </div>

                            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                              Contact No.
                            </div>
                          </div>

                          <div className="max-w-[200px] break-words text-right text-sm font-bold text-slate-800">
                            {clientInfo?.ContactNo || '—'}
                          </div>

                        </div>

                        {/* Email */}
                        <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 px-4 py-2 sm:px-5">

                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-[#164e8f]">
                            <Mail className="h-[18px] w-[18px]" />
                          </div>

                          <div>
                            <div className="text-sm font-bold text-[#183b6b]">
                              इमेल
                            </div>

                            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                              Email
                            </div>
                          </div>

                          <div className="max-w-[200px] break-all text-right text-sm font-bold text-slate-800">
                            {clientInfo?.Email || '—'}
                          </div>

                        </div>

                        {/* Address */}
                        <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 px-4 py-2 sm:px-5">

                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-[#164e8f]">
                            <MapPin className="h-[18px] w-[18px]" />
                          </div>

                          <div>
                            <div className="text-sm font-bold text-[#183b6b]">
                              ठेगाना
                            </div>

                            <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                              Address
                            </div>
                          </div>

                          <div className="max-w-[200px] break-words text-right text-sm font-bold text-slate-800">
                            {clientInfo?.Address || '—'}
                          </div>

                        </div>

                      </div>

                    </div>

                  </div>

                </section>

                <section className="px-5 pb-6 sm:px-8 lg:px-10">

                  <div className="overflow-hidden rounded-md border border-[#9eb8d6] bg-white shadow-[0_4px_14px_rgba(15,23,42,0.06)]">

                    <div className="flex items-center gap-3 bg-[#174f91] px-4 py-3 text-white">

                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div>
                        <h2 className="text-sm font-extrabold tracking-wide sm:text-base">
                          परियोजना विवरण
                        </h2>

                        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-blue-100">
                          Project Description
                        </p>
                      </div>

                    </div>

                    <div className="min-h-[80px] px-5 py-3 sm:px-7">

                      <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 sm:text-[15px]">
                        {project.Description || 'No description provided.'}
                      </p>

                    </div>

                  </div>

                </section>


                <footer className="border-t-2 border-[#164e8f] bg-[#174f91] px-5 py-4 text-white sm:px-8 lg:px-10">

                  <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">

                    <div>
                      <div className="text-xs font-bold tracking-wide">
                        परियोजना सूचना बोर्ड
                      </div>

                      <div className="mt-0.5 text-[10px] font-medium text-blue-100">
                        Project Information Board
                      </div>
                    </div>

                    <div className="text-[10px] font-medium text-blue-100">
                      Government Project Management System
                    </div>

                  </div>

                </footer>

              </div>
            </div>
          </div>
        </div>


        <div className="pointer-events-none absolute -bottom-7 left-[10%] hidden h-9 w-3 rounded-b-md bg-slate-700 shadow-lg sm:block" />

        <div className="pointer-events-none absolute -bottom-7 right-[10%] hidden h-9 w-3 rounded-b-md bg-slate-700 shadow-lg sm:block" />

      </div>
    </div>
  );
};

export default DigitalBoardPage;