'use client';

import React from 'react';

/* ─── Brand tokens ─────────────────────────────────────────────────────────── */
const JADE     = '#0d6b54';
const JADE_LT  = '#e6f5f1';
const GOLD     = '#c88a14';
const IVORY    = '#f8f7f4';
const BORDER   = '#e5e7eb';
const MUTED    = '#6b7280';
const SUBTXT   = '#9ca3af';

/* ─── Shared atoms ─────────────────────────────────────────────────────────── */

export function MockScreen({
  title, height = 300, children,
}: { title: string; height?: number; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden shadow-lg select-none" style={{ border: `1px solid ${BORDER}`, fontFamily: 'system-ui,sans-serif', fontSize: 11 }}>
      {/* window chrome */}
      <div style={{ background: '#ececec', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
        <span style={{ margin: '0 auto', fontSize: 9, color: '#888' }}>Shopysh · {title}</span>
      </div>
      {/* content */}
      <div style={{ height, overflow: 'auto', background: IVORY }}>
        {children}
      </div>
    </div>
  );
}

function Bar({ label, value, max, color = JADE }: { label: string; value: number; max: number; color?: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 9, color: MUTED }}>{label}</span>
        <span style={{ fontSize: 9, color: MUTED, fontVariantNumeric: 'tabular-nums' }}>₦{value.toLocaleString()}</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: '#e5e7eb' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: color }} />
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, accent = JADE }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '7px 10px' }}>
      <p style={{ fontSize: 8, color: SUBTXT, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 700, color: accent, margin: '2px 0 0', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
      {sub && <p style={{ fontSize: 8, color: SUBTXT, margin: '1px 0 0' }}>{sub}</p>}
    </div>
  );
}

function Pill({ label, color }: { label: string; color: 'green' | 'amber' | 'red' | 'sky' | 'violet' | 'gray' | 'orange' }) {
  const map = {
    green:  ['#d1fae5','#065f46'],
    amber:  ['#fef3c7','#92400e'],
    red:    ['#fee2e2','#991b1b'],
    sky:    ['#e0f2fe','#0369a1'],
    violet: ['#ede9fe','#5b21b6'],
    gray:   ['#f3f4f6','#374151'],
    orange: ['#ffedd5','#9a3412'],
  };
  const [bg, fg] = map[color];
  return <span style={{ background: bg, color: fg, fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 99, whiteSpace: 'nowrap' }}>{label}</span>;
}

function PageHdr({ title, action }: { title: string; action?: string }) {
  return (
    <div style={{ background: JADE, padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>{title}</span>
      {action && <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 9, border: '1px solid rgba(255,255,255,0.35)', borderRadius: 5, padding: '2px 8px' }}>+ {action}</span>}
    </div>
  );
}

function TH({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: '5px 10px', textAlign: 'left', fontSize: 8, fontWeight: 600, color: SUBTXT, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f9fafb', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>{children}</th>;
}
function TD({ children, right, mono, dim }: { children: React.ReactNode; right?: boolean; mono?: boolean; dim?: boolean }) {
  return <td style={{ padding: '5px 10px', fontSize: 9.5, color: dim ? SUBTXT : '#1f2937', textAlign: right ? 'right' : 'left', fontVariantNumeric: mono ? 'tabular-nums' : 'normal', fontFamily: mono ? 'monospace' : 'inherit', whiteSpace: 'nowrap' }}>{children}</td>;
}
function TR({ children, stripe }: { children: React.ReactNode; stripe?: boolean }) {
  return <tr style={{ background: stripe ? '#f9fafb' : '#fff', borderBottom: `1px solid ${BORDER}` }}>{children}</tr>;
}

/* ─── Individual screen mockups ────────────────────────────────────────────── */

export function DashboardMockup() {
  return (
    <MockScreen title="Finance Dashboard" height={320}>
      <PageHdr title="Finance Dashboard" action="EOD Post" />
      <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* KPI row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
          <Kpi label="Revenue YTD" value="₦4,280,000" sub="↑ 12% vs last month" />
          <Kpi label="Expenses YTD" value="₦2,140,000" sub="↑ 8% vs last month" accent={GOLD} />
          <Kpi label="Net Profit" value="₦2,140,000" sub="50.0% margin" />
          <Kpi label="Cash Balance" value="₦890,500" sub="As of today" accent="#0369a1" />
        </div>
        {/* KPI row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
          <Kpi label="Receivables (AR)" value="₦340,000" sub="3 overdue invoices" accent="#dc2626" />
          <Kpi label="Payables (AP)" value="₦120,000" sub="2 vendors pending" accent="#7c3aed" />
          <Kpi label="Fixed Assets NBV" value="₦1,840,000" sub="8 active assets" />
        </div>
        {/* Chart + recent entries */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 6 }}>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: 8 }}>
            <p style={{ fontSize: 9, fontWeight: 600, color: MUTED, margin: '0 0 6px' }}>Rev vs Exp — 6 Months</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 52 }}>
              {[{r:65,e:48,m:'F'},{r:80,e:55,m:'M'},{r:72,e:50,m:'A'},{r:90,e:62,m:'M'},{r:85,e:58,m:'J'},{r:100,e:68,m:'J'}].map(({r,e,m}) => (
                <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                    <div style={{ flex:1, borderRadius: '2px 2px 0 0', background: JADE, height: r * 0.48, opacity: 0.85 }} />
                    <div style={{ flex:1, borderRadius: '2px 2px 0 0', background: GOLD, height: e * 0.48, opacity: 0.7 }} />
                  </div>
                  <span style={{ fontSize: 7, color: SUBTXT }}>{m}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 8, color: SUBTXT, display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: JADE, display: 'inline-block' }}/>Rev</span>
              <span style={{ fontSize: 8, color: SUBTXT, display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: GOLD, display: 'inline-block' }}/>Exp</span>
            </div>
          </div>
          <div style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, overflow: 'hidden' }}>
            <p style={{ fontSize: 9, fontWeight: 600, color: MUTED, padding: '6px 8px', borderBottom: `1px solid ${BORDER}`, margin: 0 }}>Recent Journals</p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {[['JNL-124','Sales Invoice','Chidi Okonkwo Ltd','POSTED','125,000'],
                  ['JNL-125','Cash Payment','Office Rent — Jul','POSTED','85,000'],
                  ['JNL-126','Purchase Invoice','Lagos Supplies Co.','DRAFT','48,000'],
                ].map(([ref,type,desc,s,amt],i)=>(
                  <TR key={ref} stripe={i%2===1}>
                    <TD dim mono>{ref}</TD>
                    <TD>{type}</TD>
                    <TD><Pill label={s} color={s==='POSTED'?'green':'amber'}/></TD>
                    <TD right mono>₦{amt}</TD>
                  </TR>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MockScreen>
  );
}

export function ChartOfAccountsMockup() {
  return (
    <MockScreen title="Chart of Accounts" height={280}>
      <PageHdr title="Chart of Accounts" action="Add Account" />
      {/* Type filter pills */}
      <div style={{ padding: '8px 12px', display: 'flex', gap: 5, background: '#fff', borderBottom: `1px solid ${BORDER}` }}>
        {[['All','#0d6b54','#e6f5f1'],['Asset','#0369a1','#e0f2fe'],['Liability','#b45309','#fef3c7'],['Equity','#7c3aed','#ede9fe'],['Income','#065f46','#d1fae5'],['Expense','#9a3412','#ffedd5']].map(([l,fg,bg])=>(
          <span key={l} style={{ fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: l==='All'?JADE:bg, color: l==='All'?'#fff':fg, cursor:'pointer' }}>{l}</span>
        ))}
      </div>
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <TH>Code</TH><TH>Account Name</TH><TH>Type</TH><TH>Parent</TH><TH>Balance</TH>
            </tr>
          </thead>
          <tbody>
            {[
              ['1110','Cash on Hand','ASSET','','890,500'],
              ['1120','GTBank Current Account','ASSET','Bank Accounts','1,240,800'],
              ['1130','Opay Business Wallet','ASSET','Bank Accounts','215,000'],
              ['1310','Stock / Inventory','ASSET','','420,000'],
              ['1610','Property & Equipment','ASSET','','2,100,000'],
              ['2110','Accounts Payable','LIABILITY','','120,000'],
              ['2200','VAT Payable (Output)','LIABILITY','','64,200'],
              ['3100','Owner\'s Capital','EQUITY','','3,500,000'],
              ['4100','Sales Revenue','INCOME','','4,280,000'],
              ['5100','Cost of Goods Sold','EXPENSE','','1,420,000'],
              ['6100','Salaries & Wages','EXPENSE','','480,000'],
              ['6700','Depreciation Expense','EXPENSE','','72,000'],
            ].map(([code,name,type,parent,bal],i)=>{
              const col: Record<string,any> = {ASSET:'sky',LIABILITY:'amber',EQUITY:'violet',INCOME:'green',EXPENSE:'orange'};
              return (
                <TR key={code} stripe={i%2===1}>
                  <TD mono dim>{code}</TD>
                  <TD>{name}</TD>
                  <TD><Pill label={type} color={col[type]}/></TD>
                  <TD dim>{parent}</TD>
                  <TD right mono>₦{bal}</TD>
                </TR>
              );
            })}
          </tbody>
        </table>
      </div>
    </MockScreen>
  );
}

export function JournalEntriesMockup() {
  return (
    <MockScreen title="Journal Entries" height={280}>
      <PageHdr title="Journal Entries" action="New Entry" />
      <div style={{ padding: '8px 12px', background:'#fff', borderBottom:`1px solid ${BORDER}`, display:'flex', gap:6, alignItems:'center' }}>
        <span style={{ fontSize:9, padding:'3px 8px', borderRadius:5, border:`1px solid ${BORDER}`, color:MUTED }}>🔍 Search entries…</span>
        <span style={{ fontSize:9, padding:'3px 8px', borderRadius:5, border:`1px solid ${BORDER}`, color:MUTED }}>Type ▾</span>
        <span style={{ fontSize:9, padding:'3px 8px', borderRadius:5, border:`1px solid ${BORDER}`, color:MUTED }}>Status ▾</span>
        <span style={{ fontSize:9, padding:'3px 8px', borderRadius:5, border:`1px solid ${BORDER}`, color:MUTED }}>Jul 2025 ▾</span>
        <span style={{ marginLeft:'auto', fontSize:9, padding:'3px 8px', borderRadius:5, background:JADE, color:'#fff' }}>Import CSV</span>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr><TH>Entry #</TH><TH>Date</TH><TH>Type</TH><TH>Description</TH><TH>Status</TH><TH>Amount</TH></tr>
        </thead>
        <tbody>
          {[
            ['JNL-0128','03 Jul','Sales Invoice','Chidi Okonkwo Ltd — Inv#001','POSTED','125,000',false],
            ['JNL-0127','03 Jul','Cash Payment','Office Supplies — Staples Ng','POSTED','12,500',false],
            ['JNL-0126','02 Jul','Purchase Invoice','Dangote Cement — Bill#C22','POSTED','320,000',false],
            ['JNL-0125','02 Jul','Bank Deposit','Customer Payment — TF Ref 99','POSTED','200,000',false],
            ['JNL-0124','01 Jul','Expense Claim','Fuel — Staff Vehicles Jul','DRAFT','48,000',true],
            ['JNL-0123','01 Jul','Sales Receipt','Ngozi Adeyemi — Cash Sale','POSTED','35,000',false],
            ['JNL-0122','01 Jul','General Journal','Opening Balance Adjustment','POSTED','500,000',false],
          ].map(([ref,date,type,desc,status,amt,draft],i)=>(
            <TR key={String(ref)} stripe={i%2===1}>
              <TD mono dim>{ref}</TD>
              <TD dim>{date}</TD>
              <TD>{type}</TD>
              <TD>{desc}</TD>
              <TD><Pill label={status as string} color={draft?'amber':'green'}/></TD>
              <TD right mono>₦{amt}</TD>
            </TR>
          ))}
        </tbody>
      </table>
    </MockScreen>
  );
}

export function SalesBookMockup() {
  return (
    <MockScreen title="Sales Book" height={280}>
      <PageHdr title="Sales Book" action="Record Sale" />
      <div style={{ padding: 10, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, background:'#fff', borderBottom:`1px solid ${BORDER}` }}>
        <Kpi label="Total Sales" value="₦1,284,000" sub="This month" />
        <Kpi label="VAT Collected" value="₦192,600" sub="Output VAT" accent={GOLD} />
        <Kpi label="Invoices (Credit)" value="24" sub="₦840,000 outstanding" accent="#7c3aed"/>
        <Kpi label="Receipts (Cash)" value="31" sub="₦444,000 received" />
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><TH>Ref</TH><TH>Date</TH><TH>Customer</TH><TH>Type</TH><TH>Net</TH><TH>VAT</TH><TH>Total</TH></tr></thead>
        <tbody>
          {[
            ['INV-024','03 Jul','Chidi Okonkwo Ltd','INVOICE','113,636','11,364','125,000'],
            ['RCP-089','03 Jul','Ngozi Adeyemi','RECEIPT','31,818','3,182','35,000'],
            ['INV-023','02 Jul','Kemi Fabrics Ltd','INVOICE','227,273','22,727','250,000'],
            ['RCP-088','02 Jul','Walk-in Customer','RECEIPT','45,455','4,545','50,000'],
            ['INV-022','01 Jul','Abubakar Stores','INVOICE','90,909','9,091','100,000'],
            ['RCP-087','01 Jul','Adaora Nwosu','RECEIPT','63,636','6,364','70,000'],
          ].map(([ref,date,cust,type,net,vat,total],i)=>(
            <TR key={ref} stripe={i%2===1}>
              <TD mono dim>{ref}</TD>
              <TD dim>{date}</TD>
              <TD>{cust}</TD>
              <TD><Pill label={type} color={type==='INVOICE'?'violet':'sky'}/></TD>
              <TD right mono>₦{net}</TD>
              <TD right mono>₦{vat}</TD>
              <td style={{ padding:'5px 10px', fontSize:9.5, textAlign:'right', fontVariantNumeric:'tabular-nums', fontFamily:'monospace', fontWeight:600, color:JADE, whiteSpace:'nowrap' }}>₦{total}</td>
            </TR>
          ))}
        </tbody>
      </table>
    </MockScreen>
  );
}

export function PurchaseBookMockup() {
  return (
    <MockScreen title="Purchase Book" height={270}>
      <PageHdr title="Purchase Book" action="Record Purchase" />
      <div style={{ padding: 10, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, background:'#fff', borderBottom:`1px solid ${BORDER}` }}>
        <Kpi label="Total Purchases" value="₦820,000" sub="This month" accent="#dc2626" />
        <Kpi label="VAT Paid" value="₦123,000" sub="Input VAT" accent={GOLD} />
        <Kpi label="Unpaid Bills" value="₦320,000" sub="2 vendors" accent="#7c3aed" />
        <Kpi label="Paid This Month" value="₦500,000" sub="3 payments" />
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><TH>Ref</TH><TH>Date</TH><TH>Vendor</TH><TH>Type</TH><TH>Amount</TH><TH>Status</TH></tr></thead>
        <tbody>
          {[
            ['BILL-041','03 Jul','Dangote Cement Ltd','INVOICE','320,000','UNPAID'],
            ['PMT-012','03 Jul','Lagos Supplies Co.','PAYMENT','125,000','PAID'],
            ['BILL-040','02 Jul','Okafor Electricals','INVOICE','85,000','UNPAID'],
            ['PMT-011','02 Jul','FirstBank Loan','PAYMENT','200,000','PAID'],
            ['BILL-039','01 Jul','MRS Petroleum Ng','INVOICE','48,000','PAID'],
            ['DBN-003','01 Jul','Lagos Supplies Co.','DEBIT NOTE','15,000','APPLIED'],
          ].map(([ref,date,vendor,type,amt,status],i)=>{
            const smap: Record<string,any> = {UNPAID:'red',PAID:'green',APPLIED:'sky'};
            const tmap: Record<string,any> = {INVOICE:'orange',PAYMENT:'sky',['DEBIT NOTE']:'violet'};
            return (
              <TR key={ref} stripe={i%2===1}>
                <TD mono dim>{ref}</TD>
                <TD dim>{date}</TD>
                <TD>{vendor}</TD>
                <TD><Pill label={type} color={tmap[type]||'gray'}/></TD>
                <TD right mono>₦{amt}</TD>
                <TD><Pill label={status} color={smap[status]||'gray'}/></TD>
              </TR>
            );
          })}
        </tbody>
      </table>
    </MockScreen>
  );
}

export function CashBookMockup() {
  return (
    <MockScreen title="Cash Book" height={260}>
      <PageHdr title="Cash Book" />
      <div style={{ padding:'6px 12px', background:'#fff', borderBottom:`1px solid ${BORDER}`, display:'flex', gap:6 }}>
        <span style={{ fontSize:9, padding:'3px 8px', borderRadius:5, border:`1px solid ${BORDER}`, color:MUTED }}>01 Jul 2025</span>
        <span style={{ fontSize:9, color:MUTED, alignSelf:'center' }}>→</span>
        <span style={{ fontSize:9, padding:'3px 8px', borderRadius:5, border:`1px solid ${BORDER}`, color:MUTED }}>31 Jul 2025</span>
        <span style={{ fontSize:9, padding:'3px 10px', borderRadius:5, background:JADE, color:'#fff', cursor:'pointer' }}>Load</span>
        <span style={{ marginLeft:'auto', fontSize:9, padding:'3px 8px', borderRadius:5, border:`1px solid ${BORDER}`, color:MUTED }}>🖨 Print</span>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><TH>Date</TH><TH>Description</TH><TH>Type</TH><TH>Receipts (+)</TH><TH>Payments (−)</TH><TH>Balance</TH></tr></thead>
        <tbody>
          {[
            ['','Opening Balance','','','','750,000','',''],
            ['01 Jul','Sales — Walk-in','RECEIPT','35,000','','785,000'],
            ['01 Jul','Office Supplies','PAYMENT','','12,500','772,500'],
            ['02 Jul','Cash Sales — Jul 2','RECEIPT','50,000','','822,500'],
            ['02 Jul','Petrol — Generator','PAYMENT','','8,000','814,500'],
            ['03 Jul','Cash Sales — Jul 3','RECEIPT','70,000','','884,500'],
            ['03 Jul','Staff Lunch','PAYMENT','','6,000','878,500'],
          ].map(([date,desc,type,rec,pay,bal],i)=>{
            const isOpen = !date;
            return (
              <tr key={i} style={{ background: isOpen ? JADE_LT : i%2===1?'#f9fafb':'#fff', borderBottom:`1px solid ${BORDER}`, fontWeight: isOpen?700:'normal' }}>
                <td style={{ padding:'5px 10px', fontSize:9, color:SUBTXT, whiteSpace:'nowrap' }}>{date}</td>
                <td style={{ padding:'5px 10px', fontSize:9.5, color:isOpen?JADE:'#1f2937' }}>{desc}</td>
                <td style={{ padding:'5px 10px', fontSize:9 }}>{type && <Pill label={type} color={type==='RECEIPT'?'green':'red'}/>}</td>
                <td style={{ padding:'5px 10px', fontSize:9.5, textAlign:'right', fontVariantNumeric:'tabular-nums', color:'#065f46', fontFamily:'monospace' }}>{rec && `₦${rec}`}</td>
                <td style={{ padding:'5px 10px', fontSize:9.5, textAlign:'right', fontVariantNumeric:'tabular-nums', color:'#991b1b', fontFamily:'monospace' }}>{pay && `₦${pay}`}</td>
                <td style={{ padding:'5px 10px', fontSize:9.5, textAlign:'right', fontVariantNumeric:'tabular-nums', fontWeight:600, color:JADE, fontFamily:'monospace' }}>₦{bal}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </MockScreen>
  );
}

export function BankBookMockup() {
  return (
    <MockScreen title="Bank Book" height={268}>
      <PageHdr title="Bank Book" />
      {/* Account tabs */}
      <div style={{ background:'#fff', borderBottom:`1px solid ${BORDER}`, display:'flex', gap:0 }}>
        {[['GTBank Current','#0d6b54','#e6f5f1',true],['Opay Wallet','#374151','#f9fafb',false],['First Bank Savings','#374151','#f9fafb',false]].map(([name,fg,bg,active])=>(
          <span key={name as string} style={{ fontSize:9, fontWeight: active?700:400, padding:'7px 12px', color:fg as string, background: active ? JADE_LT : bg as string, borderBottom: active?`2px solid ${JADE}`:'2px solid transparent', cursor:'pointer', whiteSpace:'nowrap' }}>{name as string}</span>
        ))}
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><TH>Date</TH><TH>Description</TH><TH>Reference</TH><TH>Deposits (+)</TH><TH>Withdrawals (−)</TH><TH>Balance</TH></tr></thead>
        <tbody>
          {[
            ['','Opening Balance','','','','1,100,000'],
            ['01 Jul','Transfer from Opay','TRF/OPY/001','200,000','','1,300,000'],
            ['02 Jul','NPOWER Salary Pmt','NXP/GL/0012','','480,000','820,000'],
            ['02 Jul','Customer TF — Kemi Fab','TRF/KF/5841','250,000','','1,070,000'],
            ['03 Jul','Dangote Cement Bill Pmt','CHQ/DC/112','','320,000','750,000'],
            ['03 Jul','Daily POS Collections','POS/COL/07','120,000','','870,000'],
          ].map(([date,desc,ref,dep,wd,bal],i)=>{
            const isOpen = !date;
            return (
              <tr key={i} style={{ background: isOpen?JADE_LT:i%2===1?'#f9fafb':'#fff', borderBottom:`1px solid ${BORDER}`, fontWeight:isOpen?700:'normal' }}>
                <td style={{ padding:'5px 10px', fontSize:9, color:SUBTXT }}>{date}</td>
                <td style={{ padding:'5px 10px', fontSize:9.5, color:isOpen?JADE:'#1f2937' }}>{desc}</td>
                <td style={{ padding:'5px 10px', fontSize:8.5, color:SUBTXT, fontFamily:'monospace' }}>{ref}</td>
                <td style={{ padding:'5px 10px', fontSize:9.5, textAlign:'right', fontVariantNumeric:'tabular-nums', color:'#065f46', fontFamily:'monospace' }}>{dep && `₦${dep}`}</td>
                <td style={{ padding:'5px 10px', fontSize:9.5, textAlign:'right', fontVariantNumeric:'tabular-nums', color:'#991b1b', fontFamily:'monospace' }}>{wd && `₦${wd}`}</td>
                <td style={{ padding:'5px 10px', fontSize:9.5, textAlign:'right', fontVariantNumeric:'tabular-nums', fontWeight:600, color:JADE, fontFamily:'monospace' }}>₦{bal}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </MockScreen>
  );
}

export function VendorsMockup() {
  return (
    <MockScreen title="Vendors" height={250}>
      <PageHdr title="Vendors" action="Add Vendor" />
      <div style={{ padding:'6px 12px', background:'#fff', borderBottom:`1px solid ${BORDER}` }}>
        <span style={{ fontSize:9, padding:'3px 10px', borderRadius:5, border:`1px solid ${BORDER}`, color:MUTED }}>🔍 Search vendors…</span>
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><TH>Vendor Name</TH><TH>Email</TH><TH>Phone</TH><TH>Tax ID</TH><TH>Outstanding AP</TH></tr></thead>
        <tbody>
          {[
            ['Dangote Cement Ltd','sales@dangote.ng','0800-DANGOTE','RC123456','₦320,000'],
            ['Lagos Supplies Co.','info@lagossup.ng','080-2345-6789','RC654321','₦0'],
            ['Okafor Electricals','okafor@elec.ng','080-8765-4321','RC987654','₦85,000'],
            ['MRS Petroleum Ng','mrs@petroleum.ng','080-1111-2222','RC111222','₦0'],
            ['Usman Fabrics Ltd','usman@fabrics.ng','080-3333-4444','RC333444','₦0'],
            ['FirstBank Loan Dept','loans@firstbank.ng','01-234-5678','RC000001','₦200,000'],
          ].map(([name,email,phone,tax,ap],i)=>(
            <TR key={name} stripe={i%2===1}>
              <TD><span style={{ fontWeight:600, color:'#111827' }}>{name}</span></TD>
              <TD dim>{email}</TD>
              <TD dim>{phone}</TD>
              <TD dim>{tax}</TD>
              <TD right mono><span style={{ color: ap==='₦0'?JADE:'#dc2626', fontWeight:600 }}>{ap}</span></TD>
            </TR>
          ))}
        </tbody>
      </table>
    </MockScreen>
  );
}

export function DebtorsMockup() {
  return (
    <MockScreen title="Debtors / Accounts Receivable" height={280}>
      <PageHdr title="Debtors — Accounts Receivable" />
      {/* Aging cards */}
      <div style={{ padding:10, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, background:'#fff', borderBottom:`1px solid ${BORDER}` }}>
        <Kpi label="Current (0–30d)" value="₦180,000" sub="2 customers" />
        <Kpi label="31–60 Days" value="₦95,000" sub="1 customer" accent={GOLD} />
        <Kpi label="61–90 Days" value="₦45,000" sub="1 customer" accent="#f97316" />
        <Kpi label="90+ Days" value="₦20,000" sub="1 customer — urgent" accent="#dc2626" />
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><TH>Customer</TH><TH>Total AR</TH><TH>Current</TH><TH>31–60d</TH><TH>61–90d</TH><TH>90+ Days</TH></tr></thead>
        <tbody>
          {[
            ['Chidi Okonkwo Ltd','125,000','125,000','—','—','—'],
            ['Kemi Fabrics Ltd','95,000','55,000','40,000','—','—'],
            ['Abubakar Stores','90,000','—','55,000','35,000','—'],
            ['Adaora Nwosu','50,000','—','—','10,000','40,000'],
            ['Emeka Pharma Co.','20,000','—','—','—','20,000'],
          ].map(([cust,total,...ages],i)=>(
            <TR key={cust} stripe={i%2===1}>
              <TD>{cust}</TD>
              <TD right mono><span style={{ fontWeight:700, color:JADE }}>₦{total}</span></TD>
              <td style={{ padding:'5px 10px', textAlign:'right', fontVariantNumeric:'tabular-nums', fontFamily:'monospace', fontSize:9.5, color: ages[0]==='—'?SUBTXT:'#065f46' }}>₦{ages[0]}</td>
              <td style={{ padding:'5px 10px', textAlign:'right', fontVariantNumeric:'tabular-nums', fontFamily:'monospace', fontSize:9.5, color: ages[1]==='—'?SUBTXT:'#92400e' }}>₦{ages[1]}</td>
              <td style={{ padding:'5px 10px', textAlign:'right', fontVariantNumeric:'tabular-nums', fontFamily:'monospace', fontSize:9.5, color: ages[2]==='—'?SUBTXT:'#c2410c' }}>₦{ages[2]}</td>
              <td style={{ padding:'5px 10px', textAlign:'right', fontVariantNumeric:'tabular-nums', fontFamily:'monospace', fontSize:9.5, color: ages[3]==='—'?SUBTXT:'#991b1b', fontWeight: ages[3]!=='—'?700:'normal' }}>₦{ages[3]}</td>
            </TR>
          ))}
        </tbody>
      </table>
    </MockScreen>
  );
}

export function CreditorsMockup() {
  return (
    <MockScreen title="Creditors / Accounts Payable" height={270}>
      <PageHdr title="Creditors — Accounts Payable" />
      <div style={{ padding:10, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, background:'#fff', borderBottom:`1px solid ${BORDER}` }}>
        <Kpi label="Current (0–30d)" value="₦85,000" sub="1 vendor" />
        <Kpi label="31–60 Days" value="₦35,000" sub="1 vendor" accent={GOLD} />
        <Kpi label="61–90 Days" value="₦0" sub="None" accent="#f97316" />
        <Kpi label="90+ Days" value="₦0" sub="None" accent="#dc2626" />
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><TH>Vendor</TH><TH>Total AP</TH><TH>Current</TH><TH>31–60d</TH><TH>61–90d</TH><TH>90+ Days</TH></tr></thead>
        <tbody>
          {[
            ['Dangote Cement Ltd','320,000','320,000','—','—','—'],
            ['Okafor Electricals','85,000','85,000','—','—','—'],
            ['Lagos Supplies Co.','35,000','—','35,000','—','—'],
          ].map(([vendor,total,...ages],i)=>(
            <TR key={vendor} stripe={i%2===1}>
              <TD>{vendor}</TD>
              <TD right mono><span style={{ fontWeight:700, color:'#dc2626' }}>₦{total}</span></TD>
              <td style={{ padding:'5px 10px', textAlign:'right', fontVariantNumeric:'tabular-nums', fontFamily:'monospace', fontSize:9.5, color: ages[0]==='—'?SUBTXT:'#065f46' }}>₦{ages[0]}</td>
              <td style={{ padding:'5px 10px', textAlign:'right', fontVariantNumeric:'tabular-nums', fontFamily:'monospace', fontSize:9.5, color: ages[1]==='—'?SUBTXT:'#92400e' }}>₦{ages[1]}</td>
              <td style={{ padding:'5px 10px', textAlign:'right', fontVariantNumeric:'tabular-nums', fontFamily:'monospace', fontSize:9.5, color: ages[2]==='—'?SUBTXT:'#c2410c' }}>₦{ages[2]}</td>
              <td style={{ padding:'5px 10px', textAlign:'right', fontVariantNumeric:'tabular-nums', fontFamily:'monospace', fontSize:9.5, color: ages[3]==='—'?SUBTXT:'#991b1b' }}>₦{ages[3]}</td>
            </TR>
          ))}
        </tbody>
      </table>
    </MockScreen>
  );
}

export function ExpensesMockup() {
  return (
    <MockScreen title="Expenses" height={290}>
      <PageHdr title="Expenses" action="Add Expense" />
      <div style={{ padding:10, display:'grid', gridTemplateColumns:'1fr 1.3fr', gap:8 }}>
        {/* Category chart */}
        <div style={{ background:'#fff', border:`1px solid ${BORDER}`, borderRadius:8, padding:10 }}>
          <p style={{ margin:'0 0 8px', fontSize:9, fontWeight:600, color:MUTED }}>By Category — July 2025</p>
          <Bar label="Salaries & Wages" value={420000} max={500000} color={JADE} />
          <Bar label="Rent & Utilities" value={170000} max={500000} color="#0369a1" />
          <Bar label="Transport & Fuel" value={65000} max={500000} color={GOLD} />
          <Bar label="Office Supplies" value={32000} max={500000} color="#7c3aed" />
          <Bar label="Marketing" value={25000} max={500000} color="#f97316" />
          <Bar label="Miscellaneous" value={18000} max={500000} color="#6b7280" />
          <p style={{ marginTop:8, fontSize:9, fontWeight:700, color:JADE }}>Total: ₦730,000</p>
        </div>
        {/* Expense list */}
        <div style={{ background:'#fff', border:`1px solid ${BORDER}`, borderRadius:8, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr><TH>Date</TH><TH>Description</TH><TH>Category</TH><TH>Amount</TH></tr></thead>
            <tbody>
              {[
                ['03 Jul','Office Stationery','Office Supplies','12,500'],
                ['03 Jul','Generator Diesel','Transport & Fuel','18,000'],
                ['02 Jul','NPOWER — Jul Salaries','Salaries & Wages','420,000'],
                ['02 Jul','Lagos Office Rent','Rent & Utilities','120,000'],
                ['01 Jul','EKEDC Electricity','Rent & Utilities','28,500'],
                ['01 Jul','Staff Transportation','Transport & Fuel','15,000'],
              ].map(([date,desc,cat,amt],i)=>(
                <TR key={i} stripe={i%2===1}>
                  <TD dim>{date}</TD>
                  <TD>{desc}</TD>
                  <TD><span style={{ fontSize:8, background:JADE_LT, color:JADE, padding:'2px 6px', borderRadius:4, fontWeight:600 }}>{cat}</span></TD>
                  <TD right mono>₦{amt}</TD>
                </TR>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MockScreen>
  );
}

export function FixedAssetsMockup() {
  return (
    <MockScreen title="Fixed Assets" height={270}>
      <PageHdr title="Fixed Assets Register" action="Add Asset" />
      {/* Tabs */}
      <div style={{ background:'#fff', borderBottom:`1px solid ${BORDER}`, display:'flex' }}>
        {[['Asset Register',true],['Depreciation',false],['Disposals',false]].map(([t,a])=>(
          <span key={t as string} style={{ fontSize:9, fontWeight:a?700:400, padding:'7px 14px', color:a?JADE:MUTED, borderBottom:a?`2px solid ${JADE}`:'2px solid transparent', cursor:'pointer' }}>{t as string}</span>
        ))}
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><TH>Code</TH><TH>Asset Name</TH><TH>Category</TH><TH>Acq. Cost</TH><TH>Accum. Dep.</TH><TH>Net Book Value</TH><TH>Monthly Dep.</TH></tr></thead>
        <tbody>
          {[
            ['FA-001','Company Van — Lagos','Motor Vehicles','2,500,000','875,000','1,625,000','34,722'],
            ['FA-002','HP LaserJet 408dn','Computer Equipment','185,000','61,667','123,333','5,139'],
            ['FA-003','Office Furniture Set','Furniture & Fittings','320,000','53,333','266,667','5,333'],
            ['FA-004','Mikano Generator 50KVA','Plant & Machinery','1,200,000','200,000','1,000,000','20,000'],
            ['FA-005','Lagos Office Leasehold','Leasehold Improvements','850,000','141,667','708,333','14,167'],
          ].map(([code,name,cat,cost,accum,nbv,monthly],i)=>(
            <TR key={code} stripe={i%2===1}>
              <TD mono dim>{code}</TD>
              <TD>{name}</TD>
              <TD><span style={{ fontSize:8, background:'#f0fdf4', color:'#166534', padding:'2px 6px', borderRadius:4, fontWeight:600, whiteSpace:'nowrap' }}>{cat}</span></TD>
              <TD right mono>₦{cost}</TD>
              <TD right mono><span style={{ color:'#991b1b' }}>(₦{accum})</span></TD>
              <TD right mono><span style={{ color:JADE, fontWeight:700 }}>₦{nbv}</span></TD>
              <TD right mono><span style={{ color:'#0369a1' }}>₦{monthly}</span></TD>
            </TR>
          ))}
        </tbody>
      </table>
    </MockScreen>
  );
}

export function BankReconciliationMockup() {
  return (
    <MockScreen title="Bank Reconciliation" height={290}>
      <PageHdr title="Bank Reconciliation" action="Import Statement" />
      {/* Progress bar */}
      <div style={{ background:'#fff', borderBottom:`1px solid ${BORDER}`, padding:'6px 12px', display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:9, color:MUTED }}>GTBank Jul 2025</span>
        <div style={{ flex:1, height:6, borderRadius:99, background:'#e5e7eb' }}>
          <div style={{ width:'73%', height:'100%', borderRadius:99, background:JADE }} />
        </div>
        <span style={{ fontSize:9, fontWeight:700, color:JADE }}>73% matched</span>
        <span style={{ fontSize:9, padding:'3px 8px', borderRadius:5, background:JADE, color:'#fff' }}>Auto-Match AI</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
        {/* Bank statement */}
        <div style={{ borderRight:`1px solid ${BORDER}` }}>
          <div style={{ padding:'5px 10px', background:'#f9fafb', borderBottom:`1px solid ${BORDER}`, fontSize:9, fontWeight:600, color:MUTED }}>BANK STATEMENT</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr><TH>Date</TH><TH>Description</TH><TH>Amount</TH></tr></thead>
            <tbody>
              {[
                ['03 Jul','TRANSFER CR — Kemi Fab','250,000','green','✓ Matched'],
                ['03 Jul','CHEQUE DR — Dangote','320,000','red','✓ Matched'],
                ['03 Jul','POS COLLECTIONS CR','120,000','green','✓ Matched'],
                ['02 Jul','SALARY TRANSFER DR','480,000','red','✗ Unmatched'],
                ['02 Jul','NIP CR — Customer','200,000','green','✓ Matched'],
              ].map(([date,desc,amt,sign,status],i)=>(
                <TR key={i} stripe={i%2===1}>
                  <TD dim>{date}</TD>
                  <td style={{ padding:'5px 10px', fontSize:9, color:'#111', maxWidth:110, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{desc}</td>
                  <td style={{ padding:'5px 10px', fontSize:9, textAlign:'right', fontFamily:'monospace', color:sign==='green'?'#065f46':'#991b1b', fontWeight:600 }}>{sign==='green'?'+':'−'}₦{amt}</td>
                </TR>
              ))}
            </tbody>
          </table>
        </div>
        {/* GL entries */}
        <div>
          <div style={{ padding:'5px 10px', background:'#f9fafb', borderBottom:`1px solid ${BORDER}`, fontSize:9, fontWeight:600, color:MUTED }}>GL JOURNAL ENTRIES</div>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr><TH>Date</TH><TH>Description</TH><TH>Amount</TH><TH>Status</TH></tr></thead>
            <tbody>
              {[
                ['03 Jul','Kemi Fab TF','250,000','green','✓'],
                ['03 Jul','Dangote Cement','320,000','green','✓'],
                ['03 Jul','POS Daily','120,000','green','✓'],
                ['02 Jul','Salary Run Jul','480,000','amber','?'],
                ['02 Jul','Cust NIP Payment','200,000','green','✓'],
              ].map(([date,desc,amt,c,status],i)=>(
                <TR key={i} stripe={i%2===1}>
                  <TD dim>{date}</TD>
                  <td style={{ padding:'5px 10px', fontSize:9, color:'#111' }}>{desc}</td>
                  <TD right mono>₦{amt}</TD>
                  <td style={{ padding:'5px 10px' }}><Pill label={status} color={c as any}/></td>
                </TR>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MockScreen>
  );
}

export function BudgetMockup() {
  return (
    <MockScreen title="Budget vs Actuals" height={280}>
      <PageHdr title="Budget vs Actuals — FY 2025" action="New Budget" />
      <div style={{ padding:10, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, background:'#fff', borderBottom:`1px solid ${BORDER}` }}>
        <Kpi label="Total Budgeted" value="₦8,400,000" sub="FY 2025" accent="#0369a1" />
        <Kpi label="YTD Actual" value="₦4,840,000" sub="Jan – Jul 2025" />
        <Kpi label="Utilisation" value="57.6%" sub="On track" accent={GOLD} />
        <Kpi label="Remaining" value="₦3,560,000" sub="5 months left" accent="#7c3aed" />
      </div>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><TH>Account</TH><TH>Annual Budget</TH><TH>YTD Actual</TH><TH>Variance</TH><TH>% Used</TH></tr></thead>
        <tbody>
          {[
            ['Sales Revenue','6,000,000','4,280,000','+28%','71%', true, JADE],
            ['Salaries & Wages','2,400,000','1,680,000','−1%','70%', false, JADE],
            ['Rent & Utilities','840,000','595,000','+5%','71%', false, JADE],
            ['Marketing & Ads','360,000','188,000','−22%','52%', true, GOLD],
            ['Transport & Fuel','180,000','145,500','+6%','81%', false, '#f97316'],
            ['Office & Admin','120,000','131,000','+9% ⚠','109%', false, '#dc2626'],
          ].map(([acc,budget,actual,var_,pct,pos,col],i)=>{
            const p = parseInt(pct as string);
            return (
              <TR key={acc as string} stripe={i%2===1}>
                <TD>{acc as string}</TD>
                <TD right mono>₦{budget as string}</TD>
                <TD right mono>₦{actual as string}</TD>
                <td style={{ padding:'5px 10px', fontSize:9.5, color:pos?'#065f46':'#991b1b', fontWeight:600, textAlign:'right', whiteSpace:'nowrap' }}>{var_ as string}</td>
                <td style={{ padding:'5px 10px', minWidth:80 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ flex:1, height:5, borderRadius:99, background:'#e5e7eb' }}>
                      <div style={{ width:`${Math.min(p,100)}%`, height:'100%', borderRadius:99, background:col as string }} />
                    </div>
                    <span style={{ fontSize:8.5, color:MUTED, whiteSpace:'nowrap' }}>{pct as string}</span>
                  </div>
                </td>
              </TR>
            );
          })}
        </tbody>
      </table>
    </MockScreen>
  );
}

export function RecurringJournalsMockup() {
  return (
    <MockScreen title="Recurring Journals" height={250}>
      <PageHdr title="Recurring Journals" action="New Recurring" />
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr><TH>Name</TH><TH>Frequency</TH><TH>Amount</TH><TH>Next Run</TH><TH>Run Count</TH><TH>Status</TH></tr></thead>
        <tbody>
          {[
            ['Monthly Office Rent','Monthly','₦120,000','01 Aug 2025','7','ACTIVE'],
            ['FirstBank Loan Repayment','Monthly','₦200,000','15 Aug 2025','7','ACTIVE'],
            ['EKEDC Electricity — Est.','Monthly','₦28,500','01 Aug 2025','7','ACTIVE'],
            ['Weekly Petty Cash Top-up','Weekly','₦15,000','07 Jul 2025','31','ACTIVE'],
            ['Annual Insurance Premium','Yearly','₦480,000','01 Jan 2026','1','ACTIVE'],
            ['Q3 FIRS VAT Filing','Quarterly','₦64,200','01 Oct 2025','2','ACTIVE'],
          ].map(([name,freq,amt,next,count,status],i)=>(
            <TR key={name as string} stripe={i%2===1}>
              <TD>{name as string}</TD>
              <TD><Pill label={freq as string} color={freq==='Monthly'?'sky':freq==='Weekly'?'green':freq==='Yearly'?'violet':'orange'}/></TD>
              <TD right mono><span style={{ fontWeight:600 }}>{amt as string}</span></TD>
              <TD dim>{next as string}</TD>
              <TD right dim>{count as string}</TD>
              <TD><Pill label={status as string} color="green"/></TD>
            </TR>
          ))}
        </tbody>
      </table>
    </MockScreen>
  );
}
