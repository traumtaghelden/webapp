import { Users, CheckCircle, Clock, XCircle, Mail, Sparkles, ArrowRight } from 'lucide-react';
import { Guest } from '../lib/supabase';
import { GUEST, COMMON } from '../constants/terminology';

interface GuestListSummaryWidgetProps {
  guests: Guest[];
  onShowAll: () => void;
}

export default function GuestListSummaryWidget({ guests, onShowAll }: GuestListSummaryWidgetProps) {
  const totalGuests = guests.length;
  const acceptedGuests = guests.filter(g => g.rsvp_status === 'accepted').length;
  const invitedGuests = guests.filter(g => g.rsvp_status === 'invited').length;
  const declinedGuests = guests.filter(g => g.rsvp_status === 'declined').length;
  const plannedGuests = guests.filter(g => g.rsvp_status === 'planned').length;

  const getPercentage = (count: number) => {
    if (totalGuests === 0) return 0;
    return Math.round((count / totalGuests) * 100);
  };

  const statusData = [
    {
      label: GUEST.RSVP_STATUS.ACCEPTED,
      count: acceptedGuests,
      percentage: getPercentage(acceptedGuests),
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      barColor: 'bg-gradient-to-r from-green-400 to-green-600',
      glowColor: 'shadow-green-500/50'
    },
    {
      label: GUEST.RSVP_STATUS.INVITED,
      count: invitedGuests,
      percentage: getPercentage(invitedGuests),
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      barColor: 'bg-gradient-to-r from-blue-400 to-blue-600',
      glowColor: 'shadow-blue-500/50'
    },
    {
      label: GUEST.RSVP_STATUS.PLANNED,
      count: plannedGuests,
      percentage: getPercentage(plannedGuests),
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      barColor: 'bg-gradient-to-r from-gray-400 to-gray-600',
      glowColor: 'shadow-gray-500/50'
    },
    {
      label: GUEST.RSVP_STATUS.DECLINED,
      count: declinedGuests,
      percentage: getPercentage(declinedGuests),
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      barColor: 'bg-gradient-to-r from-red-400 to-red-600',
      glowColor: 'shadow-red-500/50'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-2xl border-2 border-[#d4af37]/50 relative overflow-hidden h-full flex flex-col">
      {/* Animated background effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#d4af37]/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-[#f4d03f]/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyMTIsIDE3NSwgNTUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 md:mb-8">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-[#d4af37]/50 animate-pulse">
              <Users className="w-5 h-5 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-1 md:gap-2">
                {GUEST.MODULE_NAME}liste
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-[#f4d03f] animate-sparkle" />
              </h3>
              <p className="text-[#d4af37] text-xs md:text-sm font-medium">{COMMON.OVERVIEW} & Status</p>
            </div>
          </div>
        </div>

        {/* Main Count Display */}
        <div className="mb-5 md:mb-8 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl md:rounded-3xl px-6 md:px-12 py-4 md:py-6 border border-[#d4af37]/30">
              <div className="flex items-baseline gap-2 md:gap-3 justify-center">
                <span className="text-4xl md:text-7xl font-bold bg-gradient-to-r from-[#d4af37] to-[#f4d03f] bg-clip-text text-transparent">
                  {totalGuests}
                </span>
                <span className="text-lg md:text-2xl text-white/80 font-medium">{GUEST.PLURAL}</span>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2 md:gap-4 text-xs md:text-sm text-white/60">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                  {acceptedGuests} zugesagt
                </span>
                <span className="text-white/30">•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
                  {invitedGuests} eingeladen
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="space-y-3 md:space-y-5 mb-5 md:mb-8 flex-grow">
          {statusData.map((status, index) => (
            <div
              key={index}
              className="group relative bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-5 border border-white/10 hover:border-[#d4af37]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#d4af37]/20"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Status Icon & Info */}
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className={`${status.bgColor} w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg ${status.glowColor} group-hover:scale-110 transition-transform`}>
                    <status.icon className={`w-4 h-4 md:w-6 md:h-6 ${status.color}`} />
                  </div>
                  <div>
                    <span className="text-sm md:text-lg font-bold text-white block">{status.label}</span>
                    <span className="text-xs text-white/50 hidden md:block">Status</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl md:text-3xl font-bold text-white">{status.count}</div>
                  <div className="text-xs md:text-sm text-[#d4af37] font-semibold">{status.percentage}%</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full bg-white/10 rounded-full h-2 md:h-3 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                <div
                  className={`${status.barColor} h-2 md:h-3 rounded-full transition-all duration-1000 ease-out shadow-lg ${status.glowColor} relative overflow-hidden`}
                  style={{ width: `${status.percentage}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={onShowAll}
          className="w-full bg-gradient-to-r from-[#d4af37] via-[#f4d03f] to-[#d4af37] hover:from-[#f4d03f] hover:via-[#d4af37] hover:to-[#f4d03f] text-[#0a253c] font-bold py-3 md:py-4 rounded-xl md:rounded-2xl transition-all transform hover:scale-105 shadow-2xl shadow-[#d4af37]/50 flex items-center justify-center gap-2 md:gap-3 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <Users className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-12 transition-transform" />
          <span className="text-sm md:text-lg">Alle {GUEST.PLURAL} anzeigen</span>
          <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
