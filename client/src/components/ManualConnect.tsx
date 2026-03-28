import { useState, useEffect, useRef } from 'react';
import { useMeshStore } from '../store/useMeshStore';
import { QRCodeSVG } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  X, 
  QrCode, 
  Copy, 
  CheckCircle2, 
  Info, 
  ArrowRight, 
  Camera, 
  Type, 
  ChevronLeft,
  Loader2,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ManualConnect = () => {
  const { 
    isManualModalOpen, 
    setManualModalOpen, 
    manualStep, 
    setManualStep,
    generateManualOffer,
    receiveManualOffer,
    completeManualConnection
  } = useMeshStore();

  const [localData, setLocalData] = useState<string>(''); // Offer or Answer to display
  const [remoteInput, setRemoteInput] = useState<string>(''); // Offer or Answer paste input
  const [isCopied, setIsCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!isManualModalOpen) {
      setLocalData('');
      setRemoteInput('');
      setError(null);
      stopScanner();
    }
  }, [isManualModalOpen]);

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch((err: unknown) => console.warn("Scanner clear error", err));
      scannerRef.current = null;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(localData);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const startOfferFlow = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const offer = await generateManualOffer();
      setLocalData(offer);
      setManualStep('show_offer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate offer');
    } finally {
      setIsProcessing(false);
    }
  };

  const processAnswer = async () => {
    if (!remoteInput) return;
    setIsProcessing(true);
    setError(null);
    try {
      await completeManualConnection(remoteInput);
      setManualModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete connection');
    } finally {
      setIsProcessing(false);
    }
  };

  const processOfferAndGenAnswer = async () => {
    if (!remoteInput) return;
    setIsProcessing(true);
    setError(null);
    try {
      const answer = await receiveManualOffer(remoteInput);
      setLocalData(answer);
      setManualStep('show_answer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process offer');
    } finally {
      setIsProcessing(false);
    }
  };

  const startScanner = (type: 'offer' | 'answer') => {
    setManualStep(type === 'offer' ? 'scan_offer' : 'scan_answer');
    
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader", 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      
      scanner.render((decodedText) => {
        setRemoteInput(decodedText);
        scanner.clear();
        scannerRef.current = null;
        if (type === 'offer') {
          setManualStep('join');
        } else {
          setManualStep('show_offer');
        }
      }, () => {
        // Just log scanner errors silently as they happen frequently during search
      });
      
      scannerRef.current = scanner;
    }, 100);
  };

  if (!isManualModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setManualModalOpen(false)}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-white font-bold leading-none">Manual Connection</h3>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mt-1">Air-Gapped Sync</p>
            </div>
          </div>
          <button 
            onClick={() => setManualModalOpen(false)}
            className="p-1.5 hover:bg-white/5 rounded-full text-neutral-500 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <AnimatePresence mode="wait">
            {manualStep === 'idle' && (
              <motion.div 
                key="selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Establish a peer-to-peer connection without any internet or signaling server. Useful for disaster zones or air-gapped scenarios.
                </p>

                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={startOfferFlow}
                    className="group relative flex items-center justify-between p-4 bg-neutral-800 border border-neutral-700 hover:border-primary/50 rounded-xl transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="p-2.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <span className="block text-white font-bold">Initiate Connection</span>
                        <span className="block text-xs text-neutral-500">Generate an offer (Device A)</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </button>

                  <button 
                    onClick={() => setManualStep('join')}
                    className="group relative flex items-center justify-between p-4 bg-neutral-800 border border-neutral-700 hover:border-success/50 rounded-xl transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-success/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="p-2.5 bg-success/10 rounded-lg group-hover:bg-success/20 transition-colors">
                        <ShieldCheck className="w-5 h-5 text-success" />
                      </div>
                      <div className="text-left">
                        <span className="block text-white font-bold">Join Connection</span>
                        <span className="block text-xs text-neutral-500">Accept an offer (Device B)</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-success group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step: Show Offer / Show Answer (Displays local code) */}
            {(manualStep === 'show_offer' || manualStep === 'show_answer') && (
              <motion.div 
                key="show-code"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 flex flex-col items-center"
              >
                <div className="text-center">
                  <h4 className="text-white font-bold mb-1">
                    {manualStep === 'show_offer' ? 'Scan Offer (A → B)' : 'Scan Answer (B → A)'}
                  </h4>
                  <p className="text-xs text-neutral-500 uppercase tracking-tighter">Share this code with the other device</p>
                </div>

                {/* QR Code */}
                <div className="p-4 bg-white rounded-2xl shadow-inner-glow relative group">
                  <div className="absolute -inset-1 bg-primary/20 blur opacity-30 group-hover:opacity-60 transition-opacity rounded-3xl" />
                  <QRCodeSVG 
                    value={localData} 
                    size={220} 
                    level="L" 
                    includeMargin={false}
                    className="relative"
                  />
                </div>

                {/* Copy String */}
                <div className="w-full space-y-2">
                  <div className="relative">
                    <input 
                      readOnly 
                      value={localData} 
                      className="w-full bg-black border border-neutral-800 rounded-lg pl-3 pr-10 py-2.5 text-[8px] font-mono text-neutral-500 focus:outline-none"
                    />
                    <button 
                      onClick={handleCopy}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded text-neutral-400"
                    >
                      {isCopied ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                    <Info className="w-4 h-4 text-blue-400 shrink-0" />
                    <p className="text-[10px] text-blue-300">
                      {manualStep === 'show_offer' 
                        ? 'Keep this screen open. Once the other device scans this, paste their "Answer" code below.'
                        : 'Connection is established once the other device receives this answer.'}
                    </p>
                  </div>
                </div>

                {manualStep === 'show_offer' && (
                  <div className="w-full pt-4 border-t border-neutral-800 space-y-3">
                    <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Final Step: Input Answer</label>
                    <div className="flex gap-2">
                      <input 
                        placeholder="Paste remote answer here..."
                        value={remoteInput}
                        onChange={(e) => setRemoteInput(e.target.value)}
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-primary/50 outline-none"
                      />
                      <button 
                        onClick={() => startScanner('answer')}
                        className="p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-400 hover:text-white"
                      >
                        <Camera className="w-5 h-5" />
                      </button>
                    </div>
                    <button 
                      onClick={processAnswer}
                      disabled={!remoteInput || isProcessing}
                      className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Handshake'}
                    </button>
                  </div>
                )}

                {manualStep === 'show_answer' && (
                  <button 
                    onClick={() => setManualModalOpen(false)}
                    className="w-full py-2.5 bg-success/20 hover:bg-success/30 text-success border border-success/30 rounded-lg font-bold text-sm transition-all"
                  >
                    Close & Monitor Graph
                  </button>
                )}
              </motion.div>
            )}

            {/* Step: Join (Device B Input) */}
            {manualStep === 'join' && (
              <motion.div 
                key="join"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <button 
                  onClick={() => setManualStep('idle')}
                  className="p-1 hover:bg-white/5 rounded text-neutral-500 hover:text-white flex items-center gap-1 text-xs mb-2 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>

                <div className="text-center">
                  <h4 className="text-white font-bold mb-1">Enter Peer Offer</h4>
                  <p className="text-xs text-neutral-500">Scan or paste the code from Device A</p>
                </div>

                <div 
                  onClick={() => startScanner('offer')}
                  className="w-full aspect-[4/3] bg-black border-2 border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 text-neutral-600 hover:text-primary transition-all group"
                >
                  <div className="p-4 bg-neutral-900 rounded-full group-hover:bg-primary/10 transition-colors">
                    <Camera className="w-8 h-8" />
                  </div>
                  <span className="font-bold text-sm">Launch Scanner</span>
                </div>

                <div className="relative flex items-center">
                  <div className="flex-1 border-t border-neutral-800" />
                  <span className="px-3 text-[10px] text-neutral-600 font-bold">OR</span>
                  <div className="flex-1 border-t border-neutral-800" />
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <Type className="absolute left-3 top-3 w-4 h-4 text-neutral-600" />
                    <textarea 
                      placeholder="Paste SDP offer string here..."
                      value={remoteInput}
                      onChange={(e) => setRemoteInput(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-3 py-3 text-xs font-mono text-white focus:border-primary/50 outline-none h-24"
                    />
                  </div>
                  <button 
                    onClick={processOfferAndGenAnswer}
                    disabled={!remoteInput || isProcessing}
                    className="w-full py-3 bg-success hover:bg-success-hover text-white rounded-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Answer'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step: Scanner Overlay */}
            {(manualStep === 'scan_offer' || manualStep === 'scan_answer') && (
              <motion.div 
                key="scanner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                 <div className="flex justify-between items-center">
                   <h4 className="text-white font-bold">Scanning Code...</h4>
                   <button 
                    onClick={() => {
                        stopScanner();
                        setManualStep(manualStep === 'scan_offer' ? 'join' : 'show_offer');
                    }}
                    className="text-xs text-primary font-bold"
                  >
                    Cancel
                  </button>
                 </div>
                 <div id="qr-reader" className="w-full overflow-hidden rounded-xl bg-black" />
                 <p className="text-center text-xs text-neutral-500">Center the QR code in the frame</p>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="mt-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-xs flex gap-2">
              <Info className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
