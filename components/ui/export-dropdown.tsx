'use client'

import { useState } from 'react'
import { FileDown, FileText, FileSpreadsheet, FileIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

interface ExportDropdownProps {
  data: any[]
  headers: string[]
  filename: string
  // A function that maps an object from data to an array of strings/numbers corresponding to the headers
  mapData: (item: any) => (string | number)[]
}

export default function ExportDropdown({ data, headers, filename, mapData }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleExportCSV = () => {
    const csvContent = [
      headers.join(','),
      ...data.map(item => mapData(item).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setIsOpen(false)
  }

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data.map(mapData)])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')
    XLSX.writeFile(workbook, `${filename}.xlsx`)
    setIsOpen(false)
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.text(filename, 14, 15)
    
    autoTable(doc, {
      head: [headers],
      body: data.map(item => mapData(item).map(String)),
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] } // primary color
    })

    doc.save(`${filename}.pdf`)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 flex items-center gap-2 bg-bg-secondary border border-border rounded-lg text-sm font-medium text-text-secondary hover:text-text transition-colors shadow-sm"
      >
        <FileDown size={15} />
        Export
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-48 bg-bg-secondary border border-border rounded-xl shadow-card z-50 overflow-hidden py-1"
            >
              <button onClick={handleExportCSV} className="w-full text-left px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text hover:bg-bg-tertiary flex items-center gap-2 transition-colors">
                <FileText size={15} className="text-blue-400" /> Export CSV
              </button>
              <button onClick={handleExportExcel} className="w-full text-left px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text hover:bg-bg-tertiary flex items-center gap-2 transition-colors">
                <FileSpreadsheet size={15} className="text-green-500" /> Export Excel
              </button>
              <button onClick={handleExportPDF} className="w-full text-left px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text hover:bg-bg-tertiary flex items-center gap-2 transition-colors">
                <FileIcon size={15} className="text-red-500" /> Export PDF
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
