import { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Sparkles, Star, Heart,
  Map, CheckCircle, Clock, Building2, MapPin, Wallet, ArrowRight,
  Target, Users
} from 'lucide-react';
import type { Task, BudgetItem, Guest, Wedding } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

interface CinematicOverviewProps {
  wedding: Wedding;
  tasks: Task[];
  budgetItems: BudgetItem[];
  guests: Guest[];
  onNavigate: (tab: string) => void;
}

export default function CinematicOverview({
  wedding,
  tasks,
  budgetItems,
  guests,
  onNavigate
}: CinematicOverviewProps) {
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

  const getTimeUntilWedding = () => {
    const today = new Date();
    const weddingDate = new Date(wedding.wedding_date);
    const diffTime = weddingDate.getTime() - today.getTime();

    if (diffTime <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffTime % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  };

  const [timeRemaining, setTimeRemaining] = useState(getTimeUntilWedding());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(getTimeUntilWedding());
    }, 1000);

    return () => clearInterval(timer);
  }, [wedding.wedding_date]);

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
    const spent = budgetItems.reduce((sum, item) => sum + (item.actual_cost || 0), 0);
    const remaining = wedding.total_budget - spent;
    const percentage = wedding.total_budget > 0 ? Math.round((spent / wedding.total_budget) * 100) : 0;
    return { spent, remaining, percentage, total: wedding.total_budget };
  };

  const getGuestStats = () => {
    const accepted = guests.filter(g => g.rsvp_status === 'accepted').length;
    const pending = guests.filter(g => g.rsvp_status === 'planned' || g.rsvp_status === 'invited').length;
    return { accepted, pending, total: guests.length, families: familyGroups.length };
  };

  const getVendorStats = () => {
    const booked = vendors.filter(v => v.contract_status === 'signed' || v.contract_status === 'completed').length;
    const pool = vendors.filter(v => v.contract_status !== 'signed' && v.contract_status !== 'completed').length;
    return { booked, pool, total: vendors.length };
  };

  const getLocationStats = () => {
    const booked = locations.filter(l => l.booking_status === 'booked').length;
    const pool = locations.filter(l => l.booking_status === 'open').length;
    return { booked, pool, total: locations.length };
  };

  const getTimelineStats = () => {
    const eventBlocks = timelineBlocks.filter(b => !b.is_buffer).length;
    const bufferBlocks = timelineBlocks.filter(b => b.is_buffer).length;
    const totalDuration = timelineBlocks.reduce((sum, b) => sum + (b.duration_minutes || 0), 0);
    return { eventBlocks, bufferBlocks, totalDuration, total: timelineBlocks.length };
  };

  const calculateHeroJourneySteps = () => {
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
      guest_planning: guests.length >= 10 && guests.filter(g => g.rsvp_status === 'accepted').length >= guests.length * 0.3,
    };

    const completedCount = Object.values(stepStatus).filter(Boolean).length;
    return { completedCount, totalSteps: 10 };
  };

  const taskStats = getTaskStats();
  const budgetStats = getBudgetStats();
  const guestStats = getGuestStats();
  const vendorStats = getVendorStats();
  const locationStats = getLocationStats();
  const timelineStats = getTimelineStats();
  const heroJourneyStats = calculateHeroJourneySteps();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // Memoize particles so they don't re-render on every second
  const particles = useMemo(() => {
    return [...Array(30)].map((_, i) => ({
      id: i,
      width: 2 + Math.random() * 4,
      height: 2 + Math.random() * 4,
      backgroundColor: i % 2 === 0 ? '#d4af37' : '#f4d03f',
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDuration: 5 + Math.random() * 10,
      animationDelay: Math.random() * 5
    }));
  }, []);

  return (
    <div className="min-h-screen space-y-8 sm:space-y-12 md:space-y-16 pb-12 sm:pb-16 md:pb-20 animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a253c] via-[#1a3a5c] to-[#0a253c] rounded-2xl md:rounded-3xl lg:rounded-[2rem]">
          <div className="absolute inset-0 opacity-30">
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="absolute rounded-full"
                style={{
                  width: `${particle.width}px`,
                  height: `${particle.height}px`,
                  backgroundColor: particle.backgroundColor,
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  animation: `float ${particle.animationDuration}s linear infinite`,
                  animationDelay: `${particle.animationDelay}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 sm:p-8 md:p-10 lg:p-16">
          {/* Title & Date */}
          <div className="text-center mb-8 sm:mb-10 md:mb-12 animate-hero-title">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-[#d4af37] fill-current animate-pulse" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                {wedding.partner_1_name} & {wedding.partner_2_name}
              </h1>
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-[#d4af37] fill-current animate-pulse" />
            </div>
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-[#f4d03f]" />
              <p className="text-lg sm:text-xl md:text-2xl text-gray-300">
                {formatDate(wedding.wedding_date)}
              </p>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="relative">
            {/* Subtitle */}
            <div className="text-center mb-3 sm:mb-6 md:mb-8">
              <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-[#f4d03f] font-semibold">Noch</p>
            </div>

            {/* Countdown Grid */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-6 lg:gap-8">
              {/* Days */}
              <div className="group relative bg-gradient-to-br from-[#1a3a5c] to-[#0a253c] rounded-lg sm:rounded-2xl md:rounded-3xl p-2 sm:p-6 md:p-10 lg:p-12 border border-[#d4af37]/40 sm:border-2 hover:border-[#d4af37]/70 transition-all duration-300 hover-lift">
                <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 to-transparent rounded-lg sm:rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center">
                  <div className="text-2xl sm:text-5xl md:text-7xl lg:text-8xl font-bold gradient-text-gold mb-0.5 sm:mb-3 md:mb-4 animate-pulse-glow">
                    {timeRemaining.days}
                  </div>
                  <div className="text-[8px] sm:text-base md:text-xl text-white/90 font-semibold uppercase tracking-wider">
                    Tage
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div className="group relative bg-gradient-to-br from-[#1a3a5c] to-[#0a253c] rounded-lg sm:rounded-2xl md:rounded-3xl p-2 sm:p-6 md:p-10 lg:p-12 border border-[#d4af37]/40 sm:border-2 hover:border-[#d4af37]/70 transition-all duration-300 hover-lift">
                <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 to-transparent rounded-lg sm:rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center">
                  <div className="text-2xl sm:text-5xl md:text-7xl lg:text-8xl font-bold gradient-text-gold mb-0.5 sm:mb-3 md:mb-4">
                    {String(timeRemaining.hours).padStart(2, '0')}
                  </div>
                  <div className="text-[8px] sm:text-base md:text-xl text-white/90 font-semibold uppercase tracking-wider">
                    Stunden
                  </div>
                </div>
              </div>

              {/* Minutes */}
              <div className="group relative bg-gradient-to-br from-[#1a3a5c] to-[#0a253c] rounded-lg sm:rounded-2xl md:rounded-3xl p-2 sm:p-6 md:p-10 lg:p-12 border border-[#d4af37]/40 sm:border-2 hover:border-[#d4af37]/70 transition-all duration-300 hover-lift">
                <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 to-transparent rounded-lg sm:rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center">
                  <div className="text-2xl sm:text-5xl md:text-7xl lg:text-8xl font-bold gradient-text-gold mb-0.5 sm:mb-3 md:mb-4">
                    {String(timeRemaining.minutes).padStart(2, '0')}
                  </div>
                  <div className="text-[8px] sm:text-base md:text-xl text-white/90 font-semibold uppercase tracking-wider">
                    Minuten
                  </div>
                </div>
              </div>

              {/* Seconds */}
              <div className="group relative bg-gradient-to-br from-[#1a3a5c] to-[#0a253c] rounded-lg sm:rounded-2xl md:rounded-3xl p-2 sm:p-6 md:p-10 lg:p-12 border border-[#d4af37]/40 sm:border-2 hover:border-[#d4af37]/70 transition-all duration-300 hover-lift">
                <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 to-transparent rounded-lg sm:rounded-2xl md:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center">
                  <div className="text-2xl sm:text-5xl md:text-7xl lg:text-8xl font-bold gradient-text-gold mb-0.5 sm:mb-3 md:mb-4">
                    {String(timeRemaining.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-[8px] sm:text-base md:text-xl text-white/90 font-semibold uppercase tracking-wider">
                    Sekunden
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Text */}
            <div className="text-center mt-3 sm:mt-6 md:mt-8">
              <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-[#f4d03f] font-semibold">bis zu eurem großen Tag</p>
            </div>
          </div>
        </div>
      </div>

      {/* Golden Path Connector */}
      <div className="relative flex items-center justify-center py-4">
        <div className="w-full max-w-xs h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent rounded-full shadow-gold"></div>
        <div className="absolute left-1/2 -translate-x-1/2 bg-gradient-to-br from-[#d4af37] to-[#f4d03f] rounded-full p-3 shadow-gold-lg">
          <Sparkles className="w-6 h-6 text-white animate-pulse" />
        </div>
      </div>

      {/* Story Flow Cards */}
      <div className="space-y-3 sm:space-y-6 md:space-y-8 lg:space-y-10">
        {/* Heldenplan Card */}
        <button
          onClick={() => onNavigate('journey')}
          className="group relative w-full bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 shadow-soft-lg hover:shadow-gold-xl transition-all duration-500 border-2 border-[#d4af37]/20 hover:border-[#d4af37]/50 text-left overflow-hidden hover:scale-[1.01] active:scale-[0.99]"
          style={{ animationDelay: '0.1s' }}
        >
          {/* Animated Background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-3 sm:gap-4 md:gap-6">
            {/* Icon */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg flex-shrink-0">
              <Map className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-purple-600 transition-colors">
                    Heldenplan
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-[#666666] font-medium">Eure strukturierte Reise zur Traumhochzeit</p>
                </div>
                <div className="bg-[#d4af37]/10 group-hover:bg-[#d4af37]/20 p-1.5 sm:p-2 md:p-3 rounded-full transition-all duration-300 flex-shrink-0">
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#d4af37] group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-50 to-white rounded-lg sm:rounded-xl border border-purple-200/50">
                  <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{heroJourneyStats.completedCount}/10 Schritte</span>
                </div>
                <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 rounded-lg sm:rounded-xl border border-[#d4af37]/20">
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{Math.round((heroJourneyStats.completedCount / 10) * 100)}% abgeschlossen</span>
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Aufgaben Card */}
        <button
          onClick={() => onNavigate('tasks')}
          className="group relative w-full bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 shadow-soft-lg hover:shadow-gold-xl transition-all duration-500 border-2 border-[#d4af37]/20 hover:border-[#d4af37]/50 text-left overflow-hidden hover:scale-[1.01] active:scale-[0.99]"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-3 sm:gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg flex-shrink-0">
              <CheckCircle className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-orange-600 transition-colors">
                    Aufgaben
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-[#666666] font-medium">To-Dos und Organisation</p>
                </div>
                <div className="bg-[#d4af37]/10 group-hover:bg-[#d4af37]/20 p-1.5 sm:p-2 md:p-3 rounded-full transition-all duration-300 flex-shrink-0">
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#d4af37] group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-green-50 to-white rounded-lg sm:rounded-xl border border-green-200/50">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{taskStats.completed} erledigt</span>
                </div>
                <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-orange-50 to-white rounded-lg sm:rounded-xl border border-orange-200/50">
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{taskStats.pending} offen</span>
                </div>
                {taskStats.overdue > 0 && (
                  <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-red-50 to-white rounded-lg sm:rounded-xl border border-red-200/50">
                    <span className="text-xs sm:text-sm md:text-base font-semibold text-red-600">{taskStats.overdue} überfällig</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </button>

        {/* Budget Card */}
        <button
          onClick={() => onNavigate('budget')}
          className="group relative w-full bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 shadow-soft-lg hover:shadow-gold-xl transition-all duration-500 border-2 border-[#d4af37]/20 hover:border-[#d4af37]/50 text-left overflow-hidden hover:scale-[1.01] active:scale-[0.99]"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-3 sm:gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg flex-shrink-0">
              <Wallet className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-green-600 transition-colors">
                    Budget
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-[#666666] font-medium">Finanzen und Kosten</p>
                </div>
                <div className="bg-[#d4af37]/10 group-hover:bg-[#d4af37]/20 p-1.5 sm:p-2 md:p-3 rounded-full transition-all duration-300 flex-shrink-0">
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#d4af37] group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-green-50 to-white rounded-lg sm:rounded-xl border border-green-200/50">
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{budgetStats.spent.toLocaleString('de-DE')} € ausgegeben</span>
                </div>
                <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-50 to-white rounded-lg sm:rounded-xl border border-blue-200/50">
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{budgetStats.remaining.toLocaleString('de-DE')} € verbleibend</span>
                </div>
                <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 rounded-lg sm:rounded-xl border border-[#d4af37]/20">
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{budgetStats.percentage}% genutzt</span>
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Gäste Card */}
        <button
          onClick={() => onNavigate('guests')}
          className="group relative w-full bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 shadow-soft-lg hover:shadow-gold-xl transition-all duration-500 border-2 border-[#d4af37]/20 hover:border-[#d4af37]/50 text-left overflow-hidden hover:scale-[1.01] active:scale-[0.99]"
          style={{ animationDelay: '0.4s' }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-3 sm:gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg flex-shrink-0">
              <Users className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-blue-600 transition-colors">
                    Gäste
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-[#666666] font-medium">Einladungen und RSVPs</p>
                </div>
                <div className="bg-[#d4af37]/10 group-hover:bg-[#d4af37]/20 p-1.5 sm:p-2 md:p-3 rounded-full transition-all duration-300 flex-shrink-0">
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#d4af37] group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-green-50 to-white rounded-lg sm:rounded-xl border border-green-200/50">
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{guestStats.accepted} bestätigt</span>
                </div>
                <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-yellow-50 to-white rounded-lg sm:rounded-xl border border-yellow-200/50">
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{guestStats.pending} ausstehend</span>
                </div>
                <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-50 to-white rounded-lg sm:rounded-xl border border-blue-200/50">
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{guestStats.families} Familien</span>
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Dienstleister Card */}
        <button
          onClick={() => onNavigate('vendors')}
          className="group relative w-full bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 shadow-soft-lg hover:shadow-gold-xl transition-all duration-500 border-2 border-[#d4af37]/20 hover:border-[#d4af37]/50 text-left overflow-hidden hover:scale-[1.01] active:scale-[0.99]"
          style={{ animationDelay: '0.5s' }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-3 sm:gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg flex-shrink-0">
              <Building2 className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-indigo-600 transition-colors">
                    Dienstleister
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-[#666666] font-medium">Eure Partner für den großen Tag</p>
                </div>
                <div className="bg-[#d4af37]/10 group-hover:bg-[#d4af37]/20 p-1.5 sm:p-2 md:p-3 rounded-full transition-all duration-300 flex-shrink-0">
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#d4af37] group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-green-50 to-white rounded-lg sm:rounded-xl border border-green-200/50">
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{vendorStats.booked} gebucht</span>
                </div>
                <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-indigo-50 to-white rounded-lg sm:rounded-xl border border-indigo-200/50">
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{vendorStats.pool} im Pool</span>
                </div>
                <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 rounded-lg sm:rounded-xl border border-[#d4af37]/20">
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{vendorStats.total} gesamt</span>
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Locations Card */}
        <button
          onClick={() => onNavigate('locations')}
          className="group relative w-full bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 shadow-soft-lg hover:shadow-gold-xl transition-all duration-500 border-2 border-[#d4af37]/20 hover:border-[#d4af37]/50 text-left overflow-hidden hover:scale-[1.01] active:scale-[0.99]"
          style={{ animationDelay: '0.6s' }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-500/10 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-3 sm:gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg flex-shrink-0">
              <MapPin className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-teal-600 transition-colors">
                    Locations
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-[#666666] font-medium">Orte und Räume für eure Feier</p>
                </div>
                <div className="bg-[#d4af37]/10 group-hover:bg-[#d4af37]/20 p-1.5 sm:p-2 md:p-3 rounded-full transition-all duration-300 flex-shrink-0">
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#d4af37] group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-green-50 to-white rounded-lg sm:rounded-xl border border-green-200/50">
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{locationStats.booked} gebucht</span>
                </div>
                <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-teal-50 to-white rounded-lg sm:rounded-xl border border-teal-200/50">
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{locationStats.pool} im Pool</span>
                </div>
                <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 rounded-lg sm:rounded-xl border border-[#d4af37]/20">
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{locationStats.total} gesamt</span>
                </div>
              </div>
            </div>
          </div>
        </button>

        {/* Hochzeitstag Card */}
        <button
          onClick={() => onNavigate('timeline')}
          className="group relative w-full bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 shadow-soft-lg hover:shadow-gold-xl transition-all duration-500 border-2 border-[#d4af37]/20 hover:border-[#d4af37]/50 text-left overflow-hidden hover:scale-[1.01] active:scale-[0.99]"
          style={{ animationDelay: '0.7s' }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-500/10 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-3 sm:gap-4 md:gap-6">
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg flex-shrink-0">
              <Clock className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-pink-600 transition-colors">
                    Hochzeitstag
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-[#666666] font-medium">Zeitplan und Ablauf eures großen Tages</p>
                </div>
                <div className="bg-[#d4af37]/10 group-hover:bg-[#d4af37]/20 p-1.5 sm:p-2 md:p-3 rounded-full transition-all duration-300 flex-shrink-0">
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#d4af37] group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-pink-50 to-white rounded-lg sm:rounded-xl border border-pink-200/50">
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{timelineStats.eventBlocks} Events</span>
                </div>
                <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-50 to-white rounded-lg sm:rounded-xl border border-purple-200/50">
                  <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{timelineStats.bufferBlocks} Puffer</span>
                </div>
                {timelineStats.totalDuration > 0 && (
                  <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-[#d4af37]/10 to-[#f4d03f]/10 rounded-lg sm:rounded-xl border border-[#d4af37]/20">
                    <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">{Math.round(timelineStats.totalDuration / 60)}h Dauer</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Bottom Connector */}
      <div className="relative flex items-center justify-center py-4">
        <div className="w-full max-w-xs h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent rounded-full shadow-gold"></div>
        <div className="absolute left-1/2 -translate-x-1/2 bg-gradient-to-br from-[#d4af37] to-[#f4d03f] rounded-full p-3 shadow-gold-lg">
          <Star className="w-6 h-6 text-white fill-current animate-pulse" />
        </div>
      </div>
    </div>
  );
}
