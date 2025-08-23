// Comprehensive Cash Book Template - Three Column Layout matching the image structure
export const comprehensiveCashBookTemplate = {
  basePdf: 'BLANK_PDF',
  schemas: [
    {
      // Company Header
      companyName: {
        type: 'text',
        position: { x: 10, y: 10 },
        width: 190,
        height: 7,
        fontSize: 14,
        fontColor: '#CD7F32',
        alignment: 'center',
      },
      companyLocation: {
        type: 'text',
        position: { x: 10, y: 18 },
        width: 190,
        height: 5,
        fontSize: 8,
        alignment: 'center',
      },
      companyTel: {
        type: 'text',
        position: { x: 10, y: 23 },
        width: 190,
        height: 5,
        fontSize: 8,
        alignment: 'center',
      },
      companyEmail: {
        type: 'text',
        position: { x: 10, y: 28 },
        width: 190,
        height: 5,
        fontSize: 8,
        alignment: 'center',
      },
      
      // Report Title
      reportTitle: {
        type: 'text',
        position: { x: 10, y: 40 },
        width: 190,
        height: 7,
        fontSize: 12,
        fontColor: '#CD7F32',
        alignment: 'center',
      },
      
      // Report Info Box - Left side
      reportDateLabel: {
        type: 'text',
        position: { x: 15, y: 55 },
        width: 20,
        height: 4,
        fontSize: 8,
        fontName: 'Inter-Bold',
      },
      reportDateValue: {
        type: 'text',
        position: { x: 35, y: 55 },
        width: 40,
        height: 4,
        fontSize: 8,
      },
      reportPeriodLabel: {
        type: 'text',
        position: { x: 15, y: 60 },
        width: 20,
        height: 4,
        fontSize: 8,
        fontName: 'Inter-Bold',
      },
      reportPeriodValue: {
        type: 'text',
        position: { x: 35, y: 60 },
        width: 40,
        height: 4,
        fontSize: 8,
      },
      reportNoLabel: {
        type: 'text',
        position: { x: 15, y: 65 },
        width: 20,
        height: 4,
        fontSize: 8,
        fontName: 'Inter-Bold',
      },
      reportNoValue: {
        type: 'text',
        position: { x: 35, y: 65 },
        width: 40,
        height: 4,
        fontSize: 8,
      },

      // Watermark
      watermark: {
        type: 'image',
        position: { x: 55, y: 100 },
        width: 100,
        height: 100,
        opacity: 0.1,
      },

      // DR (Receipts) Section - LEFT HALF (x: 10 to x: 95)
      receiptsHeader: {
        type: 'text',
        position: { x: 10, y: 80 },
        width: 85,
        height: 5,
        fontSize: 10,
        fontName: 'Inter-Bold',
        alignment: 'left',
      },
      receiptsDateHeader: {
        type: 'text',
        position: { x: 10, y: 90 },
        width: 12,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'left',
      },
      receiptsParticularsHeader: {
        type: 'text',
        position: { x: 22, y: 90 },
        width: 25,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'left',
      },
      receiptsRefHeader: {
        type: 'text',
        position: { x: 47, y: 90 },
        width: 12,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'left',
      },
      receiptsCashHeader: {
        type: 'text',
        position: { x: 59, y: 90 },
        width: 15,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'right',
      },
      receiptsBankHeader: {
        type: 'text',
        position: { x: 74, y: 90 },
        width: 15,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'right',
      },
      receiptsDiscountHeader: {
        type: 'text',
        position: { x: 89, y: 90 },
        width: 6,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'right',
      },

      // CR (Payments) Section - RIGHT HALF (x: 105 to x: 190)
      paymentsHeader: {
        type: 'text',
        position: { x: 105, y: 80 },
        width: 85,
        height: 5,
        fontSize: 10,
        fontName: 'Inter-Bold',
        alignment: 'left',
      },
      paymentsDateHeader: {
        type: 'text',
        position: { x: 105, y: 90 },
        width: 12,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'left',
      },
      paymentsParticularsHeader: {
        type: 'text',
        position: { x: 117, y: 90 },
        width: 25,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'left',
      },
      paymentsRefHeader: {
        type: 'text',
        position: { x: 142, y: 90 },
        width: 12,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'left',
      },
      paymentsCashHeader: {
        type: 'text',
        position: { x: 154, y: 90 },
        width: 15,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'right',
      },
      paymentsBankHeader: {
        type: 'text',
        position: { x: 169, y: 90 },
        width: 15,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'right',
      },
      paymentsDiscountHeader: {
        type: 'text',
        position: { x: 184, y: 90 },
        width: 6,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'right',
      },

      // Data Rows - 12 rows for better data display
      // Receipts - LEFT SIDE
      receiptsDate1: { type: 'text', position: { x: 10, y: 100 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsParticulars1: { type: 'text', position: { x: 22, y: 100 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      receiptsRef1: { type: 'text', position: { x: 47, y: 100 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsCash1: { type: 'text', position: { x: 59, y: 100 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsBank1: { type: 'text', position: { x: 74, y: 100 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsDiscount1: { type: 'text', position: { x: 89, y: 100 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      receiptsDate2: { type: 'text', position: { x: 10, y: 106 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsParticulars2: { type: 'text', position: { x: 22, y: 106 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      receiptsRef2: { type: 'text', position: { x: 47, y: 106 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsCash2: { type: 'text', position: { x: 59, y: 106 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsBank2: { type: 'text', position: { x: 74, y: 106 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsDiscount2: { type: 'text', position: { x: 89, y: 106 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      receiptsDate3: { type: 'text', position: { x: 10, y: 112 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsParticulars3: { type: 'text', position: { x: 22, y: 112 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      receiptsRef3: { type: 'text', position: { x: 47, y: 112 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsCash3: { type: 'text', position: { x: 59, y: 112 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsBank3: { type: 'text', position: { x: 74, y: 112 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsDiscount3: { type: 'text', position: { x: 89, y: 112 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      receiptsDate4: { type: 'text', position: { x: 10, y: 118 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsParticulars4: { type: 'text', position: { x: 22, y: 118 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      receiptsRef4: { type: 'text', position: { x: 47, y: 118 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsCash4: { type: 'text', position: { x: 59, y: 118 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsBank4: { type: 'text', position: { x: 74, y: 118 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsDiscount4: { type: 'text', position: { x: 89, y: 118 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      receiptsDate5: { type: 'text', position: { x: 10, y: 124 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsParticulars5: { type: 'text', position: { x: 22, y: 124 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      receiptsRef5: { type: 'text', position: { x: 47, y: 124 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsCash5: { type: 'text', position: { x: 59, y: 124 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsBank5: { type: 'text', position: { x: 74, y: 124 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsDiscount5: { type: 'text', position: { x: 89, y: 124 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      receiptsDate6: { type: 'text', position: { x: 10, y: 130 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsParticulars6: { type: 'text', position: { x: 22, y: 130 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      receiptsRef6: { type: 'text', position: { x: 47, y: 130 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsCash6: { type: 'text', position: { x: 59, y: 130 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsBank6: { type: 'text', position: { x: 74, y: 130 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsDiscount6: { type: 'text', position: { x: 89, y: 130 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      receiptsDate7: { type: 'text', position: { x: 10, y: 136 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsParticulars7: { type: 'text', position: { x: 22, y: 136 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      receiptsRef7: { type: 'text', position: { x: 47, y: 136 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsCash7: { type: 'text', position: { x: 59, y: 136 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsBank7: { type: 'text', position: { x: 74, y: 136 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsDiscount7: { type: 'text', position: { x: 89, y: 136 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      receiptsDate8: { type: 'text', position: { x: 10, y: 142 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsParticulars8: { type: 'text', position: { x: 22, y: 142 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      receiptsRef8: { type: 'text', position: { x: 47, y: 142 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsCash8: { type: 'text', position: { x: 59, y: 142 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsBank8: { type: 'text', position: { x: 74, y: 142 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsDiscount8: { type: 'text', position: { x: 89, y: 142 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      receiptsDate9: { type: 'text', position: { x: 10, y: 148 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsParticulars9: { type: 'text', position: { x: 22, y: 148 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      receiptsRef9: { type: 'text', position: { x: 47, y: 148 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsCash9: { type: 'text', position: { x: 59, y: 148 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsBank9: { type: 'text', position: { x: 74, y: 148 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsDiscount9: { type: 'text', position: { x: 89, y: 148 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      receiptsDate10: { type: 'text', position: { x: 10, y: 154 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsParticulars10: { type: 'text', position: { x: 22, y: 154 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      receiptsRef10: { type: 'text', position: { x: 47, y: 154 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsCash10: { type: 'text', position: { x: 59, y: 154 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsBank10: { type: 'text', position: { x: 74, y: 154 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsDiscount10: { type: 'text', position: { x: 89, y: 154 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      receiptsDate11: { type: 'text', position: { x: 10, y: 160 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsParticulars11: { type: 'text', position: { x: 22, y: 160 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      receiptsRef11: { type: 'text', position: { x: 47, y: 160 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsCash11: { type: 'text', position: { x: 59, y: 160 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsBank11: { type: 'text', position: { x: 74, y: 160 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsDiscount11: { type: 'text', position: { x: 89, y: 160 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      receiptsDate12: { type: 'text', position: { x: 10, y: 166 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsParticulars12: { type: 'text', position: { x: 22, y: 166 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      receiptsRef12: { type: 'text', position: { x: 47, y: 166 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      receiptsCash12: { type: 'text', position: { x: 59, y: 166 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsBank12: { type: 'text', position: { x: 74, y: 166 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      receiptsDiscount12: { type: 'text', position: { x: 89, y: 166 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      // Payments - RIGHT SIDE
      paymentsDate1: { type: 'text', position: { x: 105, y: 100 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsParticulars1: { type: 'text', position: { x: 117, y: 100 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      paymentsRef1: { type: 'text', position: { x: 142, y: 100 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsCash1: { type: 'text', position: { x: 154, y: 100 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsBank1: { type: 'text', position: { x: 169, y: 100 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsDiscount1: { type: 'text', position: { x: 184, y: 100 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      paymentsDate2: { type: 'text', position: { x: 105, y: 106 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsParticulars2: { type: 'text', position: { x: 117, y: 106 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      paymentsRef2: { type: 'text', position: { x: 142, y: 106 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsCash2: { type: 'text', position: { x: 154, y: 106 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsBank2: { type: 'text', position: { x: 169, y: 106 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsDiscount2: { type: 'text', position: { x: 184, y: 106 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      paymentsDate3: { type: 'text', position: { x: 105, y: 112 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsParticulars3: { type: 'text', position: { x: 117, y: 112 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      paymentsRef3: { type: 'text', position: { x: 142, y: 112 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsCash3: { type: 'text', position: { x: 154, y: 112 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsBank3: { type: 'text', position: { x: 169, y: 112 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsDiscount3: { type: 'text', position: { x: 184, y: 112 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      paymentsDate4: { type: 'text', position: { x: 105, y: 118 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsParticulars4: { type: 'text', position: { x: 117, y: 118 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      paymentsRef4: { type: 'text', position: { x: 142, y: 118 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsCash4: { type: 'text', position: { x: 154, y: 118 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsBank4: { type: 'text', position: { x: 169, y: 118 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsDiscount4: { type: 'text', position: { x: 184, y: 118 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      paymentsDate5: { type: 'text', position: { x: 105, y: 124 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsParticulars5: { type: 'text', position: { x: 117, y: 124 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      paymentsRef5: { type: 'text', position: { x: 142, y: 124 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsCash5: { type: 'text', position: { x: 154, y: 124 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsBank5: { type: 'text', position: { x: 169, y: 124 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsDiscount5: { type: 'text', position: { x: 184, y: 124 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      paymentsDate6: { type: 'text', position: { x: 105, y: 130 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsParticulars6: { type: 'text', position: { x: 117, y: 130 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      paymentsRef6: { type: 'text', position: { x: 142, y: 130 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsCash6: { type: 'text', position: { x: 154, y: 130 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsBank6: { type: 'text', position: { x: 169, y: 130 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsDiscount6: { type: 'text', position: { x: 184, y: 130 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      paymentsDate7: { type: 'text', position: { x: 105, y: 136 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsParticulars7: { type: 'text', position: { x: 117, y: 136 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      paymentsRef7: { type: 'text', position: { x: 142, y: 136 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsCash7: { type: 'text', position: { x: 154, y: 136 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsBank7: { type: 'text', position: { x: 169, y: 136 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsDiscount7: { type: 'text', position: { x: 184, y: 136 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      paymentsDate8: { type: 'text', position: { x: 105, y: 142 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsParticulars8: { type: 'text', position: { x: 117, y: 142 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      paymentsRef8: { type: 'text', position: { x: 142, y: 142 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsCash8: { type: 'text', position: { x: 154, y: 142 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsBank8: { type: 'text', position: { x: 169, y: 142 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsDiscount8: { type: 'text', position: { x: 184, y: 142 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      paymentsDate9: { type: 'text', position: { x: 105, y: 148 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsParticulars9: { type: 'text', position: { x: 117, y: 148 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      paymentsRef9: { type: 'text', position: { x: 142, y: 148 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsCash9: { type: 'text', position: { x: 154, y: 148 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsBank9: { type: 'text', position: { x: 169, y: 148 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsDiscount9: { type: 'text', position: { x: 184, y: 148 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      paymentsDate10: { type: 'text', position: { x: 105, y: 154 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsParticulars10: { type: 'text', position: { x: 117, y: 154 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      paymentsRef10: { type: 'text', position: { x: 142, y: 154 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsCash10: { type: 'text', position: { x: 154, y: 154 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsBank10: { type: 'text', position: { x: 169, y: 154 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsDiscount10: { type: 'text', position: { x: 184, y: 154 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      paymentsDate11: { type: 'text', position: { x: 105, y: 160 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsParticulars11: { type: 'text', position: { x: 117, y: 160 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      paymentsRef11: { type: 'text', position: { x: 142, y: 160 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsCash11: { type: 'text', position: { x: 154, y: 160 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsBank11: { type: 'text', position: { x: 169, y: 160 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsDiscount11: { type: 'text', position: { x: 184, y: 160 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      paymentsDate12: { type: 'text', position: { x: 105, y: 166 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsParticulars12: { type: 'text', position: { x: 117, y: 166 }, width: 25, height: 4, fontSize: 7, alignment: 'left' },
      paymentsRef12: { type: 'text', position: { x: 142, y: 166 }, width: 12, height: 4, fontSize: 7, alignment: 'left' },
      paymentsCash12: { type: 'text', position: { x: 154, y: 166 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsBank12: { type: 'text', position: { x: 169, y: 166 }, width: 15, height: 4, fontSize: 7, alignment: 'right' },
      paymentsDiscount12: { type: 'text', position: { x: 184, y: 166 }, width: 6, height: 4, fontSize: 7, alignment: 'right' },

      // Totals - Receipts (LEFT SIDE)
      receiptsTotalLabel: {
        type: 'text',
        position: { x: 10, y: 180 },
        width: 40,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'left',
      },
      receiptsTotalCash: {
        type: 'text',
        position: { x: 59, y: 180 },
        width: 15,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'right',
      },
      receiptsTotalBank: {
        type: 'text',
        position: { x: 74, y: 180 },
        width: 15,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'right',
      },
      receiptsTotalDiscount: {
        type: 'text',
        position: { x: 89, y: 180 },
        width: 6,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'right',
      },

      // Totals - Payments (RIGHT SIDE)
      paymentsTotalLabel: {
        type: 'text',
        position: { x: 105, y: 180 },
        width: 40,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'left',
      },
      paymentsTotalCash: {
        type: 'text',
        position: { x: 154, y: 180 },
        width: 15,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'right',
      },
      paymentsTotalBank: {
        type: 'text',
        position: { x: 169, y: 180 },
        width: 15,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'right',
      },
      paymentsTotalDiscount: {
        type: 'text',
        position: { x: 184, y: 180 },
        width: 6,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'right',
      },

      // Footer
      preparedBy: {
        type: 'text',
        position: { x: 10, y: 270 },
        width: 80,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'left',
      },
      approvedBy: {
        type: 'text',
        position: { x: 120, y: 270 },
        width: 80,
        height: 5,
        fontSize: 8,
        fontName: 'Inter-Bold',
        alignment: 'right',
      },
      pageNumber: {
        type: 'text',
        position: { x: 10, y: 280 },
        width: 190,
        height: 5,
        fontSize: 7,
        alignment: 'center',
      },
    },
  ],
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Helper function to safely get transaction data
const getTransactionData = (transactions: any[], index: number, key: string): any => {
  if (index < transactions.length) {
    return transactions[index][key];
  }
  return ''; // Return empty string for missing data
};

// Comprehensive Cash Book PDF Generator
export const generateComprehensiveCashBookPDF = async (data: any) => {
  // Calculate totals
  const totalCashReceipts = data.receipts.reduce((sum: number, r: any) => sum + (r.cash || 0), 0);
  const totalBankReceipts = data.receipts.reduce((sum: number, r: any) => sum + (r.bank || 0), 0);
  const totalDiscountAllowed = data.receipts.reduce((sum: number, r: any) => sum + (r.discount || 0), 0);
  
  const totalCashPayments = data.payments.reduce((sum: number, p: any) => sum + (p.cash || 0), 0);
  const totalBankPayments = data.payments.reduce((sum: number, p: any) => sum + (p.bank || 0), 0);
  const totalDiscountReceived = data.payments.reduce((sum: number, p: any) => sum + (p.discount || 0), 0);

  // Create inputs for the template - PDFme expects an array of input objects
  const inputs: any[] = [
    {
      companyName: data.companyInfo.name,
      companyLocation: `Location: ${data.companyInfo.location}`,
      companyTel: `Tel: ${data.companyInfo.tel}`,
      companyEmail: `Email: ${data.companyInfo.email}`,
      reportTitle: 'CASH BOOK',
      
      // Report Info Box
      reportDateLabel: 'Date:',
      reportDateValue: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      reportPeriodLabel: 'Period:',
      reportPeriodValue: data.period || 'N/A',
      reportNoLabel: 'No:',
      reportNoValue: data.reportNo || 'CB-001',

      watermark: data.watermarkBase64 || '',

      // Receipts Headers (LEFT SIDE)
      receiptsHeader: 'DR (Receipts)',
      receiptsDateHeader: 'Date',
      receiptsParticularsHeader: 'Particulars',
      receiptsRefHeader: 'REF',
      receiptsCashHeader: 'Cash (KES)',
      receiptsBankHeader: 'Coop Bank (KES)',
      receiptsDiscountHeader: 'Disc. Allowed',

      // Payments Headers (RIGHT SIDE)
      paymentsHeader: 'CR (Payments)',
      paymentsDateHeader: 'Date',
      paymentsParticularsHeader: 'Particulars',
      paymentsRefHeader: 'REF',
      paymentsCashHeader: 'Cash (KES)',
      paymentsBankHeader: 'Coop Bank (KES)',
      paymentsDiscountHeader: 'Disc. Received',

      // Populate data rows (12 rows for better data display)
      receiptsDate1: getTransactionData(data.receipts, 0, 'date'),
      receiptsParticulars1: getTransactionData(data.receipts, 0, 'particulars'),
      receiptsRef1: getTransactionData(data.receipts, 0, 'ref'),
      receiptsCash1: formatCurrency(getTransactionData(data.receipts, 0, 'cash')),
      receiptsBank1: formatCurrency(getTransactionData(data.receipts, 0, 'bank')),
      receiptsDiscount1: formatCurrency(getTransactionData(data.receipts, 0, 'discount')),

      receiptsDate2: getTransactionData(data.receipts, 1, 'date'),
      receiptsParticulars2: getTransactionData(data.receipts, 1, 'particulars'),
      receiptsRef2: getTransactionData(data.receipts, 1, 'ref'),
      receiptsCash2: formatCurrency(getTransactionData(data.receipts, 1, 'cash')),
      receiptsBank2: formatCurrency(getTransactionData(data.receipts, 1, 'bank')),
      receiptsDiscount2: formatCurrency(getTransactionData(data.receipts, 1, 'discount')),

      receiptsDate3: getTransactionData(data.receipts, 2, 'date'),
      receiptsParticulars3: getTransactionData(data.receipts, 2, 'particulars'),
      receiptsRef3: getTransactionData(data.receipts, 2, 'ref'),
      receiptsCash3: formatCurrency(getTransactionData(data.receipts, 2, 'cash')),
      receiptsBank3: formatCurrency(getTransactionData(data.receipts, 2, 'bank')),
      receiptsDiscount3: formatCurrency(getTransactionData(data.receipts, 2, 'discount')),

      receiptsDate4: getTransactionData(data.receipts, 3, 'date'),
      receiptsParticulars4: getTransactionData(data.receipts, 3, 'particulars'),
      receiptsRef4: getTransactionData(data.receipts, 3, 'ref'),
      receiptsCash4: formatCurrency(getTransactionData(data.receipts, 3, 'cash')),
      receiptsBank4: formatCurrency(getTransactionData(data.receipts, 3, 'bank')),
      receiptsDiscount4: formatCurrency(getTransactionData(data.receipts, 3, 'discount')),

      receiptsDate5: getTransactionData(data.receipts, 4, 'date'),
      receiptsParticulars5: getTransactionData(data.receipts, 4, 'particulars'),
      receiptsRef5: getTransactionData(data.receipts, 4, 'ref'),
      receiptsCash5: formatCurrency(getTransactionData(data.receipts, 4, 'cash')),
      receiptsBank5: formatCurrency(getTransactionData(data.receipts, 4, 'bank')),
      receiptsDiscount5: formatCurrency(getTransactionData(data.receipts, 4, 'discount')),

      receiptsDate6: getTransactionData(data.receipts, 5, 'date'),
      receiptsParticulars6: getTransactionData(data.receipts, 5, 'particulars'),
      receiptsRef6: getTransactionData(data.receipts, 5, 'ref'),
      receiptsCash6: formatCurrency(getTransactionData(data.receipts, 5, 'cash')),
      receiptsBank6: formatCurrency(getTransactionData(data.receipts, 5, 'bank')),
      receiptsDiscount6: formatCurrency(getTransactionData(data.receipts, 5, 'discount')),

      receiptsDate7: getTransactionData(data.receipts, 6, 'date'),
      receiptsParticulars7: getTransactionData(data.receipts, 6, 'particulars'),
      receiptsRef7: getTransactionData(data.receipts, 6, 'ref'),
      receiptsCash7: formatCurrency(getTransactionData(data.receipts, 6, 'cash')),
      receiptsBank7: formatCurrency(getTransactionData(data.receipts, 6, 'bank')),
      receiptsDiscount7: formatCurrency(getTransactionData(data.receipts, 6, 'discount')),

      receiptsDate8: getTransactionData(data.receipts, 7, 'date'),
      receiptsParticulars8: getTransactionData(data.receipts, 7, 'particulars'),
      receiptsRef8: getTransactionData(data.receipts, 7, 'ref'),
      receiptsCash8: formatCurrency(getTransactionData(data.receipts, 7, 'cash')),
      receiptsBank8: formatCurrency(getTransactionData(data.receipts, 7, 'bank')),
      receiptsDiscount8: formatCurrency(getTransactionData(data.receipts, 7, 'discount')),

      receiptsDate9: getTransactionData(data.receipts, 8, 'date'),
      receiptsParticulars9: getTransactionData(data.receipts, 8, 'particulars'),
      receiptsRef9: getTransactionData(data.receipts, 8, 'ref'),
      receiptsCash9: formatCurrency(getTransactionData(data.receipts, 8, 'cash')),
      receiptsBank9: formatCurrency(getTransactionData(data.receipts, 8, 'bank')),
      receiptsDiscount9: formatCurrency(getTransactionData(data.receipts, 8, 'discount')),

      receiptsDate10: getTransactionData(data.receipts, 9, 'date'),
      receiptsParticulars10: getTransactionData(data.receipts, 9, 'particulars'),
      receiptsRef10: getTransactionData(data.receipts, 9, 'ref'),
      receiptsCash10: formatCurrency(getTransactionData(data.receipts, 9, 'cash')),
      receiptsBank10: formatCurrency(getTransactionData(data.receipts, 9, 'bank')),
      receiptsDiscount10: formatCurrency(getTransactionData(data.receipts, 9, 'discount')),

      receiptsDate11: getTransactionData(data.receipts, 10, 'date'),
      receiptsParticulars11: getTransactionData(data.receipts, 10, 'particulars'),
      receiptsRef11: getTransactionData(data.receipts, 10, 'ref'),
      receiptsCash11: formatCurrency(getTransactionData(data.receipts, 10, 'cash')),
      receiptsBank11: formatCurrency(getTransactionData(data.receipts, 10, 'bank')),
      receiptsDiscount11: formatCurrency(getTransactionData(data.receipts, 10, 'discount')),

      receiptsDate12: getTransactionData(data.receipts, 11, 'date'),
      receiptsParticulars12: getTransactionData(data.receipts, 11, 'particulars'),
      receiptsRef12: getTransactionData(data.receipts, 11, 'ref'),
      receiptsCash12: formatCurrency(getTransactionData(data.receipts, 11, 'cash')),
      receiptsBank12: formatCurrency(getTransactionData(data.receipts, 11, 'bank')),
      receiptsDiscount12: formatCurrency(getTransactionData(data.receipts, 11, 'discount')),

      // Populate data rows (12 rows for better data display)
      paymentsDate1: getTransactionData(data.payments, 0, 'date'),
      paymentsParticulars1: getTransactionData(data.payments, 0, 'particulars'),
      paymentsRef1: getTransactionData(data.payments, 0, 'ref'),
      paymentsCash1: formatCurrency(getTransactionData(data.payments, 0, 'cash')),
      paymentsBank1: formatCurrency(getTransactionData(data.payments, 0, 'bank')),
      paymentsDiscount1: formatCurrency(getTransactionData(data.payments, 0, 'discount')),

      paymentsDate2: getTransactionData(data.payments, 1, 'date'),
      paymentsParticulars2: getTransactionData(data.payments, 1, 'particulars'),
      paymentsRef2: getTransactionData(data.payments, 1, 'ref'),
      paymentsCash2: formatCurrency(getTransactionData(data.payments, 1, 'cash')),
      paymentsBank2: formatCurrency(getTransactionData(data.payments, 1, 'bank')),
      paymentsDiscount2: formatCurrency(getTransactionData(data.payments, 1, 'discount')),

      paymentsDate3: getTransactionData(data.payments, 2, 'date'),
      paymentsParticulars3: getTransactionData(data.payments, 2, 'particulars'),
      paymentsRef3: getTransactionData(data.payments, 2, 'ref'),
      paymentsCash3: formatCurrency(getTransactionData(data.payments, 2, 'cash')),
      paymentsBank3: formatCurrency(getTransactionData(data.payments, 2, 'bank')),
      paymentsDiscount3: formatCurrency(getTransactionData(data.payments, 2, 'discount')),

      paymentsDate4: getTransactionData(data.payments, 3, 'date'),
      paymentsParticulars4: getTransactionData(data.payments, 3, 'particulars'),
      paymentsRef4: getTransactionData(data.payments, 3, 'ref'),
      paymentsCash4: formatCurrency(getTransactionData(data.payments, 3, 'cash')),
      paymentsBank4: formatCurrency(getTransactionData(data.payments, 3, 'bank')),
      paymentsDiscount4: formatCurrency(getTransactionData(data.payments, 3, 'discount')),

      paymentsDate5: getTransactionData(data.payments, 4, 'date'),
      paymentsParticulars5: getTransactionData(data.payments, 4, 'particulars'),
      paymentsRef5: getTransactionData(data.payments, 4, 'ref'),
      paymentsCash5: formatCurrency(getTransactionData(data.payments, 4, 'cash')),
      paymentsBank5: formatCurrency(getTransactionData(data.payments, 4, 'bank')),
      paymentsDiscount5: formatCurrency(getTransactionData(data.payments, 4, 'discount')),

      paymentsDate6: getTransactionData(data.payments, 5, 'date'),
      paymentsParticulars6: getTransactionData(data.payments, 5, 'particulars'),
      paymentsRef6: getTransactionData(data.payments, 5, 'ref'),
      paymentsCash6: formatCurrency(getTransactionData(data.payments, 5, 'cash')),
      paymentsBank6: formatCurrency(getTransactionData(data.payments, 5, 'bank')),
      paymentsDiscount6: formatCurrency(getTransactionData(data.payments, 5, 'discount')),

      paymentsDate7: getTransactionData(data.payments, 6, 'date'),
      paymentsParticulars7: getTransactionData(data.payments, 6, 'particulars'),
      paymentsRef7: getTransactionData(data.payments, 6, 'ref'),
      paymentsCash7: formatCurrency(getTransactionData(data.payments, 6, 'cash')),
      paymentsBank7: formatCurrency(getTransactionData(data.payments, 6, 'bank')),
      paymentsDiscount7: formatCurrency(getTransactionData(data.payments, 6, 'discount')),

      paymentsDate8: getTransactionData(data.payments, 7, 'date'),
      paymentsParticulars8: getTransactionData(data.payments, 7, 'particulars'),
      paymentsRef8: getTransactionData(data.payments, 7, 'ref'),
      paymentsCash8: formatCurrency(getTransactionData(data.payments, 7, 'cash')),
      paymentsBank8: formatCurrency(getTransactionData(data.payments, 7, 'bank')),
      paymentsDiscount8: formatCurrency(getTransactionData(data.payments, 7, 'discount')),

      paymentsDate9: getTransactionData(data.payments, 8, 'date'),
      paymentsParticulars9: getTransactionData(data.payments, 8, 'particulars'),
      paymentsRef9: getTransactionData(data.payments, 8, 'ref'),
      paymentsCash9: formatCurrency(getTransactionData(data.payments, 8, 'cash')),
      paymentsBank9: formatCurrency(getTransactionData(data.payments, 8, 'bank')),
      paymentsDiscount9: formatCurrency(getTransactionData(data.payments, 8, 'discount')),

      paymentsDate10: getTransactionData(data.payments, 9, 'date'),
      paymentsParticulars10: getTransactionData(data.payments, 9, 'particulars'),
      paymentsRef10: getTransactionData(data.payments, 9, 'ref'),
      paymentsCash10: formatCurrency(getTransactionData(data.payments, 9, 'cash')),
      paymentsBank10: formatCurrency(getTransactionData(data.payments, 9, 'bank')),
      paymentsDiscount10: formatCurrency(getTransactionData(data.payments, 9, 'discount')),

      paymentsDate11: getTransactionData(data.payments, 10, 'date'),
      paymentsParticulars11: getTransactionData(data.payments, 10, 'particulars'),
      paymentsRef11: getTransactionData(data.payments, 10, 'ref'),
      paymentsCash11: formatCurrency(getTransactionData(data.payments, 10, 'cash')),
      paymentsBank11: formatCurrency(getTransactionData(data.payments, 10, 'bank')),
      paymentsDiscount11: formatCurrency(getTransactionData(data.payments, 10, 'discount')),

      paymentsDate12: getTransactionData(data.payments, 11, 'date'),
      paymentsParticulars12: getTransactionData(data.payments, 11, 'particulars'),
      paymentsRef12: getTransactionData(data.payments, 11, 'ref'),
      paymentsCash12: formatCurrency(getTransactionData(data.payments, 11, 'cash')),
      paymentsBank12: formatCurrency(getTransactionData(data.payments, 11, 'bank')),
      paymentsDiscount12: formatCurrency(getTransactionData(data.payments, 11, 'discount')),

      // Populate totals
      receiptsTotalLabel: 'TOTAL',
      receiptsTotalCash: formatCurrency(totalCashReceipts),
      receiptsTotalBank: formatCurrency(totalBankReceipts),
      receiptsTotalDiscount: formatCurrency(totalDiscountAllowed),

      paymentsTotalLabel: 'TOTAL',
      paymentsTotalCash: formatCurrency(totalCashPayments),
      paymentsTotalBank: formatCurrency(totalBankPayments),
      paymentsTotalDiscount: formatCurrency(totalDiscountReceived),

      preparedBy: 'Prepared By:',
      approvedBy: 'Approved By:',
      pageNumber: 'Page 1 of 1',
    },
  ];

  return inputs;
};
