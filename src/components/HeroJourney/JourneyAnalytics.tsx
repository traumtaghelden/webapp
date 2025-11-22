import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, CheckCircle, AlertTriangle, Calendar, Target, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

interface JourneyAnalyticsProps {
  weddingId: string;
  completedSteps: string[];
  totalSteps: number;
}

interface TimelineData {
  stepId: string;
  stepName: string;
  completedAt: string | null;
  daysToComplete?: number;
}

interface Insight {
  type: 'success' | 'warning' | 'info';
  icon: React.ElementType;
  title: string;
  message: string;
}

export default function JourneyAnalytics({ weddingId, completedSteps, totalSteps }: JourneyAnalyticsProps) {
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [weddingDate, setWeddingDate] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [weddingId, completedSteps]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Load progress data from database
      const { data: progressData, error: progressError } = await supabase
        .from('hero_journey_progress')
        .select('phase_id, completed_at, created_at')
        .eq('wedding_id', weddingId)
        .eq('status', 'completed');

      if (progressError) {
        logger.error('Error loading progress data', 'JourneyAnalytics', progressError);
      }

      // Load wedding date
      const { data: weddingData, error: weddingError } = await supabase
        .from('weddings')
        .select('wedding_date, created_at')
        .eq('id', weddingId)
        .maybeSingle();

      if (weddingError) {
        logger.error('Error loading wedding data', 'JourneyAnalytics', weddingError);
      }

      if (weddingData) {
        setWeddingDate(weddingData.wedding_date);
      }

      // Process timeline data
      if (progressData) {
        const processed = progressData.map(item => {
          const created = new Date(item.created_at || '');
          const completed = item.completed_at ? new Date(item.completed_at) : null;
          const daysToComplete = completed
            ? Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
            : undefined;

          return {
            stepId: item.phase_id,
            stepName: getStepName(item.phase_id),
            completedAt: item.completed_at,
            daysToComplete
          };
        });

        setTimelineData(processed);
      }

      // Generate insights
      generateInsights(progressData || [], weddingData);

    } catch (error) {
      logger.error('Error in loadAnalyticsData', 'JourneyAnalytics', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepName = (stepId: string): string => {
    const names: { [key: string]: string } = {
      vision: 'Vision',
      budget: 'Budget',
      guest_count: 'Gästezahl',
      location: 'Location',
      ceremony: 'Trauung',
      date: 'Datum',
      personality: 'Stil',
      timeline: 'Timeline',
      personal_planning: 'Persönliche Planung'
    };
    return names[stepId] || stepId;
  };

  const generateInsights = (progressData: any[], weddingData: any) => {
    const newInsights: Insight[] = [];
    const completionRate = (completedSteps.length / totalSteps) * 100;

    // Completion rate insight
    if (completionRate >= 75) {
      newInsights.push({
        type: 'success',
        icon: Target,
        title: 'Ausgezeichneter Fortschritt!',
        message: `Ihr habt bereits ${completionRate.toFixed(0)}% der Planungsschritte abgeschlossen. Ihr seid auf einem fantastischen Weg!`
      });
    } else if (completionRate >= 50) {
      newInsights.push({
        type: 'info',
        icon: TrendingUp,
        title: 'Guter Fortschritt',
        message: `${completionRate.toFixed(0)}% abgeschlossen. Ihr macht tolle Fortschritte! Bleibt dran!`
      });
    } else if (completionRate >= 25) {
      newInsights.push({
        type: 'info',
        icon: Zap,
        title: 'Solider Start',
        message: `${completionRate.toFixed(0)}% geschafft. Ein guter Anfang! Nehmt euch Zeit für die nächsten Schritte.`
      });
    } else {
      newInsights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Legt los!',
        message: 'Die Reise beginnt! Startet am besten mit eurer Vision und dem Budget.'
      });
    }

    // Wedding date insight
    if (weddingData?.wedding_date) {
      const daysUntilWedding = Math.ceil(
        (new Date(weddingData.wedding_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilWedding < 180 && completionRate < 75) {
        newInsights.push({
          type: 'warning',
          icon: Clock,
          title: 'Zeit ist knapp',
          message: `Noch ${daysUntilWedding} Tage bis zur Hochzeit. Konzentriert euch auf die wichtigsten Schritte!`
        });
      } else if (daysUntilWedding > 365) {
        newInsights.push({
          type: 'info',
          icon: Calendar,
          title: 'Viel Zeit',
          message: `Über ${Math.floor(daysUntilWedding / 30)} Monate bis zum großen Tag. Perfekt für entspannte Planung!`
        });
      }
    }

    // Momentum insight
    const recentCompletions = progressData.filter(p => {
      if (!p.completed_at) return false;
      const daysSince = Math.ceil(
        (new Date().getTime() - new Date(p.completed_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSince <= 14;
    });

    if (recentCompletions.length >= 3) {
      newInsights.push({
        type: 'success',
        icon: Zap,
        title: 'Toller Schwung!',
        message: `${recentCompletions.length} Schritte in den letzten 2 Wochen abgeschlossen. Ihr rockt das!`
      });
    } else if (recentCompletions.length === 0 && completedSteps.length > 0) {
      newInsights.push({
        type: 'info',
        icon: TrendingUp,
        title: 'Macht weiter!',
        message: 'Schon eine Weile nichts mehr abgeschlossen. Welcher Schritt wäre als nächstes sinnvoll?'
      });
    }

    setInsights(newInsights);
  };

  const getProgressColor = () => {
    const rate = (completedSteps.length / totalSteps) * 100;
    if (rate >= 75) return 'from-green-500 to-green-600';
    if (rate >= 50) return 'from-blue-500 to-blue-600';
    if (rate >= 25) return 'from-yellow-500 to-yellow-600';
    return 'from-orange-500 to-orange-600';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl p-6 border border-[#d4af37]/20">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Insights Cards */}
      {insights.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {insights.map((insight, idx) => {
            const Icon = insight.icon;
            const colors = {
              success: 'from-green-500 to-green-600',
              warning: 'from-orange-500 to-orange-600',
              info: 'from-blue-500 to-blue-600'
            };
            const bgColors = {
              success: 'bg-green-50',
              warning: 'bg-orange-50',
              info: 'bg-blue-50'
            };

            return (
              <div
                key={idx}
                className={`${bgColors[insight.type]} rounded-xl p-5 border border-${insight.type === 'success' ? 'green' : insight.type === 'warning' ? 'orange' : 'blue'}-200 transition-all hover:shadow-lg hover:scale-[1.02]`}
              >
                <div className="flex items-start gap-3">
                  <div className={`bg-gradient-to-br ${colors[insight.type]} p-2.5 rounded-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{insight.title}</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{insight.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Overview */}
      <div className="bg-gradient-to-br from-white to-[#f7f2eb]/50 rounded-xl p-6 border border-[#d4af37]/20">
        <div className="flex items-center gap-3 mb-6">
          <div className={`bg-gradient-to-br ${getProgressColor()} p-3 rounded-lg`}>
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Euer Planungsfortschritt</h3>
            <p className="text-sm text-gray-600">Detaillierte Einblicke in eure Hero Journey</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-gray-600">Abgeschlossen</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{completedSteps.length}</p>
            <p className="text-xs text-gray-500">von {totalSteps} Schritten</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-600">Prozent</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round((completedSteps.length / totalSteps) * 100)}%
            </p>
            <p className="text-xs text-gray-500">Gesamt-Fortschritt</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-medium text-gray-600">Verbleibend</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalSteps - completedSteps.length}</p>
            <p className="text-xs text-gray-500">Schritte offen</p>
          </div>

          {weddingDate && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-gray-600">Tage bis</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.max(0, Math.ceil((new Date(weddingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
              </p>
              <p className="text-xs text-gray-500">Hochzeitstag</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        {timelineData.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#d4af37]" />
              Abgeschlossene Schritte
            </h4>
            <div className="space-y-3">
              {timelineData
                .sort((a, b) => {
                  if (!a.completedAt || !b.completedAt) return 0;
                  return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
                })
                .slice(0, 5)
                .map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="bg-gradient-to-br from-[#d4af37] to-[#c19a2e] p-2 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.stepName}</p>
                      {item.completedAt && (
                        <p className="text-xs text-gray-500">
                          {new Date(item.completedAt).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                    {item.daysToComplete !== undefined && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-600">{item.daysToComplete}</p>
                        <p className="text-xs text-gray-500">Tage</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
