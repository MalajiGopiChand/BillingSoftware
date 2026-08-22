import { numberToWords } from '../utils/numberToWords';
import styles from './InvoiceTemplate.module.css';

interface InvoiceItem {
  id: string;
  description: string;
  box: number;
  qty: number;
  rate: number;
  discount: number;
}

interface InvoiceTemplateProps {
  shopName: string;
  phone: string;
  address: string;
  date: string;
  invoiceNo: string;
  gbSlipNo: string;
  transport: string;
  lrNo: string;
  globalBoxes: string;
  terms: string;
  items: InvoiceItem[];
  tax: number;
  hamali: number;
  hamaliLabel?: string;
}

export default function InvoiceTemplate({
  shopName,
  phone,
  address,
  date,
  invoiceNo,
  gbSlipNo,
  transport,
  lrNo,
  globalBoxes,
  terms,
  items,
  tax,
  hamali,
  hamaliLabel = 'HAMALI'
}: InvoiceTemplateProps) {
  
  // Calculations
  let totalBox = 0;
  let totalQty = 0;
  let totalGross = 0;
  
  const processedItems = items.map((item, index) => {
    const gross = item.qty * item.rate;
    const discountAmt = (gross * item.discount) / 100;
    const amount = gross - discountAmt;
    
    totalBox += item.box;
    totalQty += item.qty;
    totalGross += gross;
    
    return {
      ...item,
      index: index + 1,
      gross,
      amount
    };
  });
  
  const totalAmountBeforeExtras = processedItems.reduce((sum, item) => sum + item.amount, 0);
  const grandTotal = totalAmountBeforeExtras + tax + hamali;

  // Render empty rows to fill the page height like a real printed bill
  const MIN_ROWS = 15;
  const emptyRows = Math.max(0, MIN_ROWS - items.length);

  return (
    <div className={styles.invoiceSheet}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.shopName}>{shopName}</div>
          {phone && <div className={styles.address}>Ph: {phone}</div>}
          <div className={styles.address}>{address}</div>
          <div className={styles.boxesField}>No of Boxes: <span className={styles.value}>{globalBoxes}</span></div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.fieldRow}>
            <span className={styles.label}>NO:</span> 
            <span className={styles.value}>{invoiceNo}</span>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.label}>DATE:</span> 
            <span className={styles.value}>{date.split('-').reverse().join('-')}</span>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.label}>GB SLIP NO:</span> 
            <span className={styles.value}>{gbSlipNo}</span>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.label}>TRANSPORT:</span> 
            <span className={styles.value}>{transport}</span>
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.label}>LR NO:</span> 
            <span className={styles.value}>{lrNo}</span>
          </div>
        </div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th style={{ width: '5%' }}>SN</th>
            <th style={{ width: '40%' }}>DESCRIPTION</th>
            <th style={{ width: '8%' }}>BOX</th>
            <th style={{ width: '10%' }}>QTY</th>
            <th style={{ width: '12%' }}>RATE</th>
            <th style={{ width: '10%' }}>GROSS</th>
            <th style={{ width: '6%' }}>Dis %</th>
            <th style={{ width: '9%' }}>AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          {processedItems.map(item => (
            <tr key={item.id} className={styles.itemRow}>
              <td className={styles.center}>{item.index}</td>
              <td>{item.description}</td>
              <td className={styles.center}>{item.box || ''}</td>
              <td className={styles.center}>{item.qty || ''}</td>
              <td className={styles.right}>{item.rate ? item.rate.toFixed(2) : ''}</td>
              <td className={styles.right}>{item.gross ? item.gross.toFixed(2) : ''}</td>
              <td className={styles.center}>{item.discount || ''}</td>
              <td className={styles.right}>{item.amount ? item.amount.toFixed(2) : ''}</td>
            </tr>
          ))}
          {[...Array(emptyRows)].map((_, i) => (
            <tr key={`empty-${i}`} className={styles.itemRow}>
              <td>&nbsp;</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          ))}
        </tbody>
        <tfoot className={styles.tfoot}>
          <tr className={styles.totalsRow}>
            <td colSpan={2} className={styles.totalLabel}>Total</td>
            <td className={styles.center}>{totalBox || ''}</td>
            <td className={styles.center}>{totalQty || ''}</td>
            <td></td>
            <td className={styles.right}>{totalGross ? totalGross.toFixed(2) : ''}</td>
            <td></td>
            <td className={styles.right}>{totalAmountBeforeExtras ? totalAmountBeforeExtras.toFixed(2) : ''}</td>
          </tr>
        </tfoot>
      </table>

      <div className={styles.totalsSection}>
        <div className={styles.wordsAndTaxRow}>
          <div className={styles.words}>
            {numberToWords(Math.round(grandTotal))} ONLY
          </div>
          <div className={styles.taxBlock}>
            <span>TAX:</span>
            <span>{tax > 0 ? tax.toFixed(2) : ''}</span>
          </div>
        </div>

        <div className={styles.footerRow}>
          <div className={styles.terms}>
            {terms || '**No Replacement for Glass Items and all Fittings Damage on Tranpost**'}
          </div>
          <div className={styles.hamaliBlock}>
            <span>{hamaliLabel}:</span>
            <span>{hamali > 0 ? hamali.toFixed(2) : ''}</span>
          </div>
        </div>

        <div className={styles.grandTotalRow}>
          <span>TOTAL AMOUNT:</span>
          <span className={styles.grandTotalValue}>{grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
