import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardView from './DashboardView';
import SubmitReportView from './SubmitReportView';
import SafetyReportsView from './SafetyReportsView';
import AIAnalysisView from './AIAnalysisView';
import BulkUploadView from './BulkUploadView';
import AllReportsView from './AllReportsView';
import SIFIntelligenceView from './SIFIntelligenceView';
import ReviewFeedbackView from './ReviewFeedbackView';
import FullAnalysisModal from './FullAnalysisModal';

export default function OrganizationPlatform() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSymbols, setShowSymbols] = useState(false);
  const [selectedReportForModal, setSelectedReportForModal] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleSelectReport = (report) => {
    setSelectedReportForModal(report);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleReportCreated = (newReportId) => {
    handleRefresh();
    setActiveTab('all_reports');
  };

  return (
    <div className="min-h-screen bg-[#070A14] text-slate-100 flex font-sans antialiased selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Ambient Radial Gradient Glow Orbs for Industrial Depth */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[750px] h-[750px] rounded-full bg-blue-600/8 blur-[140px]" />
        <div className="absolute top-1/2 -left-40 w-[650px] h-[650px] rounded-full bg-amber-500/5 blur-[160px]" />
        <div className="absolute -bottom-40 right-10 w-[700px] h-[700px] rounded-full bg-indigo-600/6 blur-[150px]" />
      </div>

      {/* 1. Left Persistent YouTube-Style Collapsible Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* 2. Main Content Column with Smooth Left Margin Shift */}
      <div 
        className={`
          flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out relative z-10
          ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-68'}
        `}
      >
        {/* Top Header / Navigation Bar */}
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileSidebarOpen}
          setIsMobileOpen={setIsMobileSidebarOpen}
          showSymbols={showSymbols}
          setShowSymbols={setShowSymbols}
        />

        {/* Dynamic Content View Area */}
        <main className="flex-1 pb-16">
          {activeTab === 'dashboard' && (
            <DashboardView 
              key={refreshKey}
              onSelectReport={handleSelectReport}
              onOpenSafetyReports={() => setActiveTab('all_reports')}
              onOpenAIAnalysis={() => setActiveTab('ai_analysis')}
              showSymbols={showSymbols}
              setShowSymbols={setShowSymbols}
            />
          )}

          {activeTab === 'ai_analysis' && (
            <AIAnalysisView 
              onSelectReport={handleSelectReport}
            />
          )}

          {activeTab === 'submit_report' && (
            <SubmitReportView 
              onReportCreated={handleReportCreated}
            />
          )}

          {activeTab === 'bulk_upload' && (
            <BulkUploadView 
              onSelectReport={handleSelectReport}
              onOpenAllReports={() => setActiveTab('all_reports')}
            />
          )}

          {activeTab === 'all_reports' && (
            <AllReportsView 
              key={refreshKey}
              onSelectReport={handleSelectReport}
            />
          )}

          {activeTab === 'weak_signals' && (
            <SIFIntelligenceView 
              onSelectReport={handleSelectReport}
            />
          )}

          {activeTab === 'review_feedback' && (
            <ReviewFeedbackView 
              key={refreshKey}
              onSelectReport={handleSelectReport}
            />
          )}
        </main>
      </div>

      {/* 3. Explainable Full AI Analysis Details Modal */}
      {selectedReportForModal && (
        <FullAnalysisModal 
          report={selectedReportForModal}
          onClose={() => setSelectedReportForModal(null)}
        />
      )}

    </div>
  );
}

