import { useState } from 'react';
import { Download, Database, FileText, Users, DollarSign, FileDown, Lock, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DataExportProps {
  weddingId: string;
}

export default function DataExport({ weddingId }: DataExportProps) {
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

  const handleExportGuests = async () => {
    setExporting(true);
    try {
      const { data } = await supabase
        .from('guests')
        .select('name, email, phone, rsvp_status, plus_one, dietary_restrictions, table_number')
        .eq('wedding_id', weddingId);

      if (data) {
        exportToCSV(
          data,
          'gaesteliste',
          ['name', 'email', 'phone', 'rsvp_status', 'plus_one', 'dietary_restrictions', 'table_number']
        );
      }
    } catch (error) {
      console.error('Error exporting guests:', error);
      alert('Fehler beim Exportieren');
    } finally {
      setExporting(false);
    }
  };

  const handleExportTasks = async () => {
    setExporting(true);
    try {
      const { data } = await supabase
        .from('tasks')
        .select('title, category, assigned_to, due_date, status, priority, notes')
        .eq('wedding_id', weddingId);

      if (data) {
        exportToCSV(
          data,
          'aufgaben',
          ['title', 'category', 'assigned_to', 'due_date', 'status', 'priority', 'notes']
        );
      }
    } catch (error) {
      console.error('Error exporting tasks:', error);
      alert('Fehler beim Exportieren');
    } finally {
      setExporting(false);
    }
  };

  const handleExportBudget = async () => {
    setExporting(true);
    try {
      const { data } = await supabase
        .from('budget_items')
        .select('category, item_name, actual_cost, paid')
        .eq('wedding_id', weddingId);

      if (data) {
        exportToCSV(data, 'budget', ['category', 'item_name', 'actual_cost', 'paid']);
      }
    } catch (error) {
      console.error('Error exporting budget:', error);
      alert('Fehler beim Exportieren');
    } finally {
      setExporting(false);
    }
  };

  const handleExportVendors = async () => {
    setExporting(true);
    try {
      const { data } = await supabase
        .from('vendors')
        .select('name, category, email, phone, website, contact_name, total_cost, contract_status, notes')
        .eq('wedding_id', weddingId);

      if (data) {
        exportToCSV(
          data,
          'dienstleister',
          ['name', 'category', 'email', 'phone', 'website', 'contact_name', 'total_cost', 'contract_status', 'notes']
        );
      }
    } catch (error) {
      console.error('Error exporting vendors:', error);
      alert('Fehler beim Exportieren');
    } finally {
      setExporting(false);
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const [weddingData, tasksData, budgetData, guestsData, timelineData] = await Promise.all([
        supabase.from('weddings').select('*').eq('id', weddingId).maybeSingle(),
        supabase.from('tasks').select('*').eq('wedding_id', weddingId),
        supabase.from('budget_items').select('*').eq('wedding_id', weddingId),
        supabase.from('guests').select('*').eq('wedding_id', weddingId),
        supabase.from('wedding_day_blocks').select('*').eq('wedding_id', weddingId).order('sort_order', { ascending: true }),
      ]);

      const exportData = {
        wedding: weddingData.data,
        tasks: tasksData.data || [],
        budget: budgetData.data || [],
        guests: guestsData.data || [],
        wedding_day_timeline: timelineData.data || [],
        exported_at: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `hochzeit-vollexport-${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting all data:', error);
      alert('Fehler beim Exportieren');
    } finally {
      setExporting(false);
    }
  };

  const handleExportGuestsPDF = async () => {

    setExporting(true);
    try {
      const { data } = await supabase
        .from('guests')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('name');

      if (data) {
        const htmlContent = generateGuestListHTML(data);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (error) {
      console.error('Error exporting guests PDF:', error);
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

  const handleExportTimelinePDF = async () => {

    setExporting(true);
    try {
      const { data } = await supabase
        .from('wedding_day_blocks')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('sort_order', { ascending: true });

      if (data) {
        const htmlContent = generateTimelineHTML(data);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (error) {
      console.error('Error exporting timeline PDF:', error);
      alert('Fehler beim Exportieren');
    } finally {
      setExporting(false);
    }
  };

  const generateGuestListHTML = (guests: any[]) => {
    const totalGuests = guests.length;
    const accepted = guests.filter(g => g.rsvp_status === 'accepted').length;
    const declined = guests.filter(g => g.rsvp_status === 'declined').length;
    const pending = guests.filter(g => g.rsvp_status === 'planned' || g.rsvp_status === 'invited').length;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Gästeliste</title>
        <style>
          @page { margin: 2cm; }
          body { font-family: Arial, sans-serif; color: #0a253c; }
          h1 { color: #d4af37; text-align: center; margin-bottom: 10px; }
          .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
          .stats { display: flex; justify-content: space-around; margin-bottom: 30px; padding: 20px; background: #f7f2eb; border-radius: 10px; }
          .stat { text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #0a253c; }
          .stat-label { font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #d4af37; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .status-accepted { color: #10b981; font-weight: bold; }
          .status-declined { color: #ef4444; font-weight: bold; }
          .status-pending { color: #f59e0b; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Gästeliste</h1>
        <div class="subtitle">Erstellt am ${new Date().toLocaleDateString('de-DE')}</div>

        <div class="stats">
          <div class="stat">
            <div class="stat-value">${totalGuests}</div>
            <div class="stat-label">Gesamt</div>
          </div>
          <div class="stat">
            <div class="stat-value">${accepted}</div>
            <div class="stat-label">Zugesagt</div>
          </div>
          <div class="stat">
            <div class="stat-value">${pending}</div>
            <div class="stat-label">Ausstehend</div>
          </div>
          <div class="stat">
            <div class="stat-value">${declined}</div>
            <div class="stat-label">Abgesagt</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Telefon</th>
              <th>Status</th>
              <th>Tischnummer</th>
            </tr>
          </thead>
          <tbody>
            ${guests.map(guest => `
              <tr>
                <td>${guest.name}</td>
                <td>${guest.email || '-'}</td>
                <td>${guest.phone || '-'}</td>
                <td class="status-${guest.rsvp_status === 'accepted' ? 'accepted' : guest.rsvp_status === 'declined' ? 'declined' : 'pending'}">
                  ${guest.rsvp_status === 'planned' ? 'Geplant' :
                    guest.rsvp_status === 'invited' ? 'Eingeladen' :
                    guest.rsvp_status === 'accepted' ? 'Zugesagt' : 'Abgesagt'}
                </td>
                <td>${guest.table_number || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Traumtaghelden Premium - Hochzeitsplanung ohne Limits
        </div>
      </body>
      </html>
    `;
  };

  const generateBudgetHTML = (items: any[]) => {
    const totalActual = items.reduce((sum, item) => sum + item.actual_cost, 0);
    const totalPaid = items.filter(item => item.paid).reduce((sum, item) => sum + item.actual_cost, 0);

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
          .category-header { background: #d4af37; color: white; padding: 10px; font-weight: bold; text-transform: capitalize; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f7f2eb; padding: 8px; text-align: left; font-size: 12px; }
          td { padding: 8px; border-bottom: 1px solid #ddd; font-size: 14px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          .paid { color: #10b981; }
          .unpaid { color: #ef4444; }
        </style>
      </head>
      <body>
        <h1>Budget-Übersicht</h1>
        <div class="subtitle">Erstellt am ${new Date().toLocaleDateString('de-DE')}</div>

        <div class="stats">
          <div class="stat">
            <div class="stat-value">${totalActual.toLocaleString('de-DE')} €</div>
            <div class="stat-label">Gesamtkosten</div>
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
                  <th>Kosten</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${categoryItems.map(item => `
                  <tr>
                    <td>${item.item_name}</td>
                    <td>${item.actual_cost.toLocaleString('de-DE')} €</td>
                    <td class="${item.paid ? 'paid' : 'unpaid'}">${item.paid ? 'Bezahlt' : 'Offen'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}

        <div class="footer">
          Traumtaghelden Premium - Hochzeitsplanung ohne Limits
        </div>
      </body>
      </html>
    `;
  };

  const generateTimelineHTML = (events: any[]) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Hochzeits-Timeline</title>
        <style>
          @page { margin: 2cm; }
          body { font-family: Arial, sans-serif; color: #0a253c; }
          h1 { color: #d4af37; text-align: center; margin-bottom: 10px; }
          .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
          .timeline { position: relative; padding-left: 30px; }
          .event { margin-bottom: 20px; page-break-inside: avoid; }
          .event-time { font-weight: bold; color: #d4af37; margin-bottom: 5px; }
          .event-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .event-details { color: #666; font-size: 14px; }
          .event-description { margin-top: 5px; line-height: 1.5; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          .buffer { background: #f7f2eb; padding: 10px; border-left: 4px solid #d4af37; }
        </style>
      </head>
      <body>
        <h1>Hochzeits-Timeline</h1>
        <div class="subtitle">Erstellt am ${new Date().toLocaleDateString('de-DE')}</div>

        <div class="timeline">
          ${events.map(event => `
            <div class="event ${event.is_buffer ? 'buffer' : ''}">
              <div class="event-time">${new Date('2000-01-01T' + event.time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div>
              <div class="event-title">${event.title}</div>
              <div class="event-details">
                ${event.location ? `📍 ${event.location}` : ''}
                ${event.duration_minutes ? ` · ⏱ ${event.duration_minutes} Minuten` : ''}
                ${event.is_buffer ? ' · Puffer' : ''}
              </div>
              ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="footer">
          Traumtaghelden Premium - Hochzeitsplanung ohne Limits
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">Daten exportieren</h3>
        <p className="text-gray-300">Exportiere deine Hochzeitsdaten für Backups oder zur Verwendung in anderen Tools</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <button
          onClick={handleExportGuests}
          disabled={exporting}
          className="flex items-center gap-4 p-6 bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl border border-[#d4af37]/10 hover:border-[#d4af37]/40 hover:shadow-xl hover:shadow-[#d4af37]/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="bg-gradient-to-r from-[#d4af37] to-[#c19a2e] w-14 h-14 rounded-xl flex items-center justify-center shadow-lg">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div className="text-left flex-1">
            <h4 className="font-bold text-gray-900 mb-1 text-lg">Gästeliste CSV</h4>
            <p className="text-sm text-gray-600">CSV-Datei mit allen Gästen</p>
          </div>
          <Download className="w-5 h-5 text-[#d4af37]" />
        </button>

        <button
          onClick={handleExportTasks}
          disabled={exporting}
          className="flex items-center gap-4 p-6 bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl border border-[#d4af37]/10 hover:border-[#d4af37]/40 hover:shadow-xl hover:shadow-[#d4af37]/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="bg-gradient-to-r from-[#d4af37] to-[#c19a2e] w-14 h-14 rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div className="text-left flex-1">
            <h4 className="font-bold text-gray-900 mb-1 text-lg">Aufgaben CSV</h4>
            <p className="text-sm text-gray-600">CSV-Datei mit allen Aufgaben</p>
          </div>
          <Download className="w-5 h-5 text-[#d4af37]" />
        </button>

        <button
          onClick={handleExportVendors}
          disabled={exporting}
          className="flex items-center gap-4 p-6 bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl border border-[#d4af37]/10 hover:border-[#d4af37]/40 hover:shadow-xl hover:shadow-[#d4af37]/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="bg-gradient-to-r from-[#d4af37] to-[#c19a2e] w-14 h-14 rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div className="text-left flex-1">
            <h4 className="font-bold text-gray-900 mb-1 text-lg">Dienstleister CSV</h4>
            <p className="text-sm text-gray-600">CSV-Datei mit allen Dienstleistern</p>
          </div>
          <Download className="w-5 h-5 text-[#d4af37]" />
        </button>

        <button
          onClick={handleExportBudget}
          disabled={exporting}
          className="flex items-center gap-4 p-6 bg-gradient-to-br from-white to-[#f7f2eb]/30 rounded-xl border border-[#d4af37]/10 hover:border-[#d4af37]/40 hover:shadow-xl hover:shadow-[#d4af37]/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="bg-gradient-to-r from-[#d4af37] to-[#c19a2e] w-14 h-14 rounded-xl flex items-center justify-center shadow-lg">
            <DollarSign className="w-7 h-7 text-white" />
          </div>
          <div className="text-left flex-1">
            <h4 className="font-bold text-gray-900 mb-1 text-lg">Budget CSV</h4>
            <p className="text-sm text-gray-600">CSV-Datei mit Budget-Details</p>
          </div>
          <Download className="w-5 h-5 text-[#d4af37]" />
        </button>
      </div>
    </div>
  );
}
