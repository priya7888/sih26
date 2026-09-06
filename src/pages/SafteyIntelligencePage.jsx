import React, { useMemo, useState } from "react";

const reports = [
    {
        id: "SR-1048",
        title: "Unprotected work at height",
        location: "Unit 4 - Boiler Area",
        type: "Unsafe Condition",
        risk: "Critical",
        score: 94,
        status: "Open",
        date: "Today, 09:42",
        precursor: "Fall from height",
        description:
            "Worker observed performing maintenance near an elevated platform without adequate fall protection.",
    },
    {
        id: "SR-1047",
        title: "Forklift pedestrian conflict",
        location: "Warehouse B",
        type: "Near Miss",
        risk: "High",
        score: 82,
        status: "Under Review",
        date: "Today, 08:15",
        precursor: "Vehicle interaction",
        description:
            "Forklift entered pedestrian pathway while a worker was crossing the marked zone.",
    },
    {
        id: "SR-1046",
        title: "Damaged electrical cable",
        location: "Production Line 2",
        type: "Unsafe Condition",
        risk: "High",
        score: 76,
        status: "Open",
        date: "Yesterday, 16:30",
        precursor: "Electrical exposure",
        description:
            "Visible insulation damage detected on a temporary electrical supply cable.",
    },
    {
        id: "SR-1045",
        title: "Chemical splash during transfer",
        location: "Chemical Storage",
        type: "Near Miss",
        risk: "Critical",
        score: 91,
        status: "Open",
        date: "Yesterday, 14:12",
        precursor: "Hazardous substance",
        description:
            "Chemical splash occurred during manual transfer. Eye protection was not correctly worn.",
    },
    {
        id: "SR-1044",
        title: "Blocked emergency exit",
        location: "Admin Building",
        type: "Unsafe Condition",
        risk: "Medium",
        score: 58,
        status: "Resolved",
        date: "Yesterday, 11:06",
        precursor: "Emergency response",
        description:
            "Emergency exit partially obstructed by stored materials.",
    },
    {
        id: "SR-1043",
        title: "Improper lockout procedure",
        location: "Maintenance Workshop",
        type: "Unsafe Act",
        risk: "Critical",
        score: 96,
        status: "Under Review",
        date: "Sep 4, 15:40",
        precursor: "Energy isolation",
        description:
            "Maintenance activity started before complete verification of energy isolation.",
    },
    {
        id: "SR-1042",
        title: "Missing machine guard",
        location: "Production Line 1",
        type: "Unsafe Condition",
        risk: "High",
        score: 79,
        status: "Open",
        date: "Sep 4, 12:20",
        precursor: "Machine guarding",
        description:
            "Rotating equipment was operating with a protective guard removed.",
    },
    {
        id: "SR-1041",
        title: "Slip near loading bay",
        location: "Loading Bay",
        type: "Near Miss",
        risk: "Medium",
        score: 61,
        status: "Resolved",
        date: "Sep 3, 17:05",
        precursor: "Slip / trip",
        description:
            "Worker slipped on a wet surface but avoided injury.",
    },
];

const initialAlerts = [
    {
        id: 1,
        level: "Critical",
        title: "Potential SIF precursor detected",
        text: "Improper lockout procedure requires immediate review.",
        time: "8 min ago",
    },
    {
        id: 2,
        level: "High",
        title: "Fall protection gap",
        text: "Work-at-height observation has remained open.",
        time: "21 min ago",
    },
    {
        id: 3,
        level: "High",
        title: "Vehicle interaction trend",
        text: "Pedestrian-vehicle conflicts increased this week.",
        time: "1 hr ago",
    },
];

const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "▦" },
    { id: "analysis", label: "AI Analysis", icon: "✦" },
    { id: "bulk", label: "Bulk Upload", icon: "⇧" },
    { id: "reports", label: "All Reports", icon: "☷" },
    { id: "signals", label: "Week Signals", icon: "⌁" },
    { id: "strong", label: "Strong Report", icon: "▤" },
];

function RiskBadge({ risk }) {
    const styles = {
        Critical: "bg-red-500/15 text-red-300 border-red-500/30",
        High: "bg-orange-500/15 text-orange-300 border-orange-500/30",
        Medium: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
        Low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[risk] || styles.Medium
                }`}
        >
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
            {risk}
        </span>
    );
}

function KpiCard({ title, value, change, icon, danger }) {
    return (
        <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-xl shadow-black/10 transition hover:-translate-y-1 hover:border-white/20">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-slate-400">{title}</p>
                    <h3 className="mt-2 text-3xl font-bold tracking-tight text-white">
                        {value}
                    </h3>
                </div>

                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border ${danger
                            ? "border-red-500/30 bg-red-500/10 text-red-300"
                            : "border-amber-400/20 bg-amber-400/10 text-amber-300"
                        } text-lg`}
                >
                    {icon}
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs">
                <span
                    className={
                        change?.startsWith("-") ? "text-emerald-400" : "text-amber-300"
                    }
                >
                    {change}
                </span>
                <span className="text-slate-500">vs previous week</span>
            </div>
        </div>
    );
}

function DonutChart() {
    return (
        <div className="relative mx-auto flex h-56 w-56 items-center justify-center">
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background:
                        "conic-gradient(#ef4444 0deg 72deg, #f97316 72deg 180deg, #facc15 180deg 266deg, #22c55e 266deg 360deg)",
                }}
            />

            <div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-[#10151d]">
                <span className="text-3xl font-bold text-white">128</span>
                <span className="text-xs text-slate-500">Total Reports</span>
            </div>
        </div>
    );
}

function TrendChart() {
    const points = "0,116 50,102 100,110 150,75 200,91 250,60 300,69 350,39 400,51 450,27 500,42";

    return (
        <div className="relative h-64 w-full overflow-hidden rounded-xl bg-black/10">
            <div className="absolute inset-0 flex flex-col justify-between py-5">
                {[0, 1, 2, 3, 4].map((item) => (
                    <div key={item} className="border-t border-white/[0.06]" />
                ))}
            </div>

            <svg
                viewBox="0 0 500 150"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
            >
                <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                    </linearGradient>
                </defs>

                <polygon
                    points={`0,150 ${points} 500,150`}
                    fill="url(#trendFill)"
                />

                <polyline
                    points={points}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {[
                    [0, 116],
                    [100, 110],
                    [200, 91],
                    [300, 69],
                    [400, 51],
                    [500, 42],
                ].map(([x, y]) => (
                    <circle
                        key={`${x}-${y}`}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#111827"
                        stroke="#f59e0b"
                        strokeWidth="2"
                    />
                ))}
            </svg>

            <div className="absolute bottom-2 left-0 right-0 flex justify-between px-3 text-[10px] text-slate-500">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
            </div>
        </div>
    );
}

function RiskMeter({ score }) {
    const rotation = -90 + (score / 100) * 180;

    return (
        <div className="relative mx-auto h-36 w-72 overflow-hidden">
            <div
                className="absolute bottom-0 left-1/2 h-36 w-72 -translate-x-1/2 rounded-t-full"
                style={{
                    background:
                        "conic-gradient(from 270deg at 50% 100%, #22c55e 0deg 55deg, #facc15 55deg 115deg, #f97316 115deg 145deg, #ef4444 145deg 180deg, transparent 180deg)",
                }}
            />

            <div className="absolute bottom-0 left-1/2 h-24 w-48 -translate-x-1/2 rounded-t-full bg-[#10151d]" />

            <div
                className="absolute bottom-2 left-1/2 h-1 w-28 origin-left rounded-full bg-white transition-transform duration-700"
                style={{ transform: `rotate(${rotation}deg)` }}
            />

            <div className="absolute bottom-0 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-white" />

            <div className="absolute bottom-2 left-0 text-xs text-emerald-400">
                Low
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-yellow-400">
                Moderate
            </div>
            <div className="absolute bottom-2 right-0 text-xs text-red-400">
                Critical
            </div>
        </div>
    );
}

function Sidebar({ activePage, setActivePage }) {
    return (
        <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 border-r border-white/10 bg-[#080c12] lg:block">
            <div className="flex h-full flex-col">
                <div className="border-b border-white/10 px-6 py-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-lg font-black text-slate-950">
                            S
                        </div>

                        <div>
                            <h1 className="font-bold text-white">Safety Intelligence</h1>
                            <p className="text-[11px] text-slate-500">AI Safety Platform</p>
                        </div>
                    </div>
                </div>

                <div className="px-3 py-5">
                    <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                        Intelligence
                    </p>

                    <div className="space-y-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActivePage(item.id)}
                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${activePage === item.id
                                        ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/10"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                <span className="flex w-5 justify-center text-base">
                                    {item.icon}
                                </span>
                                <span className="font-medium">{item.label}</span>

                                {item.id === "analysis" && (
                                    <span className="ml-auto rounded-full bg-slate-950/20 px-2 py-0.5 text-[9px] font-bold">
                                        AI
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto border-t border-white/10 p-4">
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs text-slate-500">Organization</p>
                        <p className="mt-1 font-semibold text-white">Industrial Site A</p>

                        <div className="mt-3 flex items-center gap-2">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                            <span className="text-xs text-emerald-400">System Online</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}

function MobileNav({ activePage, setActivePage }) {
    return (
        <div className="fixed bottom-3 left-3 right-3 z-50 flex overflow-x-auto rounded-2xl border border-white/10 bg-[#10151d]/95 p-2 shadow-2xl backdrop-blur-xl lg:hidden">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className={`min-w-[80px] rounded-xl px-2 py-2 text-[10px] transition ${activePage === item.id
                            ? "bg-amber-400 font-bold text-slate-950"
                            : "text-slate-400"
                        }`}
                >
                    <div className="text-base">{item.icon}</div>
                    <div className="mt-1">{item.label}</div>
                </button>
            ))}
        </div>
    );
}

function Topbar({ title, unread, setUnread }) {
    return (
        <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080c12]/90 backdrop-blur-xl">
            <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
                        Safety Operations Center
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                        {title}
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setUnread(0)}
                        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 transition hover:bg-white/10"
                    >
                        ♧
                        {unread > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                                {unread}
                            </span>
                        )}
                    </button>

                    <div className="hidden items-center gap-3 border-l border-white/10 pl-4 sm:flex">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 font-bold text-slate-950">
                            YO
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-white">Safety Officer</p>
                            <p className="text-[10px] text-slate-500">Administrator</p>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

function Dashboard({ setActivePage, selectedReport, setSelectedReport }) {
    return (
        <div className="space-y-6">
            {/* KPI ROW */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    title="Total Reports"
                    value="128"
                    change="+12.4%"
                    icon="▤"
                />
                <KpiCard
                    title="SIF Potential"
                    value="18"
                    change="+4.2%"
                    icon="⚠"
                    danger
                />
                <KpiCard
                    title="Near Misses"
                    value="42"
                    change="+8.7%"
                    icon="◉"
                />
                <KpiCard
                    title="Open Corrective Actions"
                    value="27"
                    change="-6.3%"
                    icon="✓"
                />
            </div>

            {/* SECOND ROW */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 xl:col-span-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-white">Risk Distribution</h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Current reporting period
                            </p>
                        </div>

                        <span className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-slate-500">
                            30 DAYS
                        </span>
                    </div>

                    <DonutChart />

                    <div className="mt-3 grid grid-cols-2 gap-3">
                        {[
                            ["Critical", "12%", "bg-red-400"],
                            ["High", "30%", "bg-orange-400"],
                            ["Medium", "24%", "bg-yellow-400"],
                            ["Low", "34%", "bg-emerald-400"],
                        ].map(([label, value, color]) => (
                            <div key={label} className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${color}`} />
                                <span className="text-xs text-slate-400">{label}</span>
                                <span className="ml-auto text-xs font-bold text-white">
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 xl:col-span-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h3 className="font-bold text-white">
                                SIF Precursor Trend
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Significant injury/fatality precursor activity
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-white">
                                7 Days
                            </button>
                            <button className="rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-white/5">
                                30 Days
                            </button>
                        </div>
                    </div>

                    <div className="mt-5">
                        <TrendChart />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-red-500/5 p-3">
                            <p className="text-[10px] text-slate-500">Peak Risk</p>
                            <p className="mt-1 text-lg font-bold text-red-300">96</p>
                        </div>
                        <div className="rounded-xl bg-orange-500/5 p-3">
                            <p className="text-[10px] text-slate-500">Avg Risk</p>
                            <p className="mt-1 text-lg font-bold text-orange-300">71</p>
                        </div>
                        <div className="rounded-xl bg-emerald-500/5 p-3">
                            <p className="text-[10px] text-slate-500">Resolved</p>
                            <p className="mt-1 text-lg font-bold text-emerald-300">82%</p>
                        </div>
                    </div>
                </section>
            </div>

            {/* THIRD ROW */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 xl:col-span-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-white">Recent Safety Reports</h3>
                            <p className="mt-1 text-xs text-slate-500">
                                Latest observations requiring intelligence review
                            </p>
                        </div>

                        <button
                            onClick={() => setActivePage("reports")}
                            className="text-xs font-semibold text-amber-400 hover:text-amber-300"
                        >
                            View all →
                        </button>
                    </div>

                    <div className="mt-5 overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left">
                            <thead>
                                <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-600">
                                    <th className="pb-3">Report</th>
                                    <th className="pb-3">Location</th>
                                    <th className="pb-3">Risk</th>
                                    <th className="pb-3">Score</th>
                                    <th className="pb-3">Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {reports.slice(0, 5).map((report) => (
                                    <tr
                                        key={report.id}
                                        onClick={() => setSelectedReport(report)}
                                        className="cursor-pointer border-b border-white/[0.06] transition hover:bg-white/[0.03]"
                                    >
                                        <td className="py-4">
                                            <div>
                                                <p className="text-sm font-semibold text-white">
                                                    {report.title}
                                                </p>
                                                <p className="mt-1 text-[10px] text-slate-600">
                                                    {report.id} · {report.date}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="text-xs text-slate-400">
                                            {report.location}
                                        </td>
                                        <td>
                                            <RiskBadge risk={report.risk} />
                                        </td>
                                        <td className="text-sm font-bold text-white">
                                            {report.score}
                                        </td>
                                        <td className="text-xs text-slate-400">
                                            {report.status}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="rounded-2xl border border-red-500/20 bg-red-500/[0.035] p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
                            ⚠
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Critical Alert Center</h3>
                            <p className="text-xs text-slate-500">Immediate attention</p>
                        </div>
                    </div>

                    <div className="mt-5 space-y-3">
                        {initialAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className="rounded-xl border border-white/10 bg-black/10 p-4"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <RiskBadge risk={alert.level} />
                                    <span className="text-[10px] text-slate-600">
                                        {alert.time}
                                    </span>
                                </div>

                                <p className="mt-3 text-sm font-semibold text-white">
                                    {alert.title}
                                </p>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    {alert.text}
                                </p>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => setActivePage("analysis")}
                        className="mt-4 w-full rounded-xl border border-red-500/20 py-3 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
                    >
                        Investigate critical risks
                    </button>
                </section>
            </div>

            {selectedReport && (
                <ReportModal
                    report={selectedReport}
                    onClose={() => setSelectedReport(null)}
                />
            )}
        </div>
    );
}

function ReportModal({ report, onClose }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#10151d] shadow-2xl">
                <div className="flex items-start justify-between border-b border-white/10 p-6">
                    <div>
                        <p className="text-xs text-amber-400">{report.id}</p>
                        <h3 className="mt-2 text-2xl font-bold text-white">
                            {report.title}
                        </h3>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-xl bg-white/5 px-3 py-2 text-slate-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-5 p-6">
                    <div className="flex flex-wrap gap-2">
                        <RiskBadge risk={report.risk} />
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                            {report.type}
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
                            {report.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl bg-white/[0.03] p-4">
                            <p className="text-[10px] text-slate-600">Location</p>
                            <p className="mt-1 text-sm font-semibold text-white">
                                {report.location}
                            </p>
                        </div>

                        <div className="rounded-xl bg-white/[0.03] p-4">
                            <p className="text-[10px] text-slate-600">Risk Score</p>
                            <p className="mt-1 text-xl font-bold text-red-300">
                                {report.score}/100
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            AI Summary
                        </p>
                        <p className="mt-3 text-sm leading-7 text-slate-300">
                            {report.description}
                        </p>
                    </div>

                    <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                        <p className="text-xs font-semibold text-amber-300">
                            Detected Precursor
                        </p>
                        <p className="mt-2 text-sm text-white">{report.precursor}</p>
                    </div>

                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Recommended Corrective Action
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-slate-300">
                            <li>• Immediately control the identified exposure.</li>
                            <li>• Verify the relevant life-saving rule.</li>
                            <li>• Assign corrective action to the responsible supervisor.</li>
                            <li>• Conduct a follow-up verification before closure.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AiAnalysis() {
    const [text, setText] = useState("");
    const [imageName, setImageName] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);

    const analyze = () => {
        if (!text.trim() && !imageName) return;

        setAnalyzing(true);
        setResult(null);

        setTimeout(() => {
            setAnalyzing(false);

            setResult({
                classification: "SIF Potential",
                confidence: 94,
                risk: 91,
                precursor: "Fall from height",
                severity: "Critical",
                entities: [
                    "Worker",
                    "Elevated platform",
                    "Missing fall protection",
                    "Maintenance activity",
                ],
                rules: [
                    "Working at Height",
                    "Line of Fire",
                    "Personal Protective Equipment",
                ],
                explanation:
                    "The observation contains a high-energy exposure involving work at height without adequate fall protection. The combination of elevation, exposure duration and missing controls indicates significant potential for serious injury or fatality.",
                actions: [
                    "Stop the activity until fall protection is verified.",
                    "Inspect and secure the work-at-height access system.",
                    "Confirm appropriate PPE and fall-arrest equipment.",
                    "Conduct supervisor verification before restart.",
                ],
            });
        }, 1800);
    };

    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
            <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 xl:col-span-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
                        AI Safety Engine
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-white">
                        Analyze Safety Observation
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                        Submit an observation and the AI engine will identify SIF
                        potential, precursors, entities and corrective actions.
                    </p>
                </div>

                <div className="mt-6">
                    <label className="text-xs font-semibold text-slate-400">
                        Safety Observation
                    </label>

                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Example: Worker was performing maintenance at height without connecting the fall arrest harness..."
                        className="mt-2 h-44 w-full resize-none rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white outline-none transition placeholder:text-slate-700 focus:border-amber-400/50"
                    />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="cursor-pointer rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-center transition hover:border-amber-400/40 hover:bg-amber-400/5">
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) =>
                                setImageName(e.target.files?.[0]?.name || "")
                            }
                        />

                        <div className="text-2xl text-amber-300">◫</div>
                        <p className="mt-2 text-sm font-semibold text-white">
                            Upload Image
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                            {imageName || "JPG, PNG supported"}
                        </p>
                    </label>

                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                        <p className="text-xs font-semibold text-slate-400">
                            Analysis capabilities
                        </p>

                        <div className="mt-3 space-y-2 text-xs text-slate-500">
                            <p>✓ SIF potential classification</p>
                            <p>✓ Risk scoring</p>
                            <p>✓ Entity extraction</p>
                            <p>✓ Life-saving rule mapping</p>
                            <p>✓ Corrective action generation</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={analyze}
                    disabled={analyzing || (!text.trim() && !imageName)}
                    className="mt-5 w-full rounded-xl bg-amber-400 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {analyzing ? "AI ENGINE ANALYZING..." : "Run AI Safety Analysis →"}
                </button>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 xl:col-span-2">
                {!result && !analyzing && (
                    <div className="flex h-full min-h-[480px] flex-col items-center justify-center text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-400/20 bg-amber-400/10 text-3xl text-amber-300">
                            ✦
                        </div>
                        <h3 className="mt-5 font-bold text-white">
                            AI Analysis Results
                        </h3>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
                            Submit a safety observation to generate explainable AI results.
                        </p>
                    </div>
                )}

                {analyzing && (
                    <div className="flex h-full min-h-[480px] flex-col items-center justify-center text-center">
                        <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-amber-400" />
                        <h3 className="mt-6 font-bold text-white">
                            Processing Observation
                        </h3>
                        <div className="mt-4 space-y-2 text-xs text-slate-500">
                            <p>✓ Extracting safety entities</p>
                            <p>✓ Detecting precursor patterns</p>
                            <p>• Calculating SIF probability...</p>
                            <p>• Generating corrective actions...</p>
                        </div>
                    </div>
                )}

                {result && (
                    <div className="space-y-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                                    AI Classification
                                </p>
                                <h3 className="mt-2 text-2xl font-bold text-red-300">
                                    {result.classification}
                                </h3>
                            </div>
                            <RiskBadge risk={result.severity} />
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Confidence</span>
                                <span className="font-bold text-white">
                                    {result.confidence}%
                                </span>
                            </div>

                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                                <div
                                    className="h-full rounded-full bg-amber-400"
                                    style={{ width: `${result.confidence}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                Risk Score
                            </p>
                            <RiskMeter score={result.risk} />
                            <p className="text-center text-3xl font-bold text-red-300">
                                {result.risk}/100
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl bg-white/[0.03] p-3">
                                <p className="text-[10px] text-slate-600">Precursor</p>
                                <p className="mt-1 text-xs font-semibold text-white">
                                    {result.precursor}
                                </p>
                            </div>

                            <div className="rounded-xl bg-white/[0.03] p-3">
                                <p className="text-[10px] text-slate-600">SIF Confidence</p>
                                <p className="mt-1 text-xs font-semibold text-white">
                                    {result.confidence}%
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-slate-400">
                                Detected Entities
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {result.entities.map((entity) => (
                                    <span
                                        key={entity}
                                        className="rounded-lg border border-sky-400/20 bg-sky-400/5 px-2.5 py-1.5 text-[10px] text-sky-300"
                                    >
                                        {entity}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-slate-400">
                                Life-Saving Rules
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {result.rules.map((rule) => (
                                    <span
                                        key={rule}
                                        className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-2.5 py-1.5 text-[10px] text-amber-300"
                                    >
                                        {rule}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                            <p className="text-xs font-bold text-white">
                                Explainable AI
                            </p>
                            <p className="mt-2 text-xs leading-6 text-slate-500">
                                {result.explanation}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-slate-400">
                                AI Recommended Actions
                            </p>

                            <div className="mt-2 space-y-2">
                                {result.actions.map((action, index) => (
                                    <div
                                        key={action}
                                        className="flex gap-3 rounded-xl bg-white/[0.03] p-3"
                                    >
                                        <span className="text-xs font-bold text-amber-400">
                                            0{index + 1}
                                        </span>
                                        <p className="text-xs leading-5 text-slate-400">
                                            {action}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

function BulkUpload() {
    const [files, setFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [complete, setComplete] = useState(false);

    const handleFiles = (event) => {
        const selected = Array.from(event.target.files || []);
        setFiles(selected);
        setComplete(false);
    };

    const processFiles = () => {
        if (!files.length) return;

        setProcessing(true);

        setTimeout(() => {
            setProcessing(false);
            setComplete(true);
        }, 2200);
    };

    return (
        <div className="mx-auto max-w-5xl">
            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
                <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 text-3xl text-amber-300">
                        ⇧
                    </div>

                    <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                        Batch Intelligence
                    </p>

                    <h3 className="mt-2 text-3xl font-bold text-white">
                        Bulk Upload Safety Reports
                    </h3>

                    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
                        Upload multiple reports for automated preprocessing,
                        classification and risk scoring.
                    </p>
                </div>

                <label className="mt-8 block cursor-pointer rounded-3xl border-2 border-dashed border-white/10 bg-black/10 p-12 text-center transition hover:border-amber-400/40 hover:bg-amber-400/[0.02]">
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        accept=".csv,.xlsx,.xls,.pdf,.txt,.doc,.docx"
                        onChange={handleFiles}
                    />

                    <div className="text-4xl text-slate-500">＋</div>
                    <p className="mt-4 font-semibold text-white">
                        Drop your safety reports here
                    </p>
                    <p className="mt-2 text-xs text-slate-600">
                        CSV, Excel, PDF, DOCX or TXT
                    </p>

                    <span className="mt-5 inline-block rounded-xl border border-white/10 px-5 py-2.5 text-xs font-semibold text-slate-300">
                        Browse Files
                    </span>
                </label>

                {files.length > 0 && (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-5">
                        <p className="text-xs font-bold text-slate-400">
                            Selected Files ({files.length})
                        </p>

                        <div className="mt-3 space-y-2">
                            {files.map((file) => (
                                <div
                                    key={`${file.name}-${file.size}`}
                                    className="flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3"
                                >
                                    <span className="truncate text-xs text-white">
                                        {file.name}
                                    </span>
                                    <span className="ml-3 text-[10px] text-slate-600">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={processFiles}
                            disabled={processing}
                            className="mt-5 w-full rounded-xl bg-amber-400 py-3 font-bold text-slate-950 disabled:opacity-50"
                        >
                            {processing
                                ? "PROCESSING REPORTS..."
                                : "Process All Reports →"}
                        </button>
                    </div>
                )}

                {processing && (
                    <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
                        <div className="flex justify-between text-xs">
                            <span className="text-amber-300">
                                AI preprocessing in progress
                            </span>
                            <span className="text-white">72%</span>
                        </div>

                        <div className="mt-3 h-2 rounded-full bg-black/20">
                            <div className="h-full w-[72%] animate-pulse rounded-full bg-amber-400" />
                        </div>
                    </div>
                )}

                {complete && (
                    <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
                        <p className="font-semibold text-emerald-300">
                            ✓ Upload processing complete
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            {files.length} reports were processed and queued for AI
                            safety analysis.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}

function AllReports({ setSelectedReport }) {
    const [search, setSearch] = useState("");
    const [riskFilter, setRiskFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");

    const filteredReports = useMemo(() => {
        return reports.filter((report) => {
            const matchesSearch =
                report.title.toLowerCase().includes(search.toLowerCase()) ||
                report.location.toLowerCase().includes(search.toLowerCase()) ||
                report.id.toLowerCase().includes(search.toLowerCase());

            const matchesRisk =
                riskFilter === "All" || report.risk === riskFilter;

            const matchesType =
                typeFilter === "All" || report.type === typeFilter;

            return matchesSearch && matchesRisk && matchesType;
        });
    }, [search, riskFilter, typeFilter]);

    return (
        <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
                        Safety Repository
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-white">
                        All Reports
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                        Search, filter and inspect every submitted observation.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search reports..."
                        className="rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-xs text-white outline-none placeholder:text-slate-700 focus:border-amber-400/40"
                    />

                    <select
                        value={riskFilter}
                        onChange={(e) => setRiskFilter(e.target.value)}
                        className="rounded-xl border border-white/10 bg-[#10151d] px-3 py-2.5 text-xs text-slate-300 outline-none"
                    >
                        <option>All</option>
                        <option>Critical</option>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                    </select>

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="rounded-xl border border-white/10 bg-[#10151d] px-3 py-2.5 text-xs text-slate-300 outline-none"
                    >
                        <option>All</option>
                        <option>Near Miss</option>
                        <option>Unsafe Act</option>
                        <option>Unsafe Condition</option>
                    </select>
                </div>
            </div>

            <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                    <thead>
                        <tr className="border-b border-white/10 text-[10px] uppercase tracking-wider text-slate-600">
                            <th className="pb-3">Report</th>
                            <th className="pb-3">Location</th>
                            <th className="pb-3">Type</th>
                            <th className="pb-3">Risk</th>
                            <th className="pb-3">Score</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3">Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredReports.map((report) => (
                            <tr
                                key={report.id}
                                className="border-b border-white/[0.06] hover:bg-white/[0.025]"
                            >
                                <td className="py-4">
                                    <p className="text-sm font-semibold text-white">
                                        {report.title}
                                    </p>
                                    <p className="mt-1 text-[10px] text-slate-600">
                                        {report.id} · {report.date}
                                    </p>
                                </td>

                                <td className="text-xs text-slate-400">
                                    {report.location}
                                </td>

                                <td className="text-xs text-slate-400">{report.type}</td>

                                <td>
                                    <RiskBadge risk={report.risk} />
                                </td>

                                <td className="font-bold text-white">{report.score}</td>

                                <td className="text-xs text-slate-400">
                                    {report.status}
                                </td>

                                <td>
                                    <button
                                        onClick={() => setSelectedReport(report)}
                                        className="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-semibold text-slate-300 hover:bg-white/10"
                                    >
                                        Inspect
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredReports.length === 0 && (
                    <div className="py-16 text-center text-sm text-slate-600">
                        No reports match your filters.
                    </div>
                )}
            </div>
        </section>
    );
}

function WeekSignals({ setActivePage }) {
    const signals = [
        {
            title: "Work-at-height exposure",
            value: "+38%",
            severity: "Critical",
            description:
                "Multiple observations indicate repeated fall protection gaps across maintenance activities.",
        },
        {
            title: "Pedestrian / vehicle interaction",
            value: "+24%",
            severity: "High",
            description:
                "Near-miss reports around loading and warehouse areas are trending upward.",
        },
        {
            title: "Energy isolation",
            value: "+17%",
            severity: "Critical",
            description:
                "AI detected repeated deviations from lockout and verification practices.",
        },
        {
            title: "Housekeeping",
            value: "-12%",
            severity: "Medium",
            description:
                "Blocked access and slip/trip observations decreased compared with last week.",
        },
    ];

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
                            Predictive Intelligence
                        </p>
                        <h3 className="mt-2 text-2xl font-bold text-white">
                            Week Signals
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                            AI-detected patterns that may indicate increasing exposure
                            before an incident occurs.
                        </p>
                    </div>

                    <div className="flex h-fit items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="text-xs text-emerald-300">
                            Predictive engine active
                        </span>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {signals.map((signal) => (
                        <div
                            key={signal.title}
                            className="rounded-2xl border border-white/10 bg-black/10 p-5 transition hover:border-white/20"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-white">{signal.title}</p>
                                    <p className="mt-2 text-xs leading-6 text-slate-500">
                                        {signal.description}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p
                                        className={`text-xl font-bold ${signal.value.startsWith("+")
                                                ? "text-red-300"
                                                : "text-emerald-300"
                                            }`}
                                    >
                                        {signal.value}
                                    </p>
                                    <RiskBadge risk={signal.severity} />
                                </div>
                            </div>

                            <div className="mt-5 h-1.5 rounded-full bg-white/10">
                                <div
                                    className={`h-full rounded-full ${signal.severity === "Critical"
                                            ? "w-[88%] bg-red-400"
                                            : signal.severity === "High"
                                                ? "w-[68%] bg-orange-400"
                                                : "w-[42%] bg-yellow-400"
                                        }`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.035] p-6 lg:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-red-300">
                        Highest Priority Signal
                    </p>

                    <h3 className="mt-3 text-2xl font-bold text-white">
                        Work-at-height exposure is accelerating
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                        The intelligence engine has detected a cluster of observations
                        involving elevated work, missing fall protection and incomplete
                        pre-task controls.
                    </p>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-black/10 p-4">
                            <p className="text-[10px] text-slate-600">Reports</p>
                            <p className="mt-1 text-xl font-bold text-white">14</p>
                        </div>
                        <div className="rounded-xl bg-black/10 p-4">
                            <p className="text-[10px] text-slate-600">SIF Potential</p>
                            <p className="mt-1 text-xl font-bold text-red-300">9</p>
                        </div>
                        <div className="rounded-xl bg-black/10 p-4">
                            <p className="text-[10px] text-slate-600">Trend</p>
                            <p className="mt-1 text-xl font-bold text-orange-300">+38%</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setActivePage("strong")}
                        className="mt-5 rounded-xl bg-red-400 px-5 py-3 text-xs font-bold text-slate-950 hover:bg-red-300"
                    >
                        Generate Strong Report
                    </button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
                    <p className="text-xs font-bold text-slate-400">
                        Signal Confidence
                    </p>

                    <p className="mt-4 text-5xl font-black text-white">92%</p>

                    <p className="mt-2 text-xs leading-5 text-slate-600">
                        Based on report frequency, precursor relationships and risk
                        severity.
                    </p>

                    <div className="mt-6 h-2 rounded-full bg-white/10">
                        <div className="h-full w-[92%] rounded-full bg-amber-400" />
                    </div>
                </div>
            </section>
        </div>
    );
}

function StrongReport() {
    const [generated, setGenerated] = useState(false);

    const generateReport = () => {
        setGenerated(true);
    };

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
                            Executive Safety Intelligence
                        </p>

                        <h3 className="mt-2 text-3xl font-bold text-white">
                            Strong Report
                        </h3>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                            A decision-ready summary of the most significant safety
                            precursors detected across the reporting period.
                        </p>
                    </div>

                    <button
                        onClick={generateReport}
                        className="rounded-xl bg-amber-400 px-5 py-3 text-xs font-bold text-slate-950 hover:bg-amber-300"
                    >
                        {generated ? "Report Generated ✓" : "Generate Report"}
                    </button>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <KpiCard
                    title="Critical Precursors"
                    value="18"
                    change="+14%"
                    icon="⚠"
                    danger
                />
                <KpiCard
                    title="High Exposure Areas"
                    value="07"
                    change="+2"
                    icon="⌖"
                />
                <KpiCard
                    title="Actions Required"
                    value="27"
                    change="-6%"
                    icon="✓"
                />
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
                <div className="border-b border-white/10 pb-5">
                    <p className="text-xs text-slate-600">EXECUTIVE SUMMARY</p>
                    <h3 className="mt-2 text-xl font-bold text-white">
                        Safety risk is concentrated around high-energy work activities.
                    </h3>
                </div>

                <div className="grid grid-cols-1 gap-8 pt-6 lg:grid-cols-2">
                    <div>
                        <h4 className="text-sm font-bold text-amber-300">
                            Key Findings
                        </h4>

                        <div className="mt-4 space-y-3">
                            {[
                                "Work-at-height observations increased by 38%.",
                                "Three critical energy-isolation deviations were detected.",
                                "Vehicle-pedestrian interaction remains a major near-miss driver.",
                                "27 corrective actions require active monitoring.",
                            ].map((item, index) => (
                                <div
                                    key={item}
                                    className="flex gap-3 rounded-xl bg-black/10 p-4"
                                >
                                    <span className="text-xs font-bold text-amber-400">
                                        0{index + 1}
                                    </span>
                                    <p className="text-sm leading-6 text-slate-400">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-red-300">
                            Immediate Recommendations
                        </h4>

                        <div className="mt-4 space-y-3">
                            {[
                                "Conduct focused work-at-height verification.",
                                "Audit lockout/tagout practices in maintenance areas.",
                                "Review warehouse traffic segregation.",
                                "Escalate overdue critical corrective actions.",
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="rounded-xl border border-red-500/10 bg-red-500/[0.03] p-4"
                                >
                                    <p className="text-sm leading-6 text-slate-300">{item}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {generated && (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5">
                    <p className="font-semibold text-emerald-300">
                        ✓ Strong Report generated successfully
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Executive safety intelligence has been compiled from the current
                        reporting period.
                    </p>
                </div>
            )}
        </div>
    );
}

function Notifications() {
    const notifications = [
        {
            title: "Critical SIF precursor",
            text: "Improper lockout procedure detected.",
            time: "8 minutes ago",
            level: "Critical",
        },
        {
            title: "Corrective action overdue",
            text: "Fall protection action requires review.",
            time: "24 minutes ago",
            level: "High",
        },
        {
            title: "Weekly signal updated",
            text: "Vehicle interaction trend increased by 24%.",
            time: "1 hour ago",
            level: "High",
        },
        {
            title: "Report resolved",
            text: "Blocked emergency exit has been closed.",
            time: "3 hours ago",
            level: "Low",
        },
    ];

    return (
        <div className="mx-auto max-w-4xl space-y-4">
            {notifications.map((notification) => (
                <div
                    key={notification.title}
                    className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5"
                >
                    <div
                        className={`mt-1 h-10 w-10 shrink-0 rounded-xl ${notification.level === "Critical"
                                ? "bg-red-500/10 text-red-300"
                                : notification.level === "High"
                                    ? "bg-orange-500/10 text-orange-300"
                                    : "bg-emerald-500/10 text-emerald-300"
                            } flex items-center justify-center`}
                    >
                        {notification.level === "Low" ? "✓" : "!"}
                    </div>

                    <div className="flex-1">
                        <div className="flex flex-wrap justify-between gap-2">
                            <h3 className="font-semibold text-white">
                                {notification.title}
                            </h3>
                            <span className="text-[10px] text-slate-600">
                                {notification.time}
                            </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                            {notification.text}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function Settings() {
    const [aiEnabled, setAiEnabled] = useState(true);
    const [notifications, setNotifications] = useState(true);
    const [autoActions, setAutoActions] = useState(true);

    const Toggle = ({ enabled, setEnabled }) => (
        <button
            onClick={() => setEnabled(!enabled)}
            className={`relative h-6 w-11 rounded-full transition ${enabled ? "bg-amber-400" : "bg-white/10"
                }`}
        >
            <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"
                    }`}
            />
        </button>
    );

    return (
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.035] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
                Platform Configuration
            </p>

            <h3 className="mt-2 text-2xl font-bold text-white">Settings</h3>

            <div className="mt-8 divide-y divide-white/10">
                <div className="flex items-center justify-between gap-5 py-5">
                    <div>
                        <p className="font-semibold text-white">AI Safety Engine</p>
                        <p className="mt-1 text-xs text-slate-600">
                            Automatically analyze newly submitted observations.
                        </p>
                    </div>
                    <Toggle enabled={aiEnabled} setEnabled={setAiEnabled} />
                </div>

                <div className="flex items-center justify-between gap-5 py-5">
                    <div>
                        <p className="font-semibold text-white">Critical Notifications</p>
                        <p className="mt-1 text-xs text-slate-600">
                            Receive alerts when critical precursors are detected.
                        </p>
                    </div>
                    <Toggle
                        enabled={notifications}
                        setEnabled={setNotifications}
                    />
                </div>

                <div className="flex items-center justify-between gap-5 py-5">
                    <div>
                        <p className="font-semibold text-white">
                            AI Corrective Actions
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                            Generate recommended actions automatically.
                        </p>
                    </div>
                    <Toggle enabled={autoActions} setEnabled={setAutoActions} />
                </div>
            </div>
        </div>
    );
}

export default function SafetyIntelligencePage() {
    const [activePage, setActivePage] = useState("dashboard");
    const [selectedReport, setSelectedReport] = useState(null);
    const [unread, setUnread] = useState(3);

    const pageTitles = {
        dashboard: "Safety Dashboard",
        analysis: "AI Safety Analysis",
        bulk: "Bulk Upload",
        reports: "All Safety Reports",
        signals: "Week Signals",
        strong: "Strong Report",
        notifications: "Notifications",
        settings: "Settings",
    };

    const renderPage = () => {
        switch (activePage) {
            case "analysis":
                return <AiAnalysis />;

            case "bulk":
                return <BulkUpload />;

            case "reports":
                return (
                    <AllReports setSelectedReport={setSelectedReport} />
                );

            case "signals":
                return <WeekSignals setActivePage={setActivePage} />;

            case "strong":
                return <StrongReport />;

            case "notifications":
                return <Notifications />;

            case "settings":
                return <Settings />;

            default:
                return (
                    <Dashboard
                        setActivePage={setActivePage}
                        selectedReport={selectedReport}
                        setSelectedReport={setSelectedReport}
                    />
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#080c12] text-slate-100">
            <Sidebar
                activePage={activePage}
                setActivePage={setActivePage}
            />

            <MobileNav
                activePage={activePage}
                setActivePage={setActivePage}
            />

            <div className="lg:pl-64">
                <Topbar
                    title={pageTitles[activePage]}
                    unread={unread}
                    setUnread={setUnread}
                />

                <main className="min-h-[calc(100vh-80px)] bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.06),transparent_35%)] p-4 pb-28 sm:p-6 lg:p-8 lg:pb-8">
                    {renderPage()}
                </main>
            </div>

            {selectedReport && activePage !== "dashboard" && (
                <ReportModal
                    report={selectedReport}
                    onClose={() => setSelectedReport(null)}
                />
            )}
        </div>
    );
}