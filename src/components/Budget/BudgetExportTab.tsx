import { useState } from 'react';
import { Download, FileDown, FileText, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BudgetExportTabProps {
  weddingId: string;
}

export default function BudgetExportTab({ weddingId }: BudgetExportTabProps) {
  const [exporting, setExporting] = useState(false);

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const rows = data.map((item) => headers.map((h) => `"${item[h] || ''}"`).join(','));
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportBudgetCSV = async () => {
    setExporting(true);
    try {
      const { data } = await supabase
        .from('budget_items')
        .select('category, item_name, actual_cost, payment_status, paid, notes')
        .eq('wedding_id', weddingId);

      if (data) {
        exportToCSV(
          data,
          'budget-export',
          ['category', 'item_name', 'actual_cost', 'payment_status', 'paid', 'notes']
        );
      }
    } catch (error) {
      console.error('Error exporting budget:', error);
      alert('Fehler beim Exportieren');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCategoriesCSV = async () => {
    setExporting(true);
    try {
      const { data } = await supabase
        .from('budget_categories')
        .select('name, allocated_budget, color, icon, description')
        .eq('wedding_id', weddingId);

      if (data) {
        exportToCSV(
          data,
          'budget-kategorien',
          ['name', 'allocated_budget', 'color', 'icon', 'description']
        );
      }
    } catch (error) {
      console.error('Error exporting categories:', error);
      alert('Fehler beim Exportieren');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPaymentsCSV = async () => {
    setExporting(true);
    try {
      const { data } = await supabase
        .from('budget_payments')
        .select(`
          amount,
          due_date,
          status,
          payment_method,
          notes,
          budget_item_id
        `)
        .eq('wedding_id', weddingId);

      if (data) {
        exportToCSV(
          data,
          'budget-zahlungen',
          ['amount', 'due_date', 'status', 'payment_method', 'notes']
        );
      }
    } catch (error) {
      console.error('Error exporting payments:', error);
      alert('Fehler beim Exportieren');
    } finally {
      setExporting(false);
    }
  };

  const handleExportBudgetPDF = async () => {
    setExporting(true);
    try {
      const { data } = await supabase
        .from('budget_items')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('category');

      if (data) {
        const htmlContent = generateBudgetHTML(data);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (error) {
      console.error('Error exporting budget PDF:', error);
      alert('Fehler beim Exportieren');
    } finally {
      setExporting(false);
    }
  };

  const generateBudgetHTML = (items: any[]) => {
    const totalEstimated = items.reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
    const totalActual = items.reduce((sum, item) => sum + (item.actual_cost || 0), 0);
    const totalPaid = items.filter(item => item.payment_status === 'paid').reduce((sum, item) => sum + (item.actual_cost || 0), 0);

    const categoryGroups = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Budget-Übersicht</title>
        <style>
          @page { margin: 2cm; }
          body { font-family: Arial, sans-serif; color: #0a253c; }
          h1 { color: #d4af37; text-align: center; margin-bottom: 10px; }
          .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
          .stats { display: flex; justify-content: space-around; margin-bottom: 30px; padding: 20px; background: #f7f2eb; border-radius: 10px; }
          .stat { text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #0a253c; }
          .stat-label { font-size: 12px; color: #666; }
          .category { margin-bottom: 30px; page-break-inside: avoid; }
          .category-header { background: #d4af37; color: white; padding: 10px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f7f2eb; padding: 8px; text-align: left; font-size: 12px; }
          td { padding: 8px; border-bottom: 1px solid #ddd; font-size: 14px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          .status-paid { color: #10b981; font-weight: bold; }
          .status-pending { color: #f59e0b; font-weight: bold; }
          .status-overdue { color: #ef4444; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Budget-Übersicht</h1>
        <div class="subtitle">Erstellt am ${new Date().toLocaleDateString('de-DE')}</div>

        <div class="stats">
          <div class="stat">
            <div class="stat-value">${totalEstimated.toLocaleString('de-DE')} €</div>
            <div class="stat-label">Geplant</div>
          </div>
          <div class="stat">
            <div class="stat-value">${totalActual.toLocaleString('de-DE')} €</div>
            <div class="stat-label">Tatsächlich</div>
          </div>
          <div class="stat">
            <div class="stat-value">${totalPaid.toLocaleString('de-DE')} €</div>
            <div class="stat-label">Bezahlt</div>
          </div>
          <div class="stat">
            <div class="stat-value">${(totalActual - totalPaid).toLocaleString('de-DE')} €</div>
            <div class="stat-label">Offen</div>
          </div>
        </div>

        ${Object.entries(categoryGroups).map(([category, categoryItems]) => `
          <div class="category">
            <div class="category-header">${category}</div>
            <table>
              <thead>
                <tr>
                  <th>Posten</th>
                  <th>Geplant</th>
                  <th>Tatsächlich</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${categoryItems.map(item => `
                  <tr>
                    <td>${item.item_name}</td>
                    <td>${(item.estimated_cost || 0).toLocaleString('de-DE')} €</td>
                    <td>${(item.actual_cost || 0).toLocaleString('de-DE')} €</td>
                    <td class="status-${item.payment_status}">
                      ${item.payment_status === 'paid' ? 'Bezahlt' :
                        item.payment_status === 'pending' ? 'Ausstehend' :
                        item.payment_status === 'overdue' ? 'Überfällig' : 'Nicht bezahlt'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}

        <div class="footer">
          Hochzeitsplaner - Budget-Export vom ${new Date().toLocaleDateString('de-DE')}
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-white">Budget exportieren</h3>
        <p className="text-gray-300 mt-1">Exportiere deine Budget-Daten für Backups oder externe Nutzung</p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <Download className="w-8 h-8 text-blue-600" />
          <div>
            <h4 className="text-xl font-bold text-[#0a253c]">CSV-Exporte</h4>
            <p className="text-sm text-[#666666]">Exportiere deine Daten als CSV-Dateien</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={handleExportBudgetCSV}
            disabled={exporting}
            className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border-2 border-[#d4af37]/30 hover:border-[#d4af37] hover:shadow-lg transition-all disabled:opacity-50"
          >
            <div className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] w-14 h-14 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div className="text-center">
              <h5 className="font-bold text-[#0a253c] mb-1">Budget-Posten</h5>
              <p className="text-xs text-[#666666]">Alle Einträge als CSV</p>
            </div>
          </button>

          <button
            onClick={handleExportCategoriesCSV}
            disabled={exporting}
            className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border-2 border-[#d4af37]/30 hover:border-[#d4af37] hover:shadow-lg transition-all disabled:opacity-50"
          >
            <div className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] w-14 h-14 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div className="text-center">
              <h5 className="font-bold text-[#0a253c] mb-1">Kategorien</h5>
              <p className="text-xs text-[#666666]">Kategorien als CSV</p>
            </div>
          </button>

          <button
            onClick={handleExportPaymentsCSV}
            disabled={exporting}
            className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border-2 border-[#d4af37]/30 hover:border-[#d4af37] hover:shadow-lg transition-all disabled:opacity-50"
          >
            <div className="bg-gradient-to-r from-[#d4af37] to-[#f4d03f] w-14 h-14 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div className="text-center">
              <h5 className="font-bold text-[#0a253c] mb-1">Zahlungen</h5>
              <p className="text-xs text-[#666666]">Zahlungsplan als CSV</p>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <FileDown className="w-8 h-8 text-[#d4af37]" />
          <div>
            <h4 className="text-xl font-bold text-[#0a253c]">PDF-Export</h4>
            <p className="text-sm text-[#666666]">Druckbare Übersicht deines Budgets</p>
          </div>
        </div>

        <button
          onClick={handleExportBudgetPDF}
          disabled={exporting}
          className="w-full flex items-center justify-between gap-4 p-6 bg-gradient-to-br from-[#0a253c] to-[#1a3a5c] rounded-xl hover:shadow-xl transition-all disabled:opacity-50"
        >
          <div className="flex items-center gap-4">
            <div className="bg-[#d4af37] w-12 h-12 rounded-xl flex items-center justify-center">
              <FileDown className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h5 className="font-bold text-white mb-1">Budget als PDF drucken</h5>
              <p className="text-sm text-white/70">Vollständige Übersicht mit allen Kategorien</p>
            </div>
          </div>
          <Download className="w-6 h-6 text-[#d4af37]" />
        </button>
      </div>

      <div className="bg-gradient-to-br from-[#0a253c] to-[#1a3a5c] rounded-2xl p-8 text-center">
        <Lock className="w-20 h-20 text-[#d4af37] mx-auto mb-4" />
        <h4 className="text-2xl font-bold text-white mb-2">Erweiterte Export-Optionen</h4>
        <p className="text-white/70 mb-6">
          Excel-Export, automatische Backups und mehr mit Premium
        </p>
        <div className="inline-block px-6 py-3 bg-[#d4af37]/20 text-[#d4af37] rounded-xl font-bold">
          Premium Feature
        </div>
      </div>
    </div>
  );
}
