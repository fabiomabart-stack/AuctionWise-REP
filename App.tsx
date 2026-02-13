
import React, { useState, useEffect, useMemo } from 'react';
import { AuctionData, InvestmentResults, AnalysisHistory, AppSettings, User } from './types';
import { extractAuctionData } from './services/geminiService';
import { calculateInvestment, formatCurrency, calculateMaxBidForBreakEven } from './utils/calculations';
import { FinancialCard } from './components/FinancialCard';
import { Logo } from './components/Logo';
import { Auth } from './components/Auth';
import { AdminPanel } from './components/AdminPanel';
import { DEFAULT_SETTINGS } from './config';

const initialFormData = {
  address: '',
  buildingName: '',
  appraisalValue: '',
  minBid2ndAuction: '',
  auctionDate: '',
  auctionType: 'Unknown',
  iptuDebt: '',
  iptuResponsible: 'Unknown',
  condoDebt: '',
  condoResponsible: 'Unknown',
  otherDebts: '',
  otherDebtsResponsible: 'Unknown',
  occupancyStatus: 'Unknown',
  evictionCost: '',
  rgiInfo: '',
  marketValue: '',
  monthlyCondoFee: '',
  monthlyTaxFee: '',
  estimatedRenovationCost: '',
  estimatedMonthsToResale: '12',
  sellingCommissionRate: '5',
  legalFeesInput: '4%',
  attentionNotes: '',
};

const CurrencyInput = ({ name, label, value, onChange, className }: any) => (
  <div className="relative">
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <div className="relative">
      <input 
        type="text" 
        inputMode="decimal"
        name={name} 
        value={value} 
        onChange={onChange} 
        placeholder="Valor em R$ (ex: 1500,00)"
        className={`w-full rounded-lg border focus:ring-blue-500 py-2 px-3 font-bold transition-all duration-300 ${className}`} 
      />
    </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [results, setResults] = useState<InvestmentResults | null>(null);
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<AnalysisHistory | null>(null);
  
  const [baseMinBid, setBaseMinBid] = useState<number>(0);

  // Efeito para verificar se o usuário ainda está ativo (simulando verificação constante do DB)
  useEffect(() => {
    if (user) {
      const users = JSON.parse(localStorage.getItem('auctionwise_users') || '[]');
      const currentUser = users.find((u: User) => u.id === user.id);
      if (currentUser && !currentUser.isActive) {
        setUser(null);
        setToast({ show: true, message: "Sua conta foi desativada." });
        setTimeout(() => setToast({ show: false, message: "" }), 3000);
      }
    }
  }, [user]);

  const auctionDataForCalc: AuctionData = useMemo(() => {
    return {
      ...formData,
      appraisalValue: parseFloat(formData.appraisalValue.replace(',', '.')) || 0,
      minBid2ndAuction: parseFloat(formData.minBid2ndAuction.replace(',', '.')) || 0,
      iptuDebt: parseFloat(formData.iptuDebt.replace(',', '.')) || 0,
      condoDebt: parseFloat(formData.condoDebt.replace(',', '.')) || 0,
      otherDebts: parseFloat(formData.otherDebts.replace(',', '.')) || 0,
      evictionCost: parseFloat(formData.evictionCost.replace(',', '.')) || 0,
      marketValue: parseFloat(formData.marketValue.replace(',', '.')) || 0,
      monthlyCondoFee: parseFloat(formData.monthlyCondoFee.replace(',', '.')) || 0,
      monthlyTaxFee: parseFloat(formData.monthlyTaxFee.replace(',', '.')) || 0,
      estimatedRenovationCost: parseFloat(formData.estimatedRenovationCost.replace(',', '.')) || 0,
      estimatedMonthsToResale: parseFloat(formData.estimatedMonthsToResale) || 0,
      sellingCommissionRate: parseFloat(formData.sellingCommissionRate) || 0,
      auctionType: formData.auctionType as any,
      iptuResponsible: formData.iptuResponsible as any,
      condoResponsible: formData.condoResponsible as any,
      otherDebtsResponsible: formData.otherDebtsResponsible as any,
      occupancyStatus: formData.occupancyStatus as any,
      attentionNotes: formData.attentionNotes,
    };
  }, [formData]);

  useEffect(() => {
    if (formData.occupancyStatus === 'Vacant') {
      setFormData(prev => ({ ...prev, evictionCost: '0' }));
    } else if (formData.occupancyStatus === 'Occupied' && (formData.evictionCost === '' || formData.evictionCost === '0')) {
      setFormData(prev => ({ ...prev, evictionCost: '2500' }));
    }
  }, [formData.occupancyStatus]);

  useEffect(() => {
    if (auctionDataForCalc.minBid2ndAuction > 0 && auctionDataForCalc.marketValue > 0) {
      setResults(calculateInvestment(auctionDataForCalc, settings));
    } else {
      setResults(null);
    }
  }, [auctionDataForCalc, settings]);

  const maxBidTeto = useMemo(() => {
    if (auctionDataForCalc.marketValue <= 0) return auctionDataForCalc.minBid2ndAuction * 1.5;
    return calculateMaxBidForBreakEven(auctionDataForCalc, settings);
  }, [auctionDataForCalc, settings]);

  const getScenario = (priceMod: number, monthMod: number) => {
    const scenarioPrice = auctionDataForCalc.marketValue * (1 + priceMod);
    const scenarioMonths = Math.max(1, auctionDataForCalc.estimatedMonthsToResale + monthMod);
    return calculateInvestment({
      ...auctionDataForCalc,
      marketValue: scenarioPrice,
      estimatedMonthsToResale: scenarioMonths
    }, settings);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'minBid2ndAuction') {
      const numeric = parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
      setBaseMinBid(numeric);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setResults(null);
    setBaseMinBid(0);
    setUrlInput('');
    setToast({ show: true, message: "Todos os campos foram limpos!" });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtracting(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const extracted = await extractAuctionData(base64);
      setFormData(prev => ({
        ...prev,
        ...Object.fromEntries(Object.entries(extracted).map(([k, v]) => [k, String(v ?? '')]))
      }));
      if (extracted.minBid2ndAuction) setBaseMinBid(extracted.minBid2ndAuction);
      setIsExtracting(false);
      setToast({ show: true, message: "Dados extraídos com sucesso!" });
      setTimeout(() => setToast({ show: false, message: "" }), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlExtraction = async () => {
    if (!urlInput) return;
    setIsExtracting(true);
    const extracted = await extractAuctionData(undefined, urlInput);
    setFormData(prev => ({
      ...prev,
      ...Object.fromEntries(Object.entries(extracted).map(([k, v]) => [k, String(v ?? '')]))
    }));
    if (extracted.minBid2ndAuction) setBaseMinBid(extracted.minBid2ndAuction);
    setIsExtracting(false);
    setUrlInput('');
    setToast({ show: true, message: "Dados extraídos com sucesso!" });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const loadHistoryItem = (item: AnalysisHistory) => {
    const newFormData = { ...initialFormData };
    Object.keys(newFormData).forEach((key) => {
      const valueFromSaved = (item.data as any)[key];
      if (valueFromSaved !== undefined && valueFromSaved !== null) {
        (newFormData as any)[key] = String(valueFromSaved);
      }
    });

    setFormData(newFormData);
    setSettings(item.settings);
    setBaseMinBid(item.data.minBid2ndAuction);
    setSelectedHistoryItem(null);
    setShowHistory(false);
    setToast({ show: true, message: "Análise carregada!" });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
    setSelectedHistoryItem(null);
    setToast({ show: true, message: "Análise excluída!" });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const getFieldClass = (name: string, value: any) => {
    if (name === 'evictionCost' && formData.occupancyStatus === 'Vacant') return "bg-black text-white border-black";
    const valStr = String(value).trim();
    const isEmpty = valStr === '' || valStr === '0' || valStr === 'Unknown' || valStr === '0.0';
    if (isEmpty) return "bg-rose-100 border-rose-400 text-rose-900 placeholder-rose-400";
    if (['marketValue', 'minBid2ndAuction', 'evictionCost'].includes(name)) return "bg-black text-white border-black";
    return "bg-white border-slate-200 text-slate-900";
  };

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen pb-20 relative bg-slate-50 font-sans">
      <header className="bg-slate-900 text-white p-6 shadow-lg mb-8 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-inner"><Logo className="w-10 h-10 text-slate-900" /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AuctionWise</h1>
              <p className="text-slate-400 text-sm">Olá, {user.username} {user.isAdmin && <span className="text-[10px] ml-1 bg-blue-600 text-white px-1.5 rounded uppercase font-bold">Admin</span>}</p>
            </div>
          </div>
          <div className="flex gap-3">
            {user.isAdmin && (
              <button onClick={() => setShowAdmin(true)} className="p-2 bg-amber-600 rounded-lg border border-amber-500 hover:bg-amber-500 transition-colors" title="Painel Admin">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              </button>
            )}
            <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg transition-colors border ${showSettings ? 'bg-blue-600 border-blue-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`} title="Configurações"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
            <button onClick={() => setShowHistory(!showHistory)} className="px-4 py-2 bg-slate-800 rounded-lg text-sm font-medium border border-slate-700">{showHistory ? 'Voltar' : 'Histórico'}</button>
            <button onClick={() => setUser(null)} className="px-4 py-2 bg-rose-900 rounded-lg text-sm font-bold border border-rose-800 hover:bg-rose-800">Sair</button>
            {!showHistory && !showSettings && (
              <button 
                onClick={() => { 
                  const id = Date.now().toString(); 
                  setHistory(prev => [{ id, date: new Date().toLocaleDateString(), data: auctionDataForCalc, results: results!, settings }, ...prev]); 
                  setToast({ show: true, message: "Análise salva!" }); 
                  setTimeout(() => setToast({ show: false, message: "" }), 3000);
                }} 
                disabled={!results} 
                className="px-6 py-2 bg-blue-600 rounded-lg text-sm font-bold shadow-lg disabled:opacity-50 transition-all hover:bg-blue-500"
              >
                Salvar
              </button>
            )}
          </div>
        </div>
      </header>

      {showAdmin && <AdminPanel currentUser={user} onClose={() => setShowAdmin(false)} />}

      <main className="max-w-7xl mx-auto px-4">
        {!showHistory && !showSettings && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* SEÇÃO IA */}
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-purple-100 text-purple-700 p-1.5 rounded-md"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></span>
                  <h3 className="text-lg font-bold text-slate-800">IA - Extração Automática</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Upload do Edital (PDF)</label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-8 h-8 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                          <p className="mb-2 text-sm text-slate-500 font-semibold">Clique para carregar</p>
                        </div>
                        <input type="file" className="hidden" accept="application/pdf" onChange={handleFileUpload} />
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Link ou Texto do Leilão</label>
                    <div className="flex flex-col h-32 justify-between">
                      <textarea 
                        value={urlInput} 
                        onChange={(e) => setUrlInput(e.target.value)} 
                        placeholder="Cole a URL ou o texto aqui..." 
                        className="flex-1 rounded-lg border border-slate-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      />
                      <button onClick={handleUrlExtraction} disabled={isExtracting || !urlInput} className="mt-2 bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                        {isExtracting ? 'Processando...' : 'Extrair Dados'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-10">
                {/* Identificação */}
                <div>
                  <h4 className="text-md font-bold text-slate-400 uppercase tracking-widest mb-6 border-b pb-2">Identificação do Imóvel</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
                      <input name="address" value={formData.address} onChange={handleInputChange} className={`w-full rounded-lg border py-2 px-3 ${getFieldClass('address', formData.address)}`} />
                    </div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Edifício</label><input name="buildingName" value={formData.buildingName} onChange={handleInputChange} className={`w-full rounded-lg border py-2 px-3 ${getFieldClass('buildingName', formData.buildingName)}`} /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">RGI / Matrícula</label><input name="rgiInfo" value={formData.rgiInfo} onChange={handleInputChange} className={`w-full rounded-lg border py-2 px-3 ${getFieldClass('rgiInfo', formData.rgiInfo)}`} /></div>
                  </div>
                </div>

                {/* Valores */}
                <div>
                  <h4 className="text-md font-bold text-slate-400 uppercase tracking-widest mb-6 border-b pb-2">Valores do Leilão</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <CurrencyInput name="appraisalValue" label="Avaliação" value={formData.appraisalValue} onChange={handleInputChange} className={getFieldClass('appraisalValue', formData.appraisalValue)} />
                    <div className="lg:col-span-2">
                      <div className="flex justify-between items-center mb-1"><label className="text-sm font-bold text-blue-600">Arremate</label><div className="flex gap-2"><span className="text-[10px] font-bold text-slate-400">Mín: {formatCurrency(baseMinBid)}</span><span className="text-[10px] font-bold text-slate-400">Teto: {formatCurrency(maxBidTeto)}</span></div></div>
                      <CurrencyInput name="minBid2ndAuction" label="" value={formData.minBid2ndAuction} onChange={handleInputChange} className={getFieldClass('minBid2ndAuction', formData.minBid2ndAuction)} />
                      <div className="mt-2"><input type="range" min={baseMinBid || 0} max={Math.max(maxBidTeto, baseMinBid + 1000)} step="500" value={parseFloat(formData.minBid2ndAuction.replace(',', '.')) || 0} onChange={(e) => setFormData(prev => ({ ...prev, minBid2ndAuction: e.target.value }))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" /></div>
                    </div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Data</label><input name="auctionDate" value={formData.auctionDate} onChange={handleInputChange} className={`w-full rounded-lg border py-2 px-3 ${getFieldClass('auctionDate', formData.auctionDate)}`} /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label><select name="auctionType" value={formData.auctionType} onChange={handleInputChange} className={`w-full rounded-lg border py-2 px-3 ${getFieldClass('auctionType', formData.auctionType)}`}><option value="Unknown">selecione...</option><option value="Judicial">Judicial</option><option value="Extrajudicial">Extrajudicial</option></select></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Assessoria</label><input name="legalFeesInput" value={formData.legalFeesInput} onChange={handleInputChange} className={`w-full rounded-lg border py-2 px-3 ${getFieldClass('legalFeesInput', formData.legalFeesInput)}`} /></div>
                  </div>
                </div>

                {/* Débitos e Ocupação */}
                <div>
                  <h4 className="text-md font-bold text-slate-400 uppercase tracking-widest mb-6 border-b pb-2">Débitos e Ocupação</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-1"><CurrencyInput name="iptuDebt" label="IPTU" value={formData.iptuDebt} onChange={handleInputChange} className={getFieldClass('iptuDebt', formData.iptuDebt)} /></div>
                        <div className="w-32"><label className="text-xs font-bold text-slate-500 mb-1">Resp.</label><select name="iptuResponsible" value={formData.iptuResponsible} onChange={handleInputChange} className={`w-full rounded-lg border py-2 text-sm px-2 ${getFieldClass('iptuResponsible', formData.iptuResponsible)}`}><option value="Unknown">selecione...</option><option value="Purchaser">Arrematante</option><option value="Seller">Vendedor</option><option value="Shared">Rateado</option></select></div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1"><CurrencyInput name="condoDebt" label="Condomínio" value={formData.condoDebt} onChange={handleInputChange} className={getFieldClass('condoDebt', formData.condoDebt)} /></div>
                        <div className="w-32"><label className="text-xs font-bold text-slate-500 mb-1">Resp.</label><select name="condoResponsible" value={formData.condoResponsible} onChange={handleInputChange} className={`w-full rounded-lg border py-2 text-sm px-2 ${getFieldClass('condoResponsible', formData.condoResponsible)}`}><option value="Unknown">selecione...</option><option value="Purchaser">Arrematante</option><option value="Seller">Vendedor</option><option value="Shared">Rateado</option></select></div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-slate-500 mb-1">Status</label><select name="occupancyStatus" value={formData.occupancyStatus} onChange={handleInputChange} className={`w-full rounded-lg border py-2 text-sm px-2 ${getFieldClass('occupancyStatus', formData.occupancyStatus)}`}><option value="Unknown">selecione...</option><option value="Occupied">Ocupado</option><option value="Vacant">Desocupado</option></select></div>
                        <CurrencyInput name="evictionCost" label="Desocupação" value={formData.evictionCost} onChange={handleInputChange} className={getFieldClass('evictionCost', formData.evictionCost)} />
                      </div>
                      <CurrencyInput name="otherDebts" label="Outros Débitos" value={formData.otherDebts} onChange={handleInputChange} className={getFieldClass('otherDebts', formData.otherDebts)} />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-bold text-amber-600 uppercase tracking-tight">Atenção (Observações do Edital / Campo Jurídico)</label>
                      <textarea 
                        name="attentionNotes" 
                        value={formData.attentionNotes} 
                        onChange={handleInputChange} 
                        placeholder="Análise jurídica automática extraída do edital..."
                        className="w-full rounded-lg border border-slate-200 bg-amber-50/30 p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none resize-none min-h-[120px] leading-relaxed text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Revenda */}
                <div>
                  <h4 className="text-md font-bold text-slate-400 uppercase tracking-widest mb-6 border-b pb-2">Revenda (Flipping)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <CurrencyInput name="marketValue" label="Mercado" value={formData.marketValue} onChange={handleInputChange} className={getFieldClass('marketValue', formData.marketValue)} />
                    <CurrencyInput name="estimatedRenovationCost" label="Reforma" value={formData.estimatedRenovationCost} onChange={handleInputChange} className={getFieldClass('estimatedRenovationCost', formData.estimatedRenovationCost)} />
                    <CurrencyInput name="monthlyCondoFee" label="Condo/Mês" value={formData.monthlyCondoFee} onChange={handleInputChange} className={getFieldClass('monthlyCondoFee', formData.monthlyCondoFee)} />
                    <CurrencyInput name="monthlyTaxFee" label="IPTU/Mês" value={formData.monthlyTaxFee} onChange={handleInputChange} className={getFieldClass('monthlyTaxFee', formData.monthlyTaxFee)} />
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Meses</label><input type="number" name="estimatedMonthsToResale" value={formData.estimatedMonthsToResale} onChange={handleInputChange} className={`w-full rounded-lg border py-2 px-3 ${getFieldClass('estimatedMonthsToResale', formData.estimatedMonthsToResale)}`} /></div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Comissão (%)</label><input type="number" name="sellingCommissionRate" value={formData.sellingCommissionRate} onChange={handleInputChange} className={`w-full rounded-lg border py-2 px-3 ${getFieldClass('sellingCommissionRate', formData.sellingCommissionRate)}`} /></div>
                  </div>
                </div>
              </div>

              {/* Stress Test */}
              <section className="bg-slate-900 p-8 rounded-3xl text-white relative shadow-2xl">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Simulador de Stress
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-800/50 p-6 rounded-2xl border border-rose-900/30">
                    <p className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-2">Pessimista</p>
                    <div className="mb-4 space-y-1">
                       <p className="text-[10px] text-rose-300 font-bold uppercase">Variáveis Alteradas:</p>
                       <p className="text-[11px] text-slate-300">• Mercado: {formatCurrency(auctionDataForCalc.marketValue * 0.9)} (-10%)</p>
                       <p className="text-[11px] text-slate-300">• Tempo: {auctionDataForCalc.estimatedMonthsToResale + 4} meses (+4)</p>
                    </div>
                    {results ? (
                      <div className="space-y-4 pt-2 border-t border-rose-900/20">
                        <div>
                          <p className="text-xs text-slate-400">ROI</p>
                          <p className="text-2xl font-black text-rose-500">
                            {getScenario(-0.1, 4).roiPercent.toFixed(1)}%
                            <span className="text-[10px] ml-2 opacity-70">({getScenario(-0.1, 4).annualizedRoi.toFixed(1)}% a.a.)</span>
                          </p>
                        </div>
                        <div><p className="text-xs text-slate-400">Lucro</p><p className="text-lg font-bold">{formatCurrency(getScenario(-0.1, 4).projectedProfit)}</p></div>
                      </div>
                    ) : <p className="text-xs text-slate-500 italic">Insira os dados...</p>}
                  </div>
                  <div className="bg-blue-600/20 p-6 rounded-2xl border border-blue-600/30 scale-105">
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Base</p>
                    <div className="mb-4 space-y-1">
                       <p className="text-[10px] text-blue-300 font-bold uppercase">Configuração Original:</p>
                       <p className="text-[11px] text-slate-300">• Mercado: {formatCurrency(auctionDataForCalc.marketValue)} (100%)</p>
                       <p className="text-[11px] text-slate-300">• Tempo: {auctionDataForCalc.estimatedMonthsToResale} meses</p>
                    </div>
                    {results ? (
                      <div className="space-y-4 pt-2 border-t border-blue-600/20">
                        <div>
                          <p className="text-xs text-slate-400">ROI</p>
                          <p className="text-2xl font-black text-blue-400">
                            {results.roiPercent.toFixed(1)}%
                            <span className="text-[10px] ml-2 opacity-70">({results.annualizedRoi.toFixed(1)}% a.a.)</span>
                          </p>
                        </div>
                        <div><p className="text-xs text-slate-400">Lucro</p><p className="text-lg font-bold">{formatCurrency(results.projectedProfit)}</p></div>
                      </div>
                    ) : <p className="text-xs text-slate-500 italic">Insira os dados...</p>}
                  </div>
                  <div className="bg-slate-800/50 p-6 rounded-2xl border border-emerald-900/30">
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">Otimista</p>
                    <div className="mb-4 space-y-1">
                       <p className="text-[10px] text-emerald-300 font-bold uppercase">Variáveis Alteradas:</p>
                       <p className="text-[11px] text-slate-300">• Mercado: {formatCurrency(auctionDataForCalc.marketValue * 1.05)} (+5%)</p>
                       <p className="text-[11px] text-slate-300">• Tempo: {Math.max(1, auctionDataForCalc.estimatedMonthsToResale - 2)} meses (-2)</p>
                    </div>
                    {results ? (
                      <div className="space-y-4 pt-2 border-t border-emerald-900/20">
                        <div>
                          <p className="text-xs text-slate-400">ROI</p>
                          <p className="text-2xl font-black text-emerald-500">
                            {getScenario(0.05, -2).roiPercent.toFixed(1)}%
                            <span className="text-[10px] ml-2 opacity-70">({getScenario(0.05, -2).annualizedRoi.toFixed(1)}% a.a.)</span>
                          </p>
                        </div>
                        <div><p className="text-xs text-slate-400">Lucro</p><p className="text-lg font-bold">{formatCurrency(getScenario(0.05, -2).projectedProfit)}</p></div>
                      </div>
                    ) : <p className="text-xs text-slate-500 italic">Insira os dados...</p>}
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6 sticky top-28 h-fit">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>Finanças</h2>
              {results ? (
                <div className="space-y-4">
                  <FinancialCard label="Total Investido" value={results.totalInvestment} variant="neutral" />
                  <FinancialCard label="Lucro Líquido" value={results.projectedProfit} variant={results.projectedProfit > 0 ? "positive" : "negative"} />
                  <FinancialCard 
                    label="ROI Projetado" 
                    value={results.roiPercent} 
                    variant={results.roiPercent > 15 ? "primary" : "neutral"} 
                    isPercent 
                    subValue={`${results.annualizedRoi.toFixed(1)}% a.a.`}
                  />
                  <div className="bg-white p-6 rounded-2xl border text-sm space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase border-b pb-2">Custos Arremate</h3>
                    <div className="flex justify-between"><span>Comissão Leilão</span><span>{formatCurrency(results.breakdown.commission)}</span></div>
                    <div className="flex justify-between"><span>ITBI</span><span>{formatCurrency(results.breakdown.itbi)}</span></div>
                    <div className="flex justify-between font-bold text-blue-700 border-t pt-2"><span>Total Arremate</span><span>{formatCurrency(results.totalAcquisitionCost)}</span></div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-300 text-center text-slate-400"><p>Insira Arremate e Mercado.</p></div>
              )}
            </div>
          </div>
        )}

        {showHistory && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Histórico</h2>
            {history.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl text-center text-slate-500 border">Nenhuma análise salva.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map(item => (
                  <button key={item.id} onClick={() => setSelectedHistoryItem(item)} className="bg-white p-6 rounded-2xl border hover:border-blue-500 hover:ring-2 hover:ring-blue-100 transition-all text-left w-full shadow-sm">
                    <h3 className="font-bold text-slate-800 truncate mb-1">{item.data.address || 'Sem endereço'}</h3>
                    <p className="text-xs text-slate-400 mb-4">{item.date}</p>
                    <div className="flex justify-between items-end border-t pt-4">
                      <div>
                        <p className="text-lg font-black text-blue-600">{item.results.roiPercent.toFixed(1)}% ROI</p>
                        <p className="text-[10px] text-slate-400">({item.results.annualizedRoi.toFixed(1)}% a.a.)</p>
                      </div>
                      <p className="text-sm font-bold text-slate-800">{formatCurrency(item.results.projectedProfit)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal de Ações */}
        {selectedHistoryItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-800">Opções da Análise</h3>
                <p className="text-sm text-slate-500 mt-2 truncate">{selectedHistoryItem.data.address || 'Sem endereço'}</p>
              </div>
              <div className="space-y-3">
                <button onClick={() => loadHistoryItem(selectedHistoryItem)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg">
                  Carregar Dados
                </button>
                <button onClick={() => deleteHistoryItem(selectedHistoryItem.id)} className="w-full bg-rose-50 text-rose-600 py-4 rounded-2xl font-bold hover:bg-rose-100 transition-colors">
                  Excluir Registro
                </button>
                <button onClick={() => setSelectedHistoryItem(null)} className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {showSettings && (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl border shadow-2xl">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">Configurações</h2>
            <div className="space-y-6">
              {Object.entries(settings).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-600 uppercase tracking-tight">{key.replace(/([A-Z])/g, ' $1').trim()} (%)</label>
                  <input type="number" value={val} onChange={(e) => setSettings(s => ({ ...s, [key]: parseFloat(e.target.value) || 0 }))} className="w-24 rounded-lg border py-2 px-3 text-right font-bold text-blue-600 outline-none" />
                </div>
              ))}
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full mt-8 bg-slate-900 text-white py-4 rounded-xl font-bold">Salvar e Fechar</button>
          </div>
        )}
      </main>

      {toast.show && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl z-[120] animate-bounce font-bold border border-slate-700">
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default App;
