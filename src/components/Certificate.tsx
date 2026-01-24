"use client";

import { useRef } from "react";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, X, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface CertificateProps {
  userName: string;
  skill: string;
  level: string;
  score: number;
  date: string;
  transactionHash: string;
  explorerUrl: string;
  onClose: () => void;
}

export default function Certificate({
  userName,
  skill,
  level,
  score,
  date,
  transactionHash,
  explorerUrl,
  onClose,
}: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!certificateRef.current) return;

    try {
      // Wait a bit for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        allowTaint: true,
        removeContainer: false,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF("portrait", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = (pdfHeight - imgHeight * ratio) / 2;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`EduProof_Certificate_${skill}_${userName.replace(/\s+/g, "_")}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to download certificate. Please try again.");
    }
  };

  const downloadPNG = async () => {
    if (!certificateRef.current) return;

    try {
      // Wait a bit for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        allowTaint: true,
        removeContainer: false,
      });

      const link = document.createElement("a");
      link.download = `EduProof_Certificate_${skill}_${userName.replace(/\s+/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating PNG:", error);
      alert("Failed to download certificate. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-[2rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto border border-white/20"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 bg-white/80 backdrop-blur-md hover:bg-white rounded-full p-3 shadow-lg transition-all transform hover:rotate-90"
        >
          <X className="w-5 h-5 text-slate-900" />
        </button>

        {/* Certificate - Elegant Design */}
        <div
          ref={certificateRef}
          className="relative p-12 md:p-20"
          style={{
            backgroundColor: '#ffffff',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='marble' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Crect fill='%23ffffff' width='100' height='100'/%3E%3Cpath d='M0 50 Q25 30 50 50 T100 50' stroke='%23f1f5f9' fill='none' stroke-width='0.5' opacity='0.5'/%3E%3Cpath d='M0 30 Q20 20 40 30 T80 30' stroke='%23f8fafc' fill='none' stroke-width='0.3' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23marble)'/%3E%3C/svg%3E")`,
            minHeight: '840px',
            position: 'relative'
          }}
        >
          {/* Decorative Framing */}
          <div className="absolute inset-8 border-[12px] border-slate-50 opacity-50 rounded-lg pointer-events-none" />
          <div className="absolute inset-12 border border-slate-100 opacity-50 rounded pointer-events-none" />

          {/* Left Decorative Border */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col">
            <div className="flex-1 relative">
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(to right, #000 0%, #000 60%, #b8941f 65%, #b8941f 70%, #6366f1 75%, #6366f1 100%)',
                clipPath: 'polygon(0 0, 100% 5%, 100% 10%, 0 15%, 0 20%, 100% 25%, 100% 30%, 0 35%, 0 40%, 100% 45%, 100% 50%, 0 55%, 0 60%, 100% 65%, 100% 70%, 0 75%, 0 80%, 100% 85%, 100% 90%, 0 95%, 0 100%)'
              }}></div>
            </div>
          </div>

          {/* Right Decorative Border */}
          <div className="absolute right-0 top-0 bottom-0 w-12 flex flex-col">
            <div className="flex-1 relative">
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(to left, #000 0%, #000 60%, #b8941f 65%, #b8941f 70%, #6366f1 75%, #6366f1 100%)',
                clipPath: 'polygon(100% 0, 0 5%, 0 10%, 100% 15%, 100% 20%, 0 25%, 0 30%, 100% 35%, 100% 40%, 0 45%, 0 50%, 100% 55%, 100% 60%, 0 65%, 0 70%, 100% 75%, 100% 80%, 0 85%, 0 90%, 100% 95%, 100% 100%)'
              }}></div>
            </div>
          </div>

          {/* Corner Accents - Minimal Gold */}
          <div className="absolute top-12 left-16 w-12 h-12">
            <div className="absolute top-0 left-0 w-8 h-0.5 bg-amber-500/30"></div>
            <div className="absolute top-0 left-0 w-0.5 h-8 bg-amber-500/30"></div>
          </div>
          <div className="absolute bottom-12 right-16 w-12 h-12">
            <div className="absolute bottom-0 right-0 w-8 h-0.5 bg-amber-500/30"></div>
            <div className="absolute bottom-0 right-0 w-0.5 h-8 bg-amber-500/30"></div>
          </div>

          {/* Gold Seal/Emblem */}
          <div className="text-center mb-12 relative z-10">
            <div className="inline-block relative">
              <div
                className="relative mx-auto flex items-center justify-center"
                style={{
                  width: '140px',
                  height: '140px',
                  background: 'radial-gradient(circle, #fde68a 0%, #f59e0b 100%)',
                  borderRadius: '50%',
                  boxShadow: '0 8px 30px rgba(245, 158, 11, 0.2), inset 0 2px 10px rgba(255, 255, 255, 0.5)',
                }}
              >
                <div className="absolute inset-2 border-2 border-amber-200/50 rounded-full" />
                <ShieldCheck className="w-16 h-16 text-white" />

                {/* Ribbons */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-12 w-8 h-16 bg-amber-500 -z-10 origin-top rotate-12" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 85%, 0% 100%)' }} />
                <div className="absolute -bottom-8 right-1/2 translate-x-12 w-8 h-16 bg-amber-600 -z-10 origin-top -rotate-12" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 85%, 0% 100%)' }} />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="text-center px-12 relative z-10">
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] mb-4 text-sm">Official Proof of Skill</p>
            <h1 className="text-7xl font-black text-slate-900 mb-2 tracking-tight">CERTIFICATE</h1>
            <p className="text-xl font-bold text-amber-600 uppercase tracking-widest mb-16">OF EXCELLENCE</p>

            <div className="space-y-4 mb-16">
              <p className="text-slate-500 font-medium italic">This verifiable credential is proudly awarded to</p>
              <div className="relative inline-block">
                <h2 className="text-6xl font-black text-slate-900 px-8 py-2 underline decoration-slate-900/10 decoration-8 underline-offset-8">
                  {userName}
                </h2>
              </div>
            </div>

            <p className="text-slate-500 font-medium mb-12 leading-relaxed max-w-lg mx-auto">
              For demonstrating exceptional proficiency and mastery in the field of technical execution and skill assessment.
            </p>

            {/* Skill Detail Grid */}
            <div className="grid grid-cols-2 gap-12 max-w-2xl mx-auto mb-16 pt-8 border-t border-slate-100">
              <div className="text-left">
                <p className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest mb-1">Skill Verified</p>
                <p className="text-xl font-black text-slate-900">{skill}</p>
                <p className="text-sm font-bold text-indigo-600">{level} Protocol</p>
              </div>
              <div className="text-right">
                <p className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest mb-1">Mastery Score</p>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-3xl font-black text-slate-900">{score}</span>
                  <span className="text-slate-400 font-bold">/ 100</span>
                </div>
              </div>
            </div>

            {/* Metadata Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-slate-100">
              <div className="text-left flex-1">
                <div className="mb-4">
                  <p className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest mb-1">Issue Date</p>
                  <p className="text-sm font-bold text-slate-900">{date}</p>
                </div>
                <div>
                  <p className="text-[0.6rem] font-black text-slate-400 uppercase tracking-widest mb-1">Transaction Identity</p>
                  <p className="text-[0.65rem] font-mono text-slate-400 break-all max-w-[300px]">
                    {transactionHash}
                  </p>
                </div>
              </div>

              {/* QR Verification */}
              <div className="bg-white p-3 rounded-2xl border-4 border-slate-50 shadow-inner">
                <QRCode
                  value={explorerUrl}
                  size={100}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox="0 0 256 256"
                />
              </div>
            </div>

            <p className="mt-8 text-[0.6rem] font-bold text-slate-300 uppercase tracking-[0.2em]">
              Verified securely on Stellar Blockchain Testnet
            </p>
          </div>
        </div>

        {/* Download actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center p-8 bg-slate-50 border-t border-slate-100 rounded-b-[2rem]">
          <button
            onClick={downloadPDF}
            className="flex-1 flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-sm tracking-widest transition-all transform hover:-translate-y-1 hover:shadow-xl active:scale-95"
          >
            <Download className="w-5 h-5" />
            DOWNLOAD PDF
          </button>
          <button
            onClick={downloadPNG}
            className="flex-1 flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-200 px-8 py-4 rounded-2xl font-black text-sm tracking-widest transition-all transform hover:-translate-y-1 hover:shadow-lg active:scale-95"
          >
            <Download className="w-5 h-5" />
            EXPORT PNG
          </button>
        </div>
      </motion.div>
    </div>
  );
}

