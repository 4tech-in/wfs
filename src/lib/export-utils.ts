import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Utility to export data to CSV
 */
export const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
  const csvContent = data.map(row => 
    Object.values(row)
      .map(value => `"${String(value).replace(/"/g, '""')}"`)
      .join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Utility to export data to Excel (XLSX)
 */
export const exportToExcel = (data: Record<string, unknown>[], filename: string, sheetName: string = 'Sheet1') => {
  const worksheet = XLSX.utils.json_to_sheet(data);

  if (data.length > 0) {
    const keys = Object.keys(data[0] || {});
    worksheet['!cols'] = keys.map(k => {
      if (k.startsWith('Day ')) return { wch: 15 };
      if (k.toLowerCase().includes('name')) return { wch: 22 };
      if (k.toLowerCase().includes('id')) return { wch: 14 };
      if (k.toLowerCase().includes('department') || k.toLowerCase().includes('designation') || k.toLowerCase().includes('company')) return { wch: 18 };
      return { wch: 14 };
    });
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Utility to export data to PDF
 */
export const exportToPDF = (data: Record<string, unknown>[], filename: string, title: string) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);

  // Get headers from first object keys
  const headers = Object.keys(data[0] || {});
  const body = data.map(row => Object.values(row)) as (string | number | boolean)[][];

  autoTable(doc, {
    startY: 30,
    head: [headers],
    body: body,
    theme: 'striped',
    headStyles: { fillColor: [30, 35, 48] }, // Match your dashboard navy color
  });

  doc.save(`${filename}.pdf`);
};
