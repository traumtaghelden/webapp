import { useState, useEffect } from 'react';
import {
  Calendar, TrendingUp, DollarSign, Users, Target, Sparkles, Star, Heart,
  Map, CheckCircle, Clock, AlertTriangle, Building2, MapPin, ClipboardList,
  Zap, FileText, UsersRound, Palette, ChevronRight, TrendingDown, Wallet,
  Gift, ArrowRight, Plus
} from 'lucide-react';
import type { Task, BudgetItem, Guest, Wedding } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import HeroJourneyWidget from './HeroJourneyWidget';

interface DashboardOverviewTabProps {
  wedding: Wedding;
  tasks: Task[];
  budgetItems: BudgetItem[];
  guests: Guest[];
  onNavigate: (tab: string) => void;
}

export default function DashboardOverviewTab({
  wedding,
  tasks,
  budgetItems,
  guests,
  onNavigate
}: DashboardOverviewTabProps) {
  const [vendors, setVendors] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [timelineBlocks, setTimelineBlocks] = useState<any[]>([]);
  const [familyGroups, setFamilyGroups] = useState<any[]>([]);
  const [heroJourneyProgress, setHeroJourneyProgress] = useState<any[]>([]);


  useEffect(() => {
    loadAdditionalData();
  }, [wedding.id]);

  const loadAdditionalData = async () => {
    const [vendorsData, locationsData, timelineData, familiesData, progressData] = await Promise.all([
      supabase.from('vendors').select('*').eq('wedding_id', wedding.id),
      supabase.from('locations').select('*').eq('wedding_id', wedding.id),
      supabase.from('wedding_day_blocks').select('*').eq('wedding_id', wedding.id),
      supabase.from('family_groups').select('*').eq('wedding_id', wedding.id),
      supabase.from('hero_journey_progress').select('*').eq('wedding_id', wedding.id),
    ]);

    if (vendorsData.data) setVendors(vendorsData.data);
    if (locationsData.data) setLocations(locationsData.data);
    if (timelineData.data) setTimelineBlocks(timelineData.data);
    if (familiesData.data) setFamilyGroups(familiesData.data);
    if (progressData.data) setHeroJourneyProgress(progressData.data);
  };

  const getDaysUntilWedding = () => {
    const today = new Date();
    const weddingDate = new Date(wedding.wedding_date);
    const diffTime = weddingDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getCompletionPercentage = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  const getSpentBudget = () => {
    return budgetItems.reduce((sum, item) => sum + (item.actual_cost || 0), 0);
  };

  const getRSVPCount = () => {
    return guests.filter((g) => g.rsvp_status === 'accepted').length;
  };

  const getTaskStats = () => {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
    const overdue = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false;
      return new Date(t.due_date) < new Date();
    }).length;
    return { completed, pending, overdue, total: tasks.length };
  };

  const getBudgetStats = () => {
    const spent = getSpentBudget();
    const remaining = wedding.total_budget - spent;
    const percentage = wedding.total_budget > 0 ? Math.round((spent / wedding.total_budget) * 100) : 0;
    return { spent, remaining, percentage, total: wedding.total_budget };
  };

  const getGuestStats = () => {
    const accepted = guests.filter(g => g.rsvp_status === 'accepted').length;
    const invited = guests.filter(g => g.rsvp_status === 'invited').length;
    const declined = guests.filter(g => g.rsvp_status === 'declined').length;
    const pending = guests.filter(g => g.rsvp_status === 'planned' || g.rsvp_status === 'invited').length;
    return { accepted, invited, declined, pending, total: guests.length, families: familyGroups.length };
  };

  const getVendorStats = () => {
    const booked = vendors.filter(v => v.contract_status === 'signed' || v.contract_status === 'completed').length;
    const pool = vendors.filter(v => v.contract_status !== 'signed' && v.contract_status !== 'completed').length;
    const favorites = vendors.filter(v => v.is_favorite).length;
    return { booked, pool, favorites, total: vendors.length };
  };

  const getLocationStats = () => {
    const booked = locations.filter(l => l.booking_status === 'booked').length;
    const pool = locations.filter(l => l.booking_status === 'open').length;
    const capacity = locations.reduce((sum, l) => sum + (l.max_capacity || 0), 0);
    return { booked, pool, capacity, total: locations.length };
  };

  const getTimelineStats = () => {
    const eventBlocks = timelineBlocks.filter(b => !b.is_buffer).length;
    const bufferBlocks = timelineBlocks.filter(b => b.is_buffer).length;
    const totalDuration = timelineBlocks.reduce((sum, b) => sum + (b.duration_minutes || 0), 0);
    return { eventBlocks, bufferBlocks, totalDuration, total: timelineBlocks.length };
  };

  const getMotivationalMessage = () => {
    const completionRate = getCompletionPercentage();
    const daysLeft = getDaysUntilWedding();

    if (completionRate >= 90) return "Fast geschafft! Ihr seid großartig! 🎉";
    if (completionRate >= 70) return "Ihr macht tolle Fortschritte! 💪";
    if (completionRate >= 50) return "Weiter so, ihr seid auf dem richtigen Weg! ✨";
    if (daysLeft < 30) return "Die Zeit läuft - aber ihr schafft das! 🚀";
    if (daysLeft < 90) return "Nur noch wenige Monate - bleibt fokussiert! 🎯";
    return "Genießt die Planungsphase - es wird wunderbar! 💕";
  };

  const calculateHeroJourneySteps = () => {
    const totalBudget = budgetItems.reduce((sum, item) => sum + (item.actual_cost || item.estimated_cost || 0), 0);
    const confirmedGuests = guests.filter(g => g.rsvp_status === 'accepted').length;

    // Check hero_journey_progress for manual completions
    const progressMap = heroJourneyProgress.reduce((acc: any, p: any) => {
      if (p.status === 'completed') {
        acc[p.phase_id] = true;
      }
      return acc;
    }, {});

    const stepStatus = {
      vision: !!(wedding.vision_text && wedding.vision_text.length > 50 && wedding.vision_keywords && (wedding.vision_keywords as any[]).length >= 3),
      budget: wedding.total_budget > 0,
      guest_count: wedding.guest_count > 0,
      location: progressMap.location || (locations.length > 0 && locations.some((l: any) => l.booking_status === 'booked')),
      ceremony: progressMap.ceremony || !!(wedding.ceremony_type && wedding.ceremony_location && wedding.ceremony_time),
      date: progressMap.date || !!(wedding.wedding_date && wedding.wedding_date.length > 0 && new Date(wedding.wedding_date) > new Date()),
      personality: !!(wedding.style_theme && wedding.style_colors && Object.keys(wedding.style_colors as any).length >= 2),
      timeline: timelineBlocks.length >= 5,
      personal_planning: tasks.filter((t: any) => ['dress', 'rings', 'personal'].includes(t.category)).length >= 2,
      guest_planning: guests.length >= 10 && confirmedGuests >= guests.length * 0.3,
    };

    const completedCount = Object.values(stepStatus).filter(Boolean).length;

    // Find next step
    const stepOrder = [
      'vision', 'budget', 'guest_count', 'location', 'ceremony',
      'date', 'personality', 'timeline', 'personal_planning', 'guest_planning'
    ];

    let nextStep = 'completed';
    for (const step of stepOrder) {
      if (!stepStatus[step as keyof typeof stepStatus]) {
        nextStep = step;
        break;
      }
    }

    return { completedCount, nextStep };
  };

  // Calculate all stats after function definitions
  const taskStats = getTaskStats();
  const budgetStats = getBudgetStats();
  const guestStats = getGuestStats();
  const vendorStats = getVendorStats();
  const locationStats = getLocationStats();
  const timelineStats = getTimelineStats();
  const heroJourneyStats = calculateHeroJourneySteps();

  const planningAreas = [
    {
      id: 'journey',
      title: 'Heldenplan',
      subtitle: 'Eure strukturierte Reise',
      icon: Map,
      gradient: 'from-purple-500 to-purple-600',
      stats: [
        { label: 'Schritte', value: `${heroJourneyStats.completedCount}/10` }
      ],
      visible: true,
      renderCustom: true
    },
    {
      id: 'tasks',
      title: 'Aufgaben',
      subtitle: 'To-Dos & Organisation',
      icon: CheckCircle,
      gradient: 'from-orange-500 to-orange-600',
      stats: [
        { label: 'Erledigt', value: `${taskStats.completed}/${taskStats.total}` },
        { label: 'Offen', value: taskStats.pending },
        { label: 'Überfällig', value: taskStats.overdue, highlight: taskStats.overdue > 0 }
      ],
      visible: true
    },
    {
      id: 'budget',
      title: 'Budget',
      subtitle: 'Finanzen & Kosten',
      icon: Wallet,
      gradient: 'from-green-500 to-green-600',
      stats: [
        { label: 'Ausgegeben', value: `${budgetStats.spent.toLocaleString('de-DE')} €` },
        { label: 'Verbleibend', value: `${budgetStats.remaining.toLocaleString('de-DE')} €` },
        { label: 'Budget', value: `${budgetStats.percentage}%` }
      ],
      visible: true
    },
    {
      id: 'guests',
      title: 'Gäste',
      subtitle: 'Einladungen & RSVPs',
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      stats: [
        { label: 'Bestätigt', value: `${guestStats.accepted}/${wedding.guest_count}` },
        { label: 'Ausstehend', value: guestStats.pending },
        { label: 'Familien', value: guestStats.families }
      ],
      visible: true
    },
    {
      id: 'vendors',
      title: 'Dienstleister',
      subtitle: 'Eure Partner',
      icon: Building2,
      gradient: 'from-indigo-500 to-indigo-600',
      stats: [
        { label: 'Gebucht', value: `${vendorStats.booked}/${vendorStats.total}` },
        { label: 'Im Pool', value: vendorStats.pool },
        { label: 'Favoriten', value: vendorStats.favorites }
      ],
      visible: true
    },
    {
      id: 'locations',
      title: 'Locations',
      subtitle: 'Orte & Räume',
      icon: MapPin,
      gradient: 'from-teal-500 to-teal-600',
      stats: [
        { label: 'Gebucht', value: locationStats.booked },
        { label: 'Im Pool', value: locationStats.pool },
        { label: 'Kapazität', value: locationStats.capacity > 0 ? `${locationStats.capacity} P.` : '-' }
      ],
      visible: true
    },
    {
      id: 'timeline',
      title: 'Hochzeitstag',
      subtitle: 'Zeitplan & Ablauf',
      icon: Clock,
      gradient: 'from-pink-500 to-pink-600',
      stats: [
        { label: 'Events', value: timelineStats.eventBlocks },
        { label: 'Puffer', value: timelineStats.bufferBlocks },
        { label: 'Dauer', value: timelineStats.totalDuration > 0 ? `${Math.round(timelineStats.totalDuration / 60)}h` : '-' }
      ],
      visible: true
    }
  ];

  const visibleAreas = planningAreas;

  return (
    <div id="main-content" className="space-y-8 animate-fade-in">

      {/* Hero KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 w-full max-w-full">
        <div className="group relative bg-gradient-to-br from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-2xl border-2 border-[#d4af37]/50 overflow-hidden hover-lift">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-gradient-to-br from-[#d4af37]/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="relative z-10">
            <div className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4 shadow-gold group-hover:scale-110 transition-all duration-300">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white" />
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2 mb-1 sm:mb-2">
              <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold gradient-text-gold">{getDaysUntilWedding()}</span>
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#f4d03f] animate-sparkle" />
            </div>
            <h3 className="text-white/90 font-bold text-xs sm:text-sm md:text-base lg:text-lg">Tage verbleibend</h3>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-2xl border-2 border-[#d4af37]/50 overflow-hidden hover-lift">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-gradient-to-br from-[#d4af37]/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="relative z-10">
            <div className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4 shadow-gold group-hover:scale-110 transition-all duration-300">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white" />
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2 mb-1 sm:mb-2">
              <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold gradient-text-gold">{taskStats.completed}</span>
              <span className="text-sm sm:text-base md:text-lg lg:text-xl text-white/70 font-semibold">/ {taskStats.total}</span>
              <Star className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[#f4d03f] animate-pulse fill-current" />
            </div>
            <h3 className="text-white/90 font-bold text-xs sm:text-sm md:text-base lg:text-lg">Aufgaben erledigt</h3>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-2xl border-2 border-[#d4af37]/50 overflow-hidden hover-lift">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-gradient-to-br from-[#d4af37]/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="relative z-10">
            <div className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4 shadow-gold group-hover:scale-110 transition-all duration-300">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white" />
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2 mb-1 sm:mb-2">
              <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold gradient-text-gold">
                {budgetStats.percentage}%
              </span>
            </div>
            <h3 className="text-white/90 font-bold text-xs sm:text-sm md:text-base lg:text-lg">Budget genutzt</h3>
            <div className="mt-2 sm:mt-3 w-full bg-white/10 rounded-full h-1.5 sm:h-2 md:h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(budgetStats.percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-2xl border-2 border-[#d4af37]/50 overflow-hidden hover-lift">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-gradient-to-br from-[#d4af37]/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="relative z-10">
            <div className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4 shadow-gold group-hover:scale-110 transition-all duration-300">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white" />
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2 mb-1 sm:mb-2">
              <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold gradient-text-gold">{getRSVPCount()}</span>
              <span className="text-sm sm:text-base md:text-lg lg:text-xl text-white/70 font-semibold">/ {wedding.guest_count}</span>
            </div>
            <h3 className="text-white/90 font-bold text-xs sm:text-sm md:text-base lg:text-lg">Bestätigte Gäste</h3>
          </div>
        </div>
      </div>

      {/* Quick Stats Summary - Above Hero Journey */}
      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl md:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 border border-[#d4af37]/30 shadow-lg hover:shadow-xl transition-all duration-300">
        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 flex items-center gap-2 sm:gap-3">
          <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d03f] p-2 sm:p-2.5 md:p-3 rounded-lg md:rounded-xl shadow-md">
            <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </div>
          <span className="hidden sm:inline">Schnellübersicht</span>
          <span className="sm:hidden">Übersicht</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
          <div className="bg-gradient-to-br from-orange-50 to-white p-2 sm:p-3 md:p-4 rounded-lg md:rounded-2xl border border-orange-200/50 hover:border-orange-300 transition-all hover:scale-105">
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-orange-600 mb-1 sm:mb-2">{taskStats.total}</div>
            <div className="text-xs sm:text-sm font-medium text-[#666666]">Aufgaben</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-white p-2 sm:p-3 md:p-4 rounded-lg md:rounded-2xl border border-green-200/50 hover:border-green-300 transition-all hover:scale-105">
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-green-600 mb-1 sm:mb-2">{budgetItems.length}</div>
            <div className="text-xs sm:text-sm font-medium text-[#666666]">Budget</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-white p-2 sm:p-3 md:p-4 rounded-lg md:rounded-2xl border border-blue-200/50 hover:border-blue-300 transition-all hover:scale-105">
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">{guestStats.total}</div>
            <div className="text-xs sm:text-sm font-medium text-[#666666]">Gäste</div>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-white p-2 sm:p-3 md:p-4 rounded-lg md:rounded-2xl border border-indigo-200/50 hover:border-indigo-300 transition-all hover:scale-105">
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-indigo-600 mb-1 sm:mb-2">{vendorStats.total}</div>
            <div className="text-xs sm:text-sm font-medium text-[#666666]">Anbieter</div>
          </div>
          <div className="bg-gradient-to-br from-teal-50 to-white p-2 sm:p-3 md:p-4 rounded-lg md:rounded-2xl border border-teal-200/50 hover:border-teal-300 transition-all hover:scale-105 col-span-2 sm:col-span-1">
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-teal-600 mb-1 sm:mb-2">{locationStats.total}</div>
            <div className="text-xs sm:text-sm font-medium text-[#666666]">Locations</div>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[#d4af37]" />
            <span className="hidden sm:inline">Eure Planungsbereiche</span>
            <span className="sm:hidden">Bereiche</span>
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-300 mt-1 hidden sm:block">
            Klickt auf einen Bereich, um direkt loszulegen
          </p>
        </div>
      </div>

      {/* Planning Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full max-w-full">
        {planningAreas.map((area, index) => {
          const Icon = area.icon;

          if (area.renderCustom && area.id === 'journey') {
            return (
              <div key={area.id} className="md:col-span-2 lg:col-span-3 animate-slide-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                <HeroJourneyWidget
                  completedSteps={heroJourneyStats.completedCount}
                  totalSteps={10}
                  nextRecommendedStep={heroJourneyStats.nextStep}
                  onNavigateToJourney={() => onNavigate('journey')}
                />
              </div>
            );
          }

          return (
            <button
              key={area.id}
              onClick={() => onNavigate(area.id)}
              className="group relative bg-gradient-to-br from-white via-[#f7f2eb]/30 to-white rounded-xl md:rounded-2xl lg:rounded-3xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-[#d4af37]/20 hover:border-[#d4af37]/60 text-left overflow-hidden animate-slide-in-up hover:scale-[1.02] active:scale-[0.98]"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Animated Background Elements */}
              <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-br from-[#d4af37]/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <div className={`absolute inset-0 bg-gradient-to-br ${area.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-3 sm:mb-4 md:mb-5">
                  <div className={`bg-gradient-to-br ${area.gradient} w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg md:rounded-xl lg:rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-white" />
                  </div>
                  <div className="bg-[#d4af37]/10 group-hover:bg-[#d4af37]/20 p-1.5 sm:p-2 rounded-full transition-all duration-300">
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37] group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-[#d4af37] transition-colors">
                  {area.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#666666] mb-3 sm:mb-4 md:mb-5 font-medium">{area.subtitle}</p>

                {/* Stats */}
                <div className="space-y-2 sm:space-y-3">
                  {area.stats.map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 sm:p-2.5 md:p-3 bg-gradient-to-r from-[#f7f2eb]/50 to-white rounded-lg md:rounded-xl border border-[#d4af37]/10 group-hover:border-[#d4af37]/30 transition-all duration-300">
                      <span className="text-[#666666] font-medium text-xs sm:text-sm">{stat.label}</span>
                      <span className={`font-bold text-xs sm:text-sm md:text-base ${stat.highlight ? 'text-red-600 bg-red-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full' : 'text-gray-900'}`}>
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
