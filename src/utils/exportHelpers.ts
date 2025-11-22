import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type Guest, type FamilyGroup, type GuestGroup } from '../lib/supabase';

export function generateCSV(headers: string[], rows: string[][]): string {
  const escapeCSV = (value: string | null | undefined): string => {
    if (!value) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  return csvContent;
}

export function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

export function generateDietaryExportCSV(
  guests: Guest[],
  includeOnlyConfirmed: boolean
): string {
  const filteredGuests = includeOnlyConfirmed
    ? guests.filter(g => g.rsvp_status === 'accepted')
    : guests;

  const headers = ['Name', 'Ernährungswünsche', 'RSVP-Status', 'Besondere Bedürfnisse'];

  const rows = filteredGuests.map(guest => {
    const restrictions = typeof guest.dietary_restrictions === 'string'
      ? guest.dietary_restrictions
      : '';

    return [
      guest.name,
      restrictions,
      guest.rsvp_status,
      guest.special_needs || ''
    ];
  });

  return generateCSV(headers, rows);
}

export function generateDietaryExportPDF(
  guests: Guest[],
  includeOnlyConfirmed: boolean,
  weddingDate?: string
): Blob {
  const filteredGuests = includeOnlyConfirmed
    ? guests.filter(g => g.rsvp_status === 'accepted')
    : guests;

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Ernährungswünsche & Allergien', 14, 20);

  doc.setFontSize(10);
  doc.text(`Erstellt am: ${formatDate(new Date())}`, 14, 28);
  if (weddingDate) {
    doc.text(`Hochzeitsdatum: ${formatDate(new Date(weddingDate))}`, 14, 33);
  }
  doc.text(`Anzahl Gäste: ${filteredGuests.length}`, 14, weddingDate ? 38 : 33);

  const tableData = filteredGuests.map(guest => {
    const restrictions = typeof guest.dietary_restrictions === 'string'
      ? guest.dietary_restrictions
      : '';

    return [
      guest.name,
      restrictions || '-',
      guest.rsvp_status === 'accepted' ? 'Zugesagt' :
      guest.rsvp_status === 'declined' ? 'Abgesagt' :
      guest.rsvp_status === 'invited' ? 'Eingeladen' : 'Geplant',
      guest.special_needs || '-'
    ];
  });

  autoTable(doc, {
    head: [['Name', 'Ernährungswünsche', 'Status', 'Besondere Bedürfnisse']],
    body: tableData,
    startY: weddingDate ? 43 : 38,
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { cellWidth: 30 },
      3: { cellWidth: 60 }
    },
    headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [247, 242, 235] }
  });

  return doc.output('blob');
}

export interface GroupedGuests {
  familyGroups: Array<{ group: FamilyGroup; guests: Guest[] }>;
  guestGroups: Array<{ group: GuestGroup; guests: Guest[] }>;
  ungroupedGuests: Guest[];
}

export function groupGuestsByFamilyAndGroup(
  guests: Guest[],
  familyGroups: FamilyGroup[],
  guestGroups: GuestGroup[]
): GroupedGuests {
  const familyMap = new Map<string, Guest[]>();
  const guestGroupMap = new Map<string, Guest[]>();
  const ungrouped: Guest[] = [];

  guests.forEach(guest => {
    if (guest.family_group_id) {
      if (!familyMap.has(guest.family_group_id)) {
        familyMap.set(guest.family_group_id, []);
      }
      familyMap.get(guest.family_group_id)!.push(guest);
    } else if (guest.group_id) {
      if (!guestGroupMap.has(guest.group_id)) {
        guestGroupMap.set(guest.group_id, []);
      }
      guestGroupMap.get(guest.group_id)!.push(guest);
    } else {
      ungrouped.push(guest);
    }
  });

  const sortedFamilyGroups = familyGroups
    .filter(fg => familyMap.has(fg.id))
    .map(fg => ({
      group: fg,
      guests: familyMap.get(fg.id)!.sort((a, b) => a.name.localeCompare(b.name, 'de'))
    }));

  const sortedGuestGroups = guestGroups
    .filter(gg => guestGroupMap.has(gg.id))
    .map(gg => ({
      group: gg,
      guests: guestGroupMap.get(gg.id)!.sort((a, b) => a.name.localeCompare(b.name, 'de'))
    }));

  return {
    familyGroups: sortedFamilyGroups,
    guestGroups: sortedGuestGroups,
    ungroupedGuests: ungrouped.sort((a, b) => a.name.localeCompare(b.name, 'de'))
  };
}

export function generateContactsExportCSV(
  guests: Guest[],
  familyGroups: FamilyGroup[],
  guestGroups: GuestGroup[]
): string {
  const grouped = groupGuestsByFamilyAndGroup(guests, familyGroups, guestGroups);
  const headers = ['Gruppe', 'Name', 'Adresse', 'E-Mail', 'Telefon'];
  const rows: string[][] = [];

  grouped.familyGroups.forEach(({ group, guests }) => {
    guests.forEach(guest => {
      rows.push([
        `Familie ${group.family_name}`,
        guest.name,
        guest.address || '',
        guest.email || '',
        guest.phone || ''
      ]);
    });
  });

  grouped.guestGroups.forEach(({ group, guests }) => {
    guests.forEach(guest => {
      rows.push([
        group.name,
        guest.name,
        guest.address || '',
        guest.email || '',
        guest.phone || ''
      ]);
    });
  });

  grouped.ungroupedGuests.forEach(guest => {
    rows.push([
      'Einzelgast',
      guest.name,
      guest.address || '',
      guest.email || '',
      guest.phone || ''
    ]);
  });

  return generateCSV(headers, rows);
}

export function generateContactsExportPDF(
  guests: Guest[],
  familyGroups: FamilyGroup[],
  guestGroups: GuestGroup[],
  weddingDate?: string
): Blob {
  const grouped = groupGuestsByFamilyAndGroup(guests, familyGroups, guestGroups);
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Kontaktliste für Einladungen', 14, 20);

  doc.setFontSize(10);
  doc.text(`Erstellt am: ${formatDate(new Date())}`, 14, 28);
  if (weddingDate) {
    doc.text(`Hochzeitsdatum: ${formatDate(new Date(weddingDate))}`, 14, 33);
  }
  doc.text(`Anzahl Gäste: ${guests.length}`, 14, weddingDate ? 38 : 33);

  let startY = weddingDate ? 45 : 40;

  grouped.familyGroups.forEach(({ group, guests: familyGuests }) => {
    if (startY > 260) {
      doc.addPage();
      startY = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Familie ${group.family_name}`, 14, startY);
    startY += 5;

    const tableData = familyGuests.map(guest => [
      guest.name,
      guest.address || '-',
      guest.email || '-',
      guest.phone || '-'
    ]);

    autoTable(doc, {
      head: [['Name', 'Adresse', 'E-Mail', 'Telefon']],
      body: tableData,
      startY: startY,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [247, 242, 235] },
      margin: { left: 14 }
    });

    startY = (doc as any).lastAutoTable.finalY + 8;
  });

  grouped.guestGroups.forEach(({ group, guests: groupGuests }) => {
    if (startY > 260) {
      doc.addPage();
      startY = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(group.name, 14, startY);
    startY += 5;

    const tableData = groupGuests.map(guest => [
      guest.name,
      guest.address || '-',
      guest.email || '-',
      guest.phone || '-'
    ]);

    autoTable(doc, {
      head: [['Name', 'Adresse', 'E-Mail', 'Telefon']],
      body: tableData,
      startY: startY,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [247, 242, 235] },
      margin: { left: 14 }
    });

    startY = (doc as any).lastAutoTable.finalY + 8;
  });

  if (grouped.ungroupedGuests.length > 0) {
    if (startY > 260) {
      doc.addPage();
      startY = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Einzelgäste', 14, startY);
    startY += 5;

    const tableData = grouped.ungroupedGuests.map(guest => [
      guest.name,
      guest.address || '-',
      guest.email || '-',
      guest.phone || '-'
    ]);

    autoTable(doc, {
      head: [['Name', 'Adresse', 'E-Mail', 'Telefon']],
      body: tableData,
      startY: startY,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [247, 242, 235] },
      margin: { left: 14 }
    });
  }

  return doc.output('blob');
}
