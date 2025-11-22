import { useState, useEffect } from 'react';
import { LayoutGrid, FolderTree, Calendar, BarChart3, History, Download, Wallet, DollarSign, TrendingDown, AlertCircle, Plus } from 'lucide-react';
import { supabase, type BudgetItem, type BudgetCategory } from '../lib/supabase';
import { BUDGET, COMMON } from '../constants/terminology';
import TabNavigation, { type Tab } from './common/TabNavigation';
import PageHeaderWithStats, { type StatCard } from './common/PageHeaderWithStats';
import BudgetOverviewTab from './Budget/BudgetOverviewTab';
import BudgetCategoriesTab from './Budget/BudgetCategoriesTab';
import BudgetPaymentsTab from './Budget/BudgetPaymentsTab';
import BudgetAnalysisTab from './Budget/BudgetAnalysisTab';
import BudgetHistoryTab from './Budget/BudgetHistoryTab';
import BudgetExportTab from './Budget/BudgetExportTab';
import BudgetAdjustModal from './Budget/BudgetAdjustModal';
import BudgetEntryWizard from './Budget/BudgetEntryWizard';
import CategoryWizard from './Budget/CategoryWizard';
import BudgetDetailModal from './BudgetDetailModal';
import ModalConfirm from './ModalConfirm';
import FAB from './common/FAB';
import { useToast } from '../contexts/ToastContext';

interface BudgetManagerProps {
  weddingId: string;
  budgetItems: BudgetItem[];
  totalBudget: number;
  onUpdate: () => void;
}

type BudgetTab = 'overview' | 'categories' | 'payments' | 'analysis' | 'history' | 'export';

export default function BudgetManager({ weddingId, budgetItems, totalBudget, onUpdate }: BudgetManagerProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<BudgetTab>('overview');
  const [showEntryWizard, setShowEntryWizard] = useState(false);
  const [showCategoryWizard, setShowCategoryWizard] = useState(false);
  const [showBudgetAdjust, setShowBudgetAdjust] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [enrichedItems, setEnrichedItems] = useState<BudgetItem[]>([]);

  // URL parameter handling for prefill
  const [prefillVendorId, setPrefillVendorId] = useState<string | undefined>();
  const [prefillVendorName, setPrefillVendorName] = useState<string | undefined>();
  const [prefillLocationId, setPrefillLocationId] = useState<string | undefined>();
  const [prefillLocationName, setPrefillLocationName] = useState<string | undefined>();

  const tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Übersicht',
      icon: <LayoutGrid className="w-4 h-4" />,
      badge: budgetItems.length,
    },
    {
      id: 'categories',
      label: 'Kategorien',
      icon: <FolderTree className="w-4 h-4" />,
      badge: categories.length,
    },
    {
      id: 'analysis',
      label: 'Analyse',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'history',
      label: 'Verlauf',
      icon: <History className="w-4 h-4" />,
    },
    {
      id: 'export',
      label: 'Export',
      icon: <Download className="w-4 h-4" />,
    },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        onUpdate(),
        loadCategories()
      ]);
      showToast('Budget aktualisiert', 'success');
    } catch (error) {
      console.error('Error refreshing:', error);
      showToast('Fehler beim Aktualisieren', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };


  useEffect(() => {
    loadCategories();
    checkForHeroJourneyTemplate();
    checkURLParameters();
  }, [weddingId]);

  useEffect(() => {
    enrichBudgetItems();
  }, [budgetItems, categories]);

  const checkURLParameters = async () => {
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(hash.split('?')[1] || '');

    const action = urlParams.get('action');
    const vendorId = urlParams.get('vendor_id');
    const locationId = urlParams.get('location_id');

    if (action === 'create' && (vendorId || locationId)) {
      if (vendorId) {
        // Load vendor name
        const { data: vendor } = await supabase
          .from('vendors')
          .select('name')
          .eq('id', vendorId)
          .maybeSingle();

        if (vendor) {
          setPrefillVendorId(vendorId);
          setPrefillVendorName(vendor.name);
          setShowEntryWizard(true);
          showToast(`Budget-Posten für ${vendor.name} erstellen`, 'info');
        }
      } else if (locationId) {
        // Load location name
        const { data: location } = await supabase
          .from('locations')
          .select('name')
          .eq('id', locationId)
          .maybeSingle();

        if (location) {
          setPrefillLocationId(locationId);
          setPrefillLocationName(location.name);
          setShowEntryWizard(true);
          showToast(`Budget-Posten für ${location.name} erstellen`, 'info');
        }
      }

      // Clean up URL parameters after processing
      window.history.replaceState(null, '', '#budget');
    }
  };

  const checkForHeroJourneyTemplate = () => {
    const templateData = sessionStorage.getItem('hero_journey_template_budget');
    if (templateData) {
      try {
        const template = JSON.parse(templateData);
        sessionStorage.removeItem('hero_journey_template_budget');

        // Show template suggestion
        showToast(
          `Vorlage "${template.template_name}" geladen! Budget-Empfehlung: ${template.budget_min ? `€${template.budget_min.toLocaleString()} - €${template.budget_max?.toLocaleString()}` : 'Individuell'}`,
          'success'
        );

        // Auto-open entry wizard with template data
        if (template.sample_data?.categories) {
          setShowEntryWizard(true);
        }
      } catch (error) {
        console.error('Error parsing template:', error);
      }
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const enrichBudgetItems = async () => {
    try {
      const itemsWithDetails = await Promise.all(
        budgetItems.map(async item => {
          const { data: payments } = await supabase
            .from('budget_payments')
            .select('*')
            .eq('budget_item_id', item.id)
            .order('due_date', { ascending: true });

          const category = categories.find(c => c.name === item.category);

          return {
            ...item,
            budget_payments: payments || [],
            budget_category: category,
          };
        })
      );

      setEnrichedItems(itemsWithDetails);
    } catch (error) {
      console.error('Error enriching budget items:', error);
      setEnrichedItems(budgetItems);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      console.log('Deleting budget item:', itemId);

      // CASCADE foreign keys handle deletion of related records
      const { error } = await supabase
        .from('budget_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Delete error:', error);
        showToast(`Fehler beim Löschen: ${error.message}`, 'error');
        return;
      }

      console.log('Budget item deleted successfully');
      showToast('Budget-Posten erfolgreich gelöscht', 'success');
      setShowDeleteConfirm(null);
      await onUpdate();
    } catch (error) {
      console.error('Error deleting budget item:', error);
      showToast('Fehler beim Löschen des Eintrags. Bitte versuchen Sie es erneut.', 'error');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase.from('budget_categories').delete().eq('id', categoryId);

      if (error) throw error;

      showToast('Kategorie erfolgreich gelöscht', 'success');
      setShowDeleteCategoryConfirm(null);
      loadCategories();
      onUpdate();
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast('Fehler beim Löschen der Kategorie', 'error');
    }
  };

  const handleSuccess = () => {
    onUpdate();
    loadCategories();
  };

  const calculateCategorySpending = () => {
    const spending: Record<string, { planned: number; actual: number; paid: number }> = {};

    categories.forEach(category => {
      spending[category.id] = {
        planned: category.budget_limit || 0,
        actual: 0,
        paid: 0
      };
    });

    enrichedItems.forEach(item => {
      const categoryId = item.budget_category?.id;
      if (categoryId && spending[categoryId]) {
        // Ausgegeben: Summe aller Budget-Posten (egal ob bezahlt oder offen)
        spending[categoryId].actual += item.estimated_cost || 0;
        // Davon bezahlt: nur wenn payment_status === 'paid'
        if (item.payment_status === 'paid') {
          spending[categoryId].paid += item.estimated_cost || 0;
        }
      }
    });

    return spending;
  };

  const calculateMonthlyDue = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return enrichedItems.reduce((sum, item) => {
      const payments = item.budget_payments || [];
      const monthlyPayments = payments.filter(payment => {
        if (payment.status === 'paid') return false;
        const dueDate = new Date(payment.due_date);
        return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
      });
      return sum + monthlyPayments.reduce((s, p) => s + p.amount, 0);
    }, 0);
  };

  const totalSpent = enrichedItems.reduce((sum, item) => sum + (item.actual_cost || 0), 0);
  const categorySpending = calculateCategorySpending();
  const monthlyDue = calculateMonthlyDue();
  const currentMonth = new Date().toLocaleDateString('de-DE', { month: 'long' });
  const remaining = totalBudget - totalSpent;
  const spentPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const stats: StatCard[] = [
    {
      icon: <Wallet className="w-6 h-6 text-white" />,
      label: 'Gesamtbudget',
      value: `${totalBudget.toLocaleString('de-DE')} €`,
      subtitle: `${budgetItems.length} Positionen`,
      color: 'yellow'
    },
    {
      icon: <DollarSign className="w-6 h-6 text-white" />,
      label: 'Ausgegeben',
      value: `${totalSpent.toLocaleString('de-DE')} €`,
      subtitle: `${spentPercentage}% des Budgets`,
      color: 'green'
    },
    {
      icon: <TrendingDown className="w-6 h-6 text-white" />,
      label: 'Verbleibend',
      value: `${remaining.toLocaleString('de-DE')} €`,
      subtitle: remaining >= 0 ? 'Im Budget' : 'Überzogen',
      color: 'blue'
    },
    {
      icon: <AlertCircle className="w-6 h-6 text-white" />,
      label: 'Überzogen',
      value: remaining < 0 ? `${Math.abs(remaining).toLocaleString('de-DE')} €` : '0 €',
      subtitle: remaining < 0 ? 'Budget überschritten' : 'Alles im Rahmen',
      color: 'red'
    }
  ];

  return (
    <div className="space-y-6 relative min-h-screen">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="bg-floating-orb" style={{ top: '10%', left: '5%' }} />
        <div className="bg-floating-orb" style={{ top: '60%', right: '10%', animationDelay: '4s' }} />
        <div className="bg-floating-orb" style={{ bottom: '20%', left: '15%', animationDelay: '8s' }} />

        <div className="bg-particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="bg-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                '--tx': `${(Math.random() - 0.5) * 100}px`,
                '--ty': `${-Math.random() * 150}px`
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10">

      <PageHeaderWithStats
        title={BUDGET.MODULE_NAME}
        subtitle="Behalte deine Hochzeitsausgaben im Blick"
        stats={stats}
      />

      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as BudgetTab)}
      />

      {activeTab === 'overview' && (
        <BudgetOverviewTab
          weddingId={weddingId}
          budgetItems={budgetItems}
          enrichedItems={enrichedItems}
          totalBudget={totalBudget}
          categories={categories}
          categorySpending={categorySpending}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onEditCategory={(category) => {
            setEditingCategory(category);
            setShowCategoryWizard(true);
          }}
          onAddEntry={() => setShowEntryWizard(true)}
          onAddCategory={() => setShowCategoryWizard(true)}
          onViewItem={(itemId) => setShowDetailModal(itemId)}
          onDeleteItem={(itemId) => setShowDeleteConfirm(itemId)}
          onUpdate={onUpdate}
        />
      )}

      {activeTab === 'categories' && (
        <BudgetCategoriesTab
          categories={categories}
          categorySpending={categorySpending}
          onEditCategory={(category) => {
            setEditingCategory(category);
            setShowCategoryWizard(true);
          }}
          onAddCategory={() => setShowCategoryWizard(true)}
          onDeleteCategory={(categoryId) => setShowDeleteCategoryConfirm(categoryId)}
        />
      )}

      {activeTab === 'payments' && (
        <BudgetPaymentsTab weddingId={weddingId} />
      )}

      {activeTab === 'analysis' && (
        <BudgetAnalysisTab
          weddingId={weddingId}
          budgetItems={budgetItems}
          totalBudget={totalBudget}
        />
      )}

      {activeTab === 'history' && (
        <BudgetHistoryTab weddingId={weddingId} />
      )}

      {activeTab === 'export' && (
        <BudgetExportTab weddingId={weddingId} />
      )}

      <BudgetEntryWizard
        isOpen={showEntryWizard}
        onClose={() => {
          setShowEntryWizard(false);
          setPrefillVendorId(undefined);
          setPrefillVendorName(undefined);
          setPrefillLocationId(undefined);
          setPrefillLocationName(undefined);
        }}
        onSuccess={handleSuccess}
        weddingId={weddingId}
        categories={categories}
        onCreateCategory={() => {
          setShowEntryWizard(false);
          setShowCategoryWizard(true);
        }}
        prefillVendorId={prefillVendorId}
        prefillVendorName={prefillVendorName}
        prefillLocationId={prefillLocationId}
        prefillLocationName={prefillLocationName}
      />

      <CategoryWizard
        isOpen={showCategoryWizard}
        onClose={() => {
          setShowCategoryWizard(false);
          setEditingCategory(null);
        }}
        onSuccess={() => {
          loadCategories();
          setEditingCategory(null);
          if (!showEntryWizard) {
            onUpdate();
          }
        }}
        weddingId={weddingId}
        existingCount={categories.length}
        editingCategory={editingCategory}
      />

      <BudgetAdjustModal
        isOpen={showBudgetAdjust}
        onClose={() => setShowBudgetAdjust(false)}
        weddingId={weddingId}
        currentBudget={totalBudget}
        onSuccess={onUpdate}
      />

      {showDetailModal && (
        <BudgetDetailModal
          isOpen={true}
          onClose={() => setShowDetailModal(null)}
          budgetItemId={showDetailModal}
          weddingId={weddingId}
          onUpdate={onUpdate}
        />
      )}

      {showDeleteConfirm && (
        <ModalConfirm
          isOpen={true}
          title={BUDGET.DELETE_ITEM}
          message={`Möchtest du diesen ${BUDGET.ITEM} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
          confirmText={COMMON.DELETE}
          cancelText={COMMON.CANCEL}
          onConfirm={() => handleDeleteItem(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
          variant="danger"
        />
      )}

      {showDeleteCategoryConfirm && (
        <ModalConfirm
          isOpen={true}
          title="Kategorie löschen"
          message="Möchtest du diese Kategorie wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
          confirmText={COMMON.DELETE}
          cancelText={COMMON.CANCEL}
          onConfirm={() => handleDeleteCategory(showDeleteCategoryConfirm)}
          onCancel={() => setShowDeleteCategoryConfirm(null)}
          variant="danger"
        />
      )}

      <FAB
        onClick={() => setShowEntryWizard(true)}
        icon={Plus}
        label="Budget hinzufügen"
        position="bottom-right"
        variant="primary"
        showOnMobile={true}
        showOnDesktop={false}
      />
      </div>
    </div>
  );
}
