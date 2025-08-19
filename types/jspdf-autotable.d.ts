import 'jspdf'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable: {
      finalY: number
      cursor: {
        x: number
        y: number
      }
    }
  }
}
