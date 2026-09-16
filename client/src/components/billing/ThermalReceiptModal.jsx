import React from 'react';
import { Printer, X, CheckCircle2, Download } from 'lucide-react';

export default function ThermalReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('thermal-receipt');
    if (!printContent) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const pri = iframe.contentWindow;
    pri.document.open();
    pri.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receipt.billNumber || 'RESTOZA'}</title>
          <style>
            @page {
              size: auto;
              margin: 10mm;
            }
            * {
              box-sizing: border-box;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #000000;
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              line-height: 1.3;
              width: 100%;
              display: flex;
              justify-content: center;
              align-items: flex-start;
            }
            .receipt-paper {
              width: 85mm;
              max-width: 100%;
              margin: 0 auto;
              padding: 8px 12px;
              background: #ffffff;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: bold; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .uppercase { text-transform: uppercase; }
            .italic { font-style: italic; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            .items-center { align-items: center; }
            .border-b { border-bottom: 1px dashed #444; }
            .border-t { border-top: 1px dashed #444; }
            .py-1 { padding-top: 3px; padding-bottom: 3px; }
            .py-3 { padding-top: 8px; padding-bottom: 8px; }
            .pb-4 { padding-bottom: 12px; }
            .pt-1 { padding-top: 4px; }
            .pt-2 { padding-top: 8px; }
            .pt-4 { padding-top: 12px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-1\\.5 > * + * { margin-top: 6px; }
            .space-y-2 > * + * { margin-top: 8px; }
            .w-full { width: 100%; }
            .w-1\\/2 { width: 50%; }
            .w-1\\/6 { width: 16.666%; }
            .text-xs { font-size: 11px; }
            .text-sm { font-size: 12px; }
            .text-base { font-size: 14px; font-weight: bold; }
            .text-xl { font-size: 18px; font-weight: bold; }
            .no-print { display: none !important; }
            .barcode-container { display: flex; justify-content: center; gap: 2px; height: 36px; padding: 4px 0; }
            .barcode-bar { background: #000; height: 100%; }
          </style>
        </head>
        <body>
          <div class="receipt-paper">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    pri.document.close();
    pri.focus();
    setTimeout(() => {
      pri.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 250);
  };

  const currency = receipt.currency || '৳';
  const rest = receipt.restaurant || {};

  return (
    <div className="thermal-receipt-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="thermal-receipt-modal-card relative w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">

        {/* Header Actions */}
        <div className="bg-slate-100 px-6 py-3 border-b flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Payment Settled
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-restoza-burgundy-700 hover:bg-restoza-burgundy-800 text-white rounded-lg transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div id="thermal-receipt" className="p-6 font-mono text-xs leading-tight bg-white text-slate-900 selection:bg-slate-300">
          {/* Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-400 space-y-1">
            <h2 className="text-xl font-bold font-serif tracking-wider uppercase text-slate-900">
              {rest.restaurantName || 'RESTOZA'}
            </h2>
            <p className="text-[11px] text-slate-600 uppercase tracking-wide">
              {rest.tagline || 'Fine Dining & Culinary Excellence'}
            </p>
            <p className="text-[10px] text-slate-500 pt-1">
              {rest.address || 'Plot 42, Road 11, Banani / Gulshan 2, Dhaka'}
            </p>
            <p className="text-[10px] text-slate-500">
              Tel: {rest.phone || '+880 1711-234567'} | VAT Reg: BD-9948271
            </p>
          </div>

          {/* Receipt Info */}
          <div className="py-3 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">INVOICE:</span>
              <span className="font-bold">{receipt.billNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ORDER NO:</span>
              <span>{receipt.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">TABLE / SEAT:</span>
              <span className="font-semibold">{receipt.tableNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">DATE & TIME:</span>
              <span>{new Date(receipt.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">GUEST:</span>
              <span>{receipt.customer || 'Valued Guest'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">SERVER:</span>
              <span>{receipt.waiter || 'Counter Staff'}</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-3 border-b border-dashed border-slate-400">
            <div className="flex justify-between font-bold text-[11px] pb-1.5 border-b border-slate-200">
              <span className="w-1/2">ITEM</span>
              <span className="w-1/6 text-center">QTY</span>
              <span className="w-1/6 text-right">PRICE</span>
              <span className="w-1/6 text-right">TOTAL</span>
            </div>
            <div className="divide-y divide-slate-100 py-1 space-y-1">
              {receipt.items?.map((item, idx) => (
                <div key={idx} className="pt-1.5 flex justify-between text-[11px]">
                  <div className="w-1/2 pr-1">
                    <span className="font-medium text-slate-800">{item.name}</span>
                    {item.instruction && (
                      <span className="block text-[9px] text-slate-500 italic">
                        * {item.instruction}
                      </span>
                    )}
                  </div>
                  <span className="w-1/6 text-center text-slate-600">{item.quantity}</span>
                  <span className="w-1/6 text-right text-slate-600">{currency}{item.unitPrice}</span>
                  <span className="w-1/6 text-right font-semibold text-slate-800">{currency}{item.subtotal}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calculations */}
          <div className="py-3 border-b border-dashed border-slate-400 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span>{currency}{receipt.subtotal?.toFixed(2)}</span>
            </div>
            {receipt.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount Promo</span>
                <span>-{currency}{receipt.discount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>VAT / Tax ({receipt.taxRate || 10}%)</span>
              <span>{currency}{receipt.tax?.toFixed(2)}</span>
            </div>
            {receipt.serviceCharge > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Service Charge ({receipt.serviceChargeRate || 5}%)</span>
                <span>{currency}{receipt.serviceCharge?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-300 text-slate-900">
              <span>GRAND TOTAL</span>
              <span>{currency}{receipt.total?.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="py-3 border-b border-dashed border-slate-400 text-center space-y-1 text-[11px]">
            <p className="font-semibold uppercase text-emerald-800 tracking-wider">
              PAYMENT STATUS: PAID ({receipt.payments?.[0]?.paymentMethod || 'CASH'})
            </p>
            {receipt.payments?.[0]?.transactionId && (
              <p className="text-[10px] text-slate-500">
                Txn ID: {receipt.payments[0].transactionId}
              </p>
            )}
          </div>

          {/* Barcode Simulation & Footer */}
          <div className="pt-4 text-center space-y-2">
            <div className="flex justify-center items-center gap-1 opacity-70 py-1">
              {/* Stylized Barcode lines */}
              <div className="h-9 w-1 bg-black"></div>
              <div className="h-9 w-0.5 bg-black"></div>
              <div className="h-9 w-2 bg-black"></div>
              <div className="h-9 w-1 bg-black"></div>
              <div className="h-9 w-0.5 bg-black"></div>
              <div className="h-9 w-3 bg-black"></div>
              <div className="h-9 w-1 bg-black"></div>
              <div className="h-9 w-2 bg-black"></div>
              <div className="h-9 w-0.5 bg-black"></div>
              <div className="h-9 w-1.5 bg-black"></div>
              <div className="h-9 w-3 bg-black"></div>
              <div className="h-9 w-1 bg-black"></div>
              <div className="h-9 w-0.5 bg-black"></div>
              <div className="h-9 w-2 bg-black"></div>
            </div>
            <p className="text-[10px] text-slate-500">
              *{receipt.billNumber}*
            </p>
            <p className="text-[11px] font-semibold text-slate-700 italic pt-1">
              Thank you for dining at Restoza!
            </p>
            <p className="text-[9px] text-slate-500">
              Please share your review on Google & Instagram @restoza
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-3 border-t flex justify-end gap-2 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-restoza-burgundy-700 hover:bg-restoza-burgundy-800 text-white rounded-lg transition-colors shadow"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>

      </div>
    </div>
  );
}
