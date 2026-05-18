'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  IndianRupee, TrendingDown, TrendingUp, CheckCircle2, CreditCard,
  Loader2, FileText, FileSpreadsheet, ChevronDown, ChevronUp, X,
  Calendar, Filter, Search, SortDesc, SortAsc, Package, RefreshCw,
  Clock, User, Tag, ArrowUpDown, Download, Sparkles, ChevronRight
} from 'lucide-react';

import { useState, useEffect, useMemo } from 'react';
import { shopOwnerAPI } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

type Customer = { id: string; name: string; phone?: string };
type TxItem = { productName: string; quantity: number; unitPrice: number; subtotal: number };
type Transaction = {
  id: string; customerId: string; customerName: string; type: string;
  totalAmount: number; paidAmount: number; balance: number; status: string; date: string;
  items: TxItem[];
};
type Payment = {
  id: string; customerId: string; customerName: string;
  amount: number; paymentMethod: string; date: string; notes?: string;
};
type CombinedItem = (Transaction & { _type: 'credit'; _date: Date }) | (Payment & { _type: 'payment'; _date: Date });

// ---------- helpers ----------
const toIST = (d: string) => new Date(d);

const fmtDate = (d: string) =>
  toIST(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtTime = (d: string) =>
  toIST(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const fmtGroupKey = (d: string) => {
  const dt = toIST(d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (dt.toDateString() === today.toDateString()) return 'Today';
  if (dt.toDateString() === yesterday.toDateString()) return 'Yesterday';
  const diff = Math.floor((today.getTime() - dt.getTime()) / 86400000);
  if (diff < 7) return dt.toLocaleDateString('en-IN', { weekday: 'long' });
  return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
};

const fmtCurrency = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n.toLocaleString()}`;

const STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-primary dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-400/20',
  PARTIAL: 'bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-primary dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-400/20',
  PENDING: 'bg-red-500/10 text-red-500 border-red-500/20',
};

// ── Language Translations for PDF/Excel ──
const PDF_LANGUAGES: Record<string, { label: string; translations: Record<string, string> }> = {
  en: {
    label: 'English',
    translations: {
      title: 'SmartCredit - Transaction History',
      customer: 'Customer',
      period: 'Period',
      type: 'Type',
      credit: 'Credit',
      payment: 'Payment',
      creditGiven: 'Credit Given',
      paymentReceived: 'Payment Received',
      generated: 'Generated',
      date: 'Date',
      time: 'Time',
      details: 'Details',
      amount: 'Amount (Rs.)',
      status: 'Status',
      ref: 'Ref',
      totalCredit: 'Total Credit Given',
      totalCollected: 'Total Payments Collected',
      netOutstanding: 'Net Outstanding',
      totalRecords: 'Total Records',
      periodFilter: 'Period Filter',
      dateGenerated: 'Date Generated',
      itemsPurchased: 'Items',
      allCustomers: 'All Customers',
    },
  },
  hi: {
    label: 'हिंदी',
    translations: {
      title: 'SmartCredit - लेनदेन इतिहास',
      customer: 'ग्राहक',
      period: 'अवधि',
      type: 'प्रकार',
      credit: 'उधार',
      payment: 'भुगतान',
      creditGiven: 'दिया उधार',
      paymentReceived: 'प्राप्त भुगतान',
      generated: 'बनाया',
      date: 'तारीख',
      time: 'समय',
      details: 'विवरण',
      amount: 'राशि (रु.)',
      status: 'स्थिति',
      ref: 'रेफ',
      totalCredit: 'कुल उधार',
      totalCollected: 'कुल प्राप्त',
      netOutstanding: 'शेष बकाया',
      totalRecords: 'कुल रिकॉर्ड',
      periodFilter: 'अवधि फ़िल्टर',
      dateGenerated: 'बनाने की तारीख',
      itemsPurchased: 'सामान',
      allCustomers: 'सभी ग्राहक',
    },
  },
  gu: {
    label: 'ગુજરાતી',
    translations: {
      title: 'SmartCredit - વ્યવહારો ઇતિહાસ',
      customer: 'ગ્રાહક',
      period: 'સમયગાળો',
      type: 'પ્રકાર',
      credit: 'ઉધાર',
      payment: 'ચુકવણી',
      creditGiven: 'આપ્યો ઉધાર',
      paymentReceived: 'ચુકવણી મળ્યો',
      generated: 'બનાવ્યો',
      date: 'તારીખ',
      time: 'સમય',
      details: 'વિગત',
      amount: 'રકમ (રૂ.)',
      status: 'સ્થિતિ',
      ref: 'સંદર્ભ',
      totalCredit: 'કુલ ઉધાર',
      totalCollected: 'કુલ વસૂલ',
      netOutstanding: 'બાકી',
      totalRecords: 'કુલ નોંધ',
      periodFilter: 'સમય ફિલ્ટર',
      dateGenerated: 'બનાવ્યાની તારીખ',
      itemsPurchased: 'ચીજો',
      allCustomers: 'બધા ગ્રાહક',
    },
  },
  ta: {
    label: 'தமிழ்',
    translations: {
      title: 'SmartCredit - பரிவர்த்தனை வரலாறு',
      customer: 'வாடிக்கையாளர்',
      period: 'காலகட்டம்',
      type: 'வகை',
      credit: 'கடன்',
      payment: 'பணம்',
      creditGiven: 'கொடுக்கப்பட்ட கடன்',
      paymentReceived: 'பெற்ற பணம்',
      generated: 'உருவாக்கிய நேரம்',
      date: 'தேதி',
      time: 'நேரம்',
      details: 'விவரங்கள்',
      amount: 'தொகை (ரூ.)',
      status: 'நிலை',
      ref: 'குறிப்பு',
      totalCredit: 'மொத்த கடன்',
      totalCollected: 'மொத்த வசூல்',
      netOutstanding: 'நிலுவை',
      totalRecords: 'மொத்த பதிவுகள்',
      periodFilter: 'காலம் வடிகட்டி',
      dateGenerated: 'உருவாக்கிய தேதி',
      itemsPurchased: 'பொருட்கள்',
      allCustomers: 'அனைத்து வாடிக்கையாளர்கள்',
    },
  },
  te: {
    label: 'తెలుగు',
    translations: {
      title: 'SmartCredit - లావాదేవీ చరిత్ర',
      customer: 'కస్టమర్',
      period: 'కాలం',
      type: 'రకం',
      credit: 'అప్పు',
      payment: 'చెల్లింపు',
      creditGiven: 'ఇచ్చిన అప్పు',
      paymentReceived: 'వసూలు',
      generated: 'రూపొందించిన తేదీ',
      date: 'తేదీ',
      time: 'సమయం',
      details: 'వివరాలు',
      amount: 'మొత్తం (రూ.)',
      status: 'స్థితి',
      ref: 'సూచన',
      totalCredit: 'మొత్తం అప్పు',
      totalCollected: 'మొత్తం వసూలు',
      netOutstanding: 'మిగిలిన',
      totalRecords: 'మొత్తం రికార్డులు',
      periodFilter: 'కాల వడపోత',
      dateGenerated: 'రూపొందించిన తేదీ',
      itemsPurchased: 'వస్తువులు',
      allCustomers: 'అందరు కస్టమర్లు',
    },
  },
  kn: {
    label: 'ಕನ್ನಡ',
    translations: {
      title: 'SmartCredit - ವ್ಯವಹಾರ ಇತಿಹಾಸ',
      customer: 'ಗ್ರಾಹಕ',
      period: 'ಅವಧಿ',
      type: 'ವಿಧ',
      credit: 'ಸಾಲ',
      payment: 'ಪಾವತಿ',
      creditGiven: 'ನೀಡಿದ ಸಾಲ',
      paymentReceived: 'ಸ್ವೀಕಾರಿಸಿದ ಪಾವತಿ',
      generated: 'ರಚಿಸಿದ ದಿನಾಂಕ',
      date: 'ದಿನಾಂಕ',
      time: 'ಸಮಯ',
      details: 'ವಿವರ',
      amount: 'ಮೊತ್ತ (ರೂ.)',
      status: 'ಸ್ಥಿತಿ',
      ref: 'ಉಲ್ಲೇಖ',
      totalCredit: 'ಒಟ್ಟು ಸಾಲ',
      totalCollected: 'ಒಟ್ಟು ವಸೂಲು',
      netOutstanding: 'ಬಾಕಿ',
      totalRecords: 'ಒಟ್ಟು ದಾಖಲೆ',
      periodFilter: 'ಕಾಲ ಶೋಧನೆ',
      dateGenerated: 'ರಚಿಸಿದ ದಿನ',
      itemsPurchased: 'ವಸ್ತುಗಳು',
      allCustomers: 'ಎಲ್ಲಾ ಗ್ರಾಹಕರು',
    },
  },
  ml: {
    label: 'മലയാളം',
    translations: {
      title: 'SmartCredit - ഇടപാട് ചരിത്രം',
      customer: 'ഉപഭോക്താവ്',
      period: 'കാലയളവ്',
      type: 'തരം',
      credit: 'കടം',
      payment: 'പേയ്‌മെന്റ്',
      creditGiven: 'നൽകിയ കടം',
      paymentReceived: 'ലഭിച്ച പണം',
      generated: 'ഉണ്ടാക്കിയ തീയതി',
      date: 'തീയതി',
      time: 'സമയം',
      details: 'വിശദാംശങ്ങൾ',
      amount: 'തുക (രൂ.)',
      status: 'നില',
      ref: 'റഫ.',
      totalCredit: 'ആകെ കടം',
      totalCollected: 'ആകെ ശേഖരിച്ചത്',
      netOutstanding: 'ബാക്കി',
      totalRecords: 'ആകെ രേഖകൾ',
      periodFilter: 'കാല ഫിൽട്ടർ',
      dateGenerated: 'ഉണ്ടാക്കിയ ദിവസം',
      itemsPurchased: 'ഇനങ്ങൾ',
      allCustomers: 'എല്ലാ ഉപഭോക്താക്കൾ',
    },
  },
  mr: {
    label: 'मराठी',
    translations: {
      title: 'SmartCredit - व्यवहार इतिहास',
      customer: 'ग्राहक',
      period: 'कालावधी',
      type: 'प्रकार',
      credit: 'उधार',
      payment: 'देयक',
      creditGiven: 'दिलेला उधार',
      paymentReceived: 'प्राप्त देयक',
      generated: 'तयार केला',
      date: 'तारीख',
      time: 'वेळ',
      details: 'तपशील',
      amount: 'रक्कम (रु.)',
      status: 'स्थिती',
      ref: 'संदर्भ',
      totalCredit: 'एकूण उधार',
      totalCollected: 'एकूण जमा',
      netOutstanding: 'शिल्लक',
      totalRecords: 'एकूण नोंदी',
      periodFilter: 'काळ फिल्टर',
      dateGenerated: 'तयार तारीख',
      itemsPurchased: 'वस्तू',
      allCustomers: 'सर्व ग्राहक',
    },
  },
  pa: {
    label: 'ਪੰਜਾਬੀ',
    translations: {
      title: 'SmartCredit - ਲੈਣ-ਦੇਣ ਇਤਿਹਾਸ',
      customer: 'ਗਾਹਕ',
      period: 'ਸਮਾਂ',
      type: 'ਕਿਸਮ',
      credit: 'ਉਧਾਰ',
      payment: 'ਭੁਗਤਾਨ',
      creditGiven: 'ਦਿੱਤਾ ਉਧਾਰ',
      paymentReceived: 'ਮਿਲਿਆ ਭੁਗਤਾਨ',
      generated: 'ਬਣਾਇਆ',
      date: 'ਮਿਤੀ',
      time: 'ਸਮਾਂ',
      details: 'ਵੇਰਵਾ',
      amount: 'ਰਾਸ਼ੀ (ਰੁ.)',
      status: 'ਸਥਿਤੀ',
      ref: 'ਹਵਾਲਾ',
      totalCredit: 'ਕੁੱਲ ਉਧਾਰ',
      totalCollected: 'ਕੁੱਲ ਇਕੱਠਾ',
      netOutstanding: 'ਬਕਾਇਆ',
      totalRecords: 'ਕੁੱਲ ਰਿਕਾਰਡ',
      periodFilter: 'ਸਮਾਂ ਫਿਲਟਰ',
      dateGenerated: 'ਬਣਾਉਣ ਦੀ ਮਿਤੀ',
      itemsPurchased: 'ਵਸਤੂਆਂ',
      allCustomers: 'ਸਾਰੇ ਗਾਹਕ',
    },
  },
  bn: {
    label: 'বাংলা',
    translations: {
      title: 'SmartCredit - লেনদেন ইতিহাস',
      customer: 'গ্রাহক',
      period: 'সময়কাল',
      type: 'ধরন',
      credit: 'বাকি',
      payment: 'পেমেন্ট',
      creditGiven: 'দেওয়া বাকি',
      paymentReceived: 'প্রাপ্ত পেমেন্ট',
      generated: 'তৈরি হয়েছে',
      date: 'তারিখ',
      time: 'সময়',
      details: 'বিবরণ',
      amount: 'পরিমাণ (টা.)',
      status: 'অবস্থা',
      ref: 'রেফ',
      totalCredit: 'মোট বাকি',
      totalCollected: 'মোট সংগ্রহ',
      netOutstanding: 'বকেয়া',
      totalRecords: 'মোট রেকর্ড',
      periodFilter: 'সময় ফিল্টার',
      dateGenerated: 'তৈরির তারিখ',
      itemsPurchased: 'পণ্য',
      allCustomers: 'সকল গ্রাহক',
    },
  },
};

export default function ShopOwnerHistory() {
  const { language } = useLanguage(); // Get current website language
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Load appropriate Google Fonts for Unicode support
  useEffect(() => {
    const fontMap: Record<string, string> = {
      hi: 'Noto+Sans+Devanagari',
      gu: 'Noto+Sans+Gujarati',
      ta: 'Noto+Sans+Tamil',
      te: 'Noto+Sans+Telugu',
      kn: 'Noto+Sans+Kannada',
      ml: 'Noto+Sans+Malayalam',
      mr: 'Noto+Sans+Devanagari',
      pa: 'Noto+Sans+Gurmukhi',
      bn: 'Noto+Sans+Bengali',
    };

    const fontFamily = fontMap[language];
    if (fontFamily) {
      // Check if font link already exists
      const existingLink = document.getElementById('indian-lang-font');
      if (existingLink) {
        existingLink.remove();
      }

      // Add Google Font link
      const link = document.createElement('link');
      link.id = 'indian-lang-font';
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@400;500;600;700&display=swap`;
      document.head.appendChild(link);
    }
  }, [language]);

  // ── Filter state ──
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'payment'>('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | '3months' | 'year' | 'custom'>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [payMethodFilter, setPayMethodFilter] = useState('all');

  const fetchCustomers = async () => {
    try {
      const res = await shopOwnerAPI.getCustomers({ page: 1, limit: 1000 });
      setCustomers(res.data.customers || []);
    } catch {}
  };

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [txRes, payRes] = await Promise.all([
        shopOwnerAPI.getTransactions({ page: 1, limit: 500 }),
        shopOwnerAPI.getPayments({ page: 1, limit: 500 }),
      ]);
      setTransactions(txRes.data.transactions || []);
      setPayments(payRes.data.payments || []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.message || 'Failed to load', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    fetchCustomers();

    const onFocus = () => fetchAll();
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchAll(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Combined & filtered data ──
  const combined: CombinedItem[] = useMemo(() => [
    ...transactions.map(t => ({ ...t, _type: 'credit' as const, _date: new Date(t.date) })),
    ...payments.map(p => ({ ...p, _type: 'payment' as const, _date: new Date(p.date) })),
  ], [transactions, payments]);

  const filtered = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const presetStart = (): Date | null => {
      switch (datePreset) {
        case 'today': return today;
        case 'yesterday': { const d = new Date(today); d.setDate(d.getDate() - 1); return d; }
        case 'week': { const d = new Date(today); d.setDate(d.getDate() - 7); return d; }
        case 'month': { const d = new Date(today); d.setMonth(d.getMonth() - 1); return d; }
        case '3months': { const d = new Date(today); d.setMonth(d.getMonth() - 3); return d; }
        case 'year': { const d = new Date(today); d.setFullYear(d.getFullYear() - 1); return d; }
        case 'custom': return customStart ? new Date(customStart) : null;
        default: return null;
      }
    };
    const presetEnd = (): Date | null => {
      if (datePreset === 'yesterday') {
        const d = new Date(today); d.setHours(23, 59, 59, 999); d.setDate(d.getDate() - 1); return d;
      }
      if (datePreset === 'custom' && customEnd) {
        const d = new Date(customEnd); d.setHours(23, 59, 59, 999); return d;
      }
      return null;
    };

    const start = presetStart();
    const end = presetEnd();
    const minAmt = minAmount ? parseFloat(minAmount) : null;
    const maxAmt = maxAmount ? parseFloat(maxAmount) : null;
    const q = searchQuery.toLowerCase().trim();

    return combined
      .filter(item => {
        if (typeFilter !== 'all' && item._type !== typeFilter) return false;
        if (customerFilter !== 'all' && item.customerId !== customerFilter) return false;
        if (start && item._date < start) return false;
        if (end && item._date > end) return false;

        // amount
        const amt = item._type === 'credit' ? (item as Transaction).totalAmount : (item as Payment).amount;
        if (minAmt !== null && amt < minAmt) return false;
        if (maxAmt !== null && amt > maxAmt) return false;

        // status filter (credit only)
        if (statusFilter !== 'all') {
          if (item._type === 'credit') {
            if ((item as Transaction).status !== statusFilter) return false;
          } else {
            if (statusFilter !== 'PAID') return false; // payments are always PAID
          }
        }

        // payment method filter (payment only)
        if (payMethodFilter !== 'all') {
          if (item._type === 'payment') {
            if ((item as Payment).paymentMethod !== payMethodFilter) return false;
          } else {
            return false; // if filtering by payment method, skip credits
          }
        }

        // search
        if (q) {
          const name = item.customerName.toLowerCase();
          const id = item.id.toLowerCase();
          if (!name.includes(q) && !id.includes(q)) {
            if (item._type === 'credit') {
              const products = (item as Transaction).items.map(i => i.productName.toLowerCase()).join(' ');
              if (!products.includes(q)) return false;
            } else {
              const notes = ((item as Payment).notes || '').toLowerCase();
              if (!notes.includes(q)) return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => sortDir === 'desc'
        ? b._date.getTime() - a._date.getTime()
        : a._date.getTime() - b._date.getTime()
      );
  }, [combined, typeFilter, customerFilter, datePreset, customStart, customEnd, searchQuery, minAmount, maxAmount, statusFilter, payMethodFilter, sortDir]);

  // Group by date
  const dateGroups = useMemo(() => {
    const groups: Record<string, CombinedItem[]> = {};
    filtered.forEach(item => {
      const key = fmtGroupKey(item.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.entries(groups);
  }, [filtered]);

  // Summary stats
  const totalCredit = useMemo(() => filtered.filter(i => i._type === 'credit').reduce((s, t) => s + ((t as Transaction).totalAmount || 0), 0), [filtered]);
  const totalPaid = useMemo(() => filtered.filter(i => i._type === 'payment').reduce((s, p) => s + ((p as Payment).amount || 0), 0), [filtered]);
  const netOutstanding = totalCredit - totalPaid;

  const activeFilterCount = [
    typeFilter !== 'all', customerFilter !== 'all', datePreset !== 'all',
    searchQuery, minAmount, maxAmount, statusFilter !== 'all', payMethodFilter !== 'all',
  ].filter(Boolean).length;

  const resetFilters = () => {
    setTypeFilter('all'); setCustomerFilter('all'); setDatePreset('all');
    setCustomStart(''); setCustomEnd(''); setSearchQuery('');
    setMinAmount(''); setMaxAmount(''); setStatusFilter('all'); setPayMethodFilter('all');
  };

  // ──── Export PDF with jspdf-autotable (reliable, no html2canvas issues) ────
  const exportPDF = async () => {
    if (filtered.length === 0) { toast({ title: 'Nothing to export', variant: 'destructive' }); return; }
    
    toast({ title: '📄 Generating PDF...', description: 'Please wait' });
    setIsExporting(true);

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF('p', 'mm', 'a4') as any;
      const t = PDF_LANGUAGES[language]?.translations || PDF_LANGUAGES.en.translations;

      const custName = customerFilter !== 'all' 
        ? customers.find(c => c.id === customerFilter)?.name || 'N/A' 
        : t.allCustomers;

      // ── Header with gradient background ──
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setFillColor(124, 58, 237);
      doc.rect(140, 0, 70, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('SmartCredit - Transaction History', 14, 14);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Customer: ${custName}  |  Period: ${datePreset}  |  Type: ${typeFilter}`, 14, 22);
      doc.text(`Credit: Rs.${totalCredit.toLocaleString()}  |  Collected: Rs.${totalPaid.toLocaleString()}  |  Outstanding: Rs.${Math.abs(netOutstanding).toLocaleString()}`, 14, 28);
      doc.text(`Generated: ${fmtDate(new Date().toISOString())} ${fmtTime(new Date().toISOString())}  |  Records: ${filtered.length}`, 14, 34);

      // ── Table with ALL records ──
      doc.setTextColor(0, 0, 0);
      autoTable(doc, {
        startY: 46,
        head: [[
          t.date || 'Date',
          t.time || 'Time', 
          t.customer || 'Customer', 
          t.type || 'Type', 
          t.details || 'Details', 
          t.amount || 'Amount (Rs.)', 
          t.status || 'Status', 
          t.ref || 'Ref'
        ]],
        body: filtered.map(item => {
          const amt = item._type === 'credit' ? (item as Transaction).totalAmount : (item as Payment).amount;
          const details = item._type === 'credit'
            ? (item as Transaction).items.slice(0, 3).map(i => `${i.productName} x${i.quantity}`).join(', ')
            : `${(item as Payment).paymentMethod?.replace('_', ' ')} ${(item as Payment).notes ? '- ' + (item as Payment).notes : ''}`.trim();
          const status = item._type === 'credit' ? (item as Transaction).status : 'PAID';
          const typeLabel = item._type === 'credit' ? (t.creditGiven || 'Credit Given') : (t.paymentReceived || 'Payment Received');

          return [
            fmtDate(item.date),
            fmtTime(item.date),
            item.customerName,
            typeLabel,
            details,
            `${item._type === 'credit' ? '+' : '-'}Rs.${amt.toLocaleString()}`,
            status,
            item.id.slice(-6).toUpperCase()
          ];
        }),
        theme: 'striped',
        headStyles: {
          fillColor: [79, 70, 229],
          fontSize: 7,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'left',
        },
        bodyStyles: {
          fontSize: 6.5,
          cellPadding: 2,
        },
        alternateRowStyles: { fillColor: [248, 249, 255] },
        columnStyles: {
          0: { cellWidth: 22 },  // Date
          1: { cellWidth: 16 },  // Time
          2: { cellWidth: 30 },  // Customer
          3: { cellWidth: 24 },  // Type
          4: { cellWidth: 42 },  // Details
          5: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },  // Amount
          6: { cellWidth: 16, halign: 'center' },  // Status
          7: { cellWidth: 16, halign: 'center', font: 'courier' },  // Ref
        },
        margin: { left: 10, right: 10 },
        didParseCell: (data: any) => {
          // Color credit amounts red and payment amounts green
          if (data.column.index === 5 && data.section === 'body') {
            const text = data.cell.text?.[0] || '';
            if (text.startsWith('+')) {
              data.cell.styles.textColor = [220, 38, 38]; // Red for credit
            } else if (text.startsWith('-')) {
              data.cell.styles.textColor = [22, 163, 74]; // Green for payment
            }
          }
          // Color status badges
          if (data.column.index === 6 && data.section === 'body') {
            const text = data.cell.text?.[0] || '';
            if (text === 'PAID') data.cell.styles.textColor = [22, 163, 74];
            else if (text === 'PARTIAL') data.cell.styles.textColor = [217, 119, 6];
            else if (text === 'PENDING') data.cell.styles.textColor = [220, 38, 38];
          }
        },
      });

      // ── Summary Footer ──
      const finalY = (doc as any).lastAutoTable?.finalY || 200;
      const summaryY = finalY + 8;

      // Check if we need a new page for summary
      if (summaryY > 265) {
        doc.addPage();
        const sy = 20;
        doc.setFillColor(243, 244, 246);
        doc.roundedRect(10, sy, 190, 32, 3, 3, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50, 50, 50);
        doc.text(`${t.totalCredit || 'Total Credit Given'}: Rs.${totalCredit.toLocaleString()}`, 16, sy + 8);
        doc.text(`${t.totalCollected || 'Total Payments Collected'}: Rs.${totalPaid.toLocaleString()}`, 16, sy + 14);
        doc.text(`${t.netOutstanding || 'Net Outstanding'}: Rs.${Math.abs(netOutstanding).toLocaleString()}`, 16, sy + 20);
        doc.text(`${t.totalRecords || 'Total Records'}: ${filtered.length}`, 16, sy + 26);
      } else {
        doc.setFillColor(243, 244, 246);
        doc.roundedRect(10, summaryY, 190, 32, 3, 3, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50, 50, 50);
        doc.text(`${t.totalCredit || 'Total Credit Given'}: Rs.${totalCredit.toLocaleString()}`, 16, summaryY + 8);
        doc.text(`${t.totalCollected || 'Total Payments Collected'}: Rs.${totalPaid.toLocaleString()}`, 16, summaryY + 14);
        doc.text(`${t.netOutstanding || 'Net Outstanding'}: Rs.${Math.abs(netOutstanding).toLocaleString()}`, 16, summaryY + 20);
        doc.text(`${t.totalRecords || 'Total Records'}: ${filtered.length}`, 16, summaryY + 26);
      }

      const langCode = PDF_LANGUAGES[language]?.label || 'EN';
      const fileName = `SCMS_History_${langCode}_${datePreset}_${new Date().toISOString().slice(0,10)}.pdf`;
      doc.save(fileName);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      toast({ title: '✅ PDF Downloaded!', description: fileName });
    } catch (err: any) {
      console.error('PDF Export Error:', err);
      toast({ 
        title: '❌ PDF Export Failed', 
        description: err?.message || 'Please try again', 
        variant: 'destructive' 
      });
    } finally { 
      setIsExporting(false); 
    }
  };

  // ──── Export Excel ────
  const exportExcel = async () => {
    if (filtered.length === 0) { toast({ title: 'Nothing to export', variant: 'destructive' }); return; }
    
    // Show loading toast
    toast({ title: '📊 Generating Excel...', description: 'Please wait' });
    setIsExporting(true);
    
    try {
      const xlsx = await import('xlsx');
      const t = PDF_LANGUAGES[language]?.translations || PDF_LANGUAGES.en.translations;
      const rows = filtered.map(item => {
        const amt = item._type === 'credit' ? (item as Transaction).totalAmount : (item as Payment).amount;
        return {
          [t.date]: fmtDate(item.date),
          [t.time]: fmtTime(item.date),
          [t.customer]: item.customerName,
          [t.type]: item._type === 'credit' ? t.creditGiven : t.paymentReceived,
          [t.details]: item._type === 'credit'
            ? (item as Transaction).items.map(i => `${i.productName} x${i.quantity}`).join(', ')
            : `${(item as Payment).paymentMethod} ${(item as Payment).notes || ''}`,
          [t.amount]: amt,
          [t.status]: item._type === 'credit' ? (item as Transaction).status : 'PAID',
          [t.ref]: item.id.slice(-8).toUpperCase(),
        };
      });

      const ws = xlsx.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wpx: 85 }, { wpx: 65 }, { wpx: 130 }, { wpx: 110 },
        { wpx: 200 }, { wpx: 90 }, { wpx: 70 }, { wpx: 100 },
      ];

      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, t.type);

      const sumRows = [
        { Metric: t.totalCredit, 'Rs.': totalCredit },
        { Metric: t.totalCollected, 'Rs.': totalPaid },
        { Metric: t.netOutstanding, 'Rs.': netOutstanding },
        { Metric: t.totalRecords, 'Rs.': filtered.length },
        { Metric: t.periodFilter, 'Rs.': datePreset },
        { Metric: t.dateGenerated, 'Rs.': `${fmtDate(new Date().toISOString())} ${fmtTime(new Date().toISOString())}` },
      ];
      xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(sumRows), 'Summary');

      const langCode = PDF_LANGUAGES[language]?.label || 'EN';
      const fileName = `SCMS_History_${langCode}_${datePreset}_${new Date().toISOString().slice(0,10)}.xlsx`;
      
      // Use writeFile asynchronously
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          xlsx.writeFile(wb, fileName);
          resolve();
        }, 100);
      });
      
      toast({ title: '✅ Excel Downloaded!', description: fileName });
    } catch (err: any) {
      console.error('Excel Export Error:', err);
      toast({ 
        title: '❌ Excel Export Failed', 
        description: err?.message || 'Please try again', 
        variant: 'destructive' 
      });
    } finally { 
      setIsExporting(false); 
    }
  };

  // ── Date preset button labels ──
  const DATE_PRESETS = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: '7 Days' },
    { value: 'month', label: '30 Days' },
    { value: '3months', label: '3 Months' },
    { value: 'year', label: '1 Year' },
    { value: 'all', label: 'All Time' },
    { value: 'custom', label: 'Custom' },
  ] as const;

  return (
    <ProtectedRoute requiredRole="SHOP_OWNER">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-4">

          {/* ── Header ── */}
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                Transaction History
              </h1>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Complete credit & payment records</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={fetchAll} disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm font-bold hover:bg-muted transition-all">
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <button onClick={exportExcel} disabled={isExporting || filtered.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-lg">
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button onClick={exportPDF} disabled={isExporting || filtered.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-lg">
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          </div>

          {/* ── Summary Cards ── */}
          <div
            className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: 'Credit Given', value: fmtCurrency(totalCredit), full: `₹${totalCredit.toLocaleString()}`, icon: TrendingDown, g: 'from-red-500 to-teal-600', count: filtered.filter(i => i._type === 'credit').length, accent: 'text-red-500' },
              { label: 'Collected', value: fmtCurrency(totalPaid), full: `₹${totalPaid.toLocaleString()}`, icon: TrendingUp, g: 'from-teal-500 to-teal-600', count: filtered.filter(i => i._type === 'payment').length, accent: 'text-primary dark:text-indigo-400' },
              { label: 'Net Balance', value: fmtCurrency(Math.abs(netOutstanding)), full: `₹${Math.abs(netOutstanding).toLocaleString()}`, icon: IndianRupee, g: netOutstanding > 0 ? 'from-teal-500 to-teal-600' : 'from-teal-500 to-teal-600', count: filtered.length, accent: netOutstanding > 0 ? 'text-primary dark:text-indigo-400' : 'text-primary dark:text-indigo-400' },
            ].map((s, i) => (
              <div key={i}
                className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all p-3 sm:p-4">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.g} flex items-center justify-center shadow-md mb-2`}>
                  <s.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <p className={`text-base sm:text-xl font-black ${s.accent}`} title={s.full}>{s.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{s.label}</p>
                <p className="text-[9px] text-muted-foreground/60">{s.count} records</p>
              </div>
            ))}
          </div>

          {/* ── Quick Date Presets ── */}
          <div
            className="flex gap-1.5 flex-wrap">
            {DATE_PRESETS.map(p => (
              <button key={p.value} onClick={() => setDatePreset(p.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${datePreset === p.value
                  ? 'bg-primary text-white border-primary shadow-md shadow-indigo-500/20 dark:shadow-indigo-400/20'
                  : 'bg-card text-card-foreground border border-border shadow-sm border-border text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                {p.label}
              </button>
            ))}
            {/* Sort toggle */}
            <button onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
              className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-border bg-card text-card-foreground border border-border shadow-sm text-muted-foreground hover:bg-muted transition-all">
              {sortDir === 'desc' ? <SortDesc className="w-3.5 h-3.5" /> : <SortAsc className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{sortDir === 'desc' ? 'Newest' : 'Oldest'}</span>
            </button>
          </div>

          {/* ── Custom Date Range (when custom selected) ── */}
          
            {datePreset === 'custom' && (
              <div
                className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">From Date</label>
                  <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">To Date</label>
                  <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50" />
                </div>
              </div>
            )}
          

          {/* ── Search + Advanced Filter Toggle ── */}
          <div
            className="glass-card bg-card text-card-foreground border border-border shadow-sm hover:shadow-md transition-all p-3 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by customer, product, note, ref ID..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button onClick={() => setShowFilters(f => !f)}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-bold transition-all ${showFilters ? 'bg-primary text-white border-primary' : 'border-border bg-card text-card-foreground border border-border shadow-sm text-muted-foreground hover:bg-muted'}`}>
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className={`text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ${showFilters ? 'bg-white text-primary dark:text-indigo-400' : 'bg-primary text-white'}`}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Advanced Filters Panel */}
            
              {showFilters && (
                <div
                  className="overflow-hidden">
                  <div className="pt-3 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

                    {/* Type filter */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Tag className="w-3 h-3" /> Transaction Type
                      </label>
                      <div className="flex gap-1.5">
                        {(['all', 'credit', 'payment'] as const).map(t => (
                          <button key={t} onClick={() => setTypeFilter(t)}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${typeFilter === t
                              ? t === 'credit' ? 'bg-red-500 text-white' : t === 'payment' ? 'bg-primary text-white' : 'bg-primary text-white'
                              : 'border border-border text-muted-foreground hover:bg-muted'}`}>
                            {t === 'credit' ? '↑ Credit' : t === 'payment' ? '↓ Payment' : 'All'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Customer filter */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <User className="w-3 h-3" /> Customer
                      </label>
                      <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50">
                        <option value="all">All Customers</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>)}
                      </select>
                    </div>

                    {/* Credit Status */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Credit Status
                      </label>
                      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50">
                        <option value="all">All Statuses</option>
                        <option value="PAID">Paid</option>
                        <option value="PARTIAL">Partial</option>
                        <option value="PENDING">Pending</option>
                      </select>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> Payment Method
                      </label>
                      <select value={payMethodFilter} onChange={e => setPayMethodFilter(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50">
                        <option value="all">All Methods</option>
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CARD">Card</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                      </select>
                    </div>

                    {/* Amount range */}
                    <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" /> Amount Range (₹)
                      </label>
                      <div className="flex gap-2">
                        <input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} placeholder="Min"
                          className="flex-1 px-3 py-2 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50" />
                        <span className="text-muted-foreground self-center text-xs font-bold">to</span>
                        <input type="number" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} placeholder="Max"
                          className="flex-1 px-3 py-2 rounded-xl border border-border bg-card text-card-foreground border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:ring-indigo-400/50" />
                      </div>
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        <span className="font-bold text-primary dark:text-indigo-400">{activeFilterCount}</span> active filter{activeFilterCount > 1 ? 's' : ''}
                      </span>
                      <button onClick={resetFilters}
                        className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-600 transition-colors">
                        <X className="w-3 h-3" /> Clear All Filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            
          </div>

          {/* ── Record count / sort bar ── */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              <span className="font-black text-foreground text-sm">{filtered.length}</span> records
              {customerFilter !== 'all' && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-primary dark:text-indigo-400 font-bold">
                  {customers.find(c => c.id === customerFilter)?.name}
                  <button onClick={() => setCustomerFilter('all')} className="ml-1 hover:text-teal-800"><X className="w-2.5 h-2.5 inline" /></button>
                </span>
              )}
            </span>
            <span className="flex items-center gap-1 text-[10px]">
              <ArrowUpDown className="w-3 h-3" />
              {sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
            </span>
          </div>

          {/* ── Transaction list ── */}
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary dark:text-indigo-400 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Loading transactions...</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <CreditCard className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold text-lg">No transactions found</p>
              <p className="text-muted-foreground/60 text-sm mt-1.5">Try adjusting your filters or date range</p>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-primary dark:text-indigo-400 text-sm font-bold hover:bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors transition-colors">
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6 pb-6">
              
                {dateGroups.map(([dateLabel, items]) => {
                  const dayCredit = items.filter(i => i._type === 'credit').reduce((s, t) => s + ((t as Transaction).totalAmount || 0), 0);
                  const dayPay = items.filter(i => i._type === 'payment').reduce((s, p) => s + ((p as Payment).amount || 0), 0);

                  return (
                    <div key={dateLabel}>
                      {/* Date group header */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="flex-1 h-px bg-gradient-to-r from-border/80 to-transparent" />
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/70 border border-border/60 flex-shrink-0">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] sm:text-xs font-black text-muted-foreground">{dateLabel}</span>
                          {dayCredit > 0 && (
                            <span className="text-[9px] sm:text-[10px] font-black text-red-500 bg-red-500/10 px-1.5 rounded-full">↑{fmtCurrency(dayCredit)}</span>
                          )}
                          {dayPay > 0 && (
                            <span className="text-[9px] sm:text-[10px] font-black text-primary dark:text-indigo-400 bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors px-1.5 rounded-full">↓{fmtCurrency(dayPay)}</span>
                          )}
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-l from-border/80 to-transparent" />
                      </div>

                      {/* Items */}
                      <div className="space-y-2">
                        {items.map((item, idx) => {
                          const isCr = item._type === 'credit';
                          const tx = isCr ? item as Transaction : null;
                          const pay = !isCr ? item as Payment : null;
                          const amt = isCr ? tx!.totalAmount : pay!.amount;
                          const isExpanded = expandedId === item.id;

                          return (
                            <div key={item.id}
                             
                              className={`glass-card overflow-hidden transition-all cursor-pointer ${isExpanded ? 'border-indigo-500/20 dark:border-indigo-400/20' : 'hover:border-indigo-500/20 dark:border-indigo-400/20'}`}
                              onClick={() => setExpandedId(isExpanded ? null : item.id)}>

                              <div className="flex items-center gap-3 p-3 sm:p-4">
                                {/* Icon */}
                                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center shadow-md ${isCr ? 'from-red-500 to-teal-600' : 'from-teal-500 to-teal-600'}`}>
                                  {isCr ? <TrendingDown className="w-5 h-5 text-white" /> : <CheckCircle2 className="w-5 h-5 text-white" />}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-bold text-foreground text-sm sm:text-base truncate">{item.customerName}</p>
                                    {isCr && tx?.status && (
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border hidden sm:inline-flex ${STATUS_COLORS[tx.status] || 'bg-muted text-muted-foreground'}`}>
                                        {tx.status}
                                      </span>
                                    )}
                                    {!isCr && pay?.paymentMethod && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 dark:bg-indigo-400/20 transition-colors text-primary dark:text-indigo-400 border border-indigo-500/20 dark:border-indigo-400/20 hidden sm:inline-flex">
                                        {pay.paymentMethod.replace('_', ' ')}
                                      </span>
                                    )}
                                  </div>

                                  {isCr && tx!.items.length > 0 ? (
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                      <Package className="w-3 h-3 inline mr-1" />
                                      {tx!.items.slice(0, 2).map(i => `${i.productName} ×${i.quantity}`).join(', ')}
                                      {tx!.items.length > 2 && ` +${tx!.items.length - 2}`}
                                    </p>
                                  ) : !isCr ? (
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                      <CreditCard className="w-3 h-3 inline mr-1" />
                                      {pay!.paymentMethod?.replace('_', ' ')}
                                      {pay!.notes && ` · ${pay!.notes}`}
                                    </p>
                                  ) : null}

                                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5">
                                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[9px]">{item.id.slice(-8).toUpperCase()}</span>
                                    <span>·</span>
                                    <span>{fmtTime(item.date)}</span>
                                  </p>
                                </div>

                                {/* Amount */}
                                <div className="text-right flex-shrink-0">
                                  <p className={`text-base sm:text-lg font-black ${isCr ? 'text-red-500' : 'text-primary dark:text-indigo-400'}`}>
                                    {isCr ? '+' : '-'}₹{amt.toLocaleString()}
                                  </p>
                                  {isCr && tx!.balance > 0 && (
                                    <p className="text-[10px] text-muted-foreground">Bal: ₹{tx!.balance.toLocaleString()}</p>
                                  )}
                                </div>

                                {/* Expand arrow */}
                                <div className="flex-shrink-0">
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                </div>
                              </div>

                              {/* Expanded content */}
                              
                                {isExpanded && (
                                  <div
                                   
                                    className="border-t border-border/40 bg-muted/20 px-3 sm:px-4 py-3"
                                    onClick={e => e.stopPropagation()}>

                                    {isCr && tx!.items.length > 0 && (
                                      <>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">Items Purchased</p>
                                        <div className="space-y-1.5 mb-3">
                                          {tx!.items.map((it, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs bg-card text-card-foreground border border-border shadow-sm rounded-lg px-3 py-2">
                                              <div className="flex items-center gap-2">
                                                <Package className="w-3 h-3 text-muted-foreground" />
                                                <span className="font-medium text-foreground">{it.productName}</span>
                                                <span className="text-muted-foreground">× {it.quantity}</span>
                                              </div>
                                              <span className="font-black text-foreground">₹{it.subtotal.toLocaleString()}</span>
                                            </div>
                                          ))}
                                          <div className="flex justify-between text-xs font-black pt-1.5 px-3">
                                            <span className="text-muted-foreground">Total</span>
                                            <span className="text-red-500">₹{tx!.totalAmount.toLocaleString()}</span>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                          <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-2 text-center">
                                            <p className="text-muted-foreground text-[9px]">Total</p>
                                            <p className="font-black text-foreground">₹{tx!.totalAmount.toLocaleString()}</p>
                                          </div>
                                          <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-2 text-center">
                                            <p className="text-muted-foreground text-[9px]">Paid</p>
                                            <p className="font-black text-primary dark:text-indigo-400">₹{tx!.paidAmount?.toLocaleString()}</p>
                                          </div>
                                          <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-2 text-center">
                                            <p className="text-muted-foreground text-[9px]">Balance</p>
                                            <p className="font-black text-primary dark:text-indigo-400">₹{tx!.balance?.toLocaleString()}</p>
                                          </div>
                                        </div>
                                      </>
                                    )}

                                    {!isCr && (
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-2.5">
                                          <p className="text-muted-foreground text-[9px] uppercase font-black">Method</p>
                                          <p className="font-bold text-foreground mt-0.5">{pay!.paymentMethod?.replace('_', ' ')}</p>
                                        </div>
                                        <div className="bg-card text-card-foreground border border-border shadow-sm rounded-xl p-2.5">
                                          <p className="text-muted-foreground text-[9px] uppercase font-black">Amount</p>
                                          <p className="font-bold text-primary dark:text-indigo-400 mt-0.5">₹{pay!.amount?.toLocaleString()}</p>
                                        </div>
                                        {pay!.notes && (
                                          <div className="col-span-2 bg-card text-card-foreground border border-border shadow-sm rounded-xl p-2.5">
                                            <p className="text-muted-foreground text-[9px] uppercase font-black">Notes</p>
                                            <p className="font-medium text-foreground mt-0.5">{pay!.notes}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <div className="flex items-center justify-end mt-2.5 pt-2 border-t border-border/30">
                                      <span className="text-[9px] text-muted-foreground font-mono">{fmtDate(item.date)} at {fmtTime(item.date)}</span>
                                    </div>
                                  </div>
                                )}
                              
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              

              {/* Export footer */}
              {filtered.length > 0 && (
                <div className="flex items-center justify-center gap-3 pt-4 border-t border-border/40">
                  <button onClick={exportExcel} disabled={isExporting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 dark:shadow-indigo-400/20 transition-all disabled:opacity-50">
                    <Download className="w-4 h-4" /> Export Excel
                  </button>
                  <button onClick={exportPDF} disabled={isExporting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-all disabled:opacity-50">
                    <Download className="w-4 h-4" /> Export PDF
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

