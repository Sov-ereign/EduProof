"use client";

import { useRef } from "react";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, X } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        {/* Certificate - Elegant Design */}
        <div
          ref={certificateRef}
          className="relative p-16"
          style={{
            backgroundColor: '#ffffff',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='marble' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Crect fill='%23ffffff' width='100' height='100'/%3E%3Cpath d='M0 50 Q25 30 50 50 T100 50' stroke='%23f0f0f0' fill='none' stroke-width='0.5' opacity='0.3'/%3E%3Cpath d='M0 30 Q20 20 40 30 T80 30' stroke='%23e8e8e8' fill='none' stroke-width='0.3' opacity='0.2'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23marble)'/%3E%3C/svg%3E")`,
            minHeight: '800px',
            position: 'relative'
          }}
        >
          {/* Left Decorative Border */}
          <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col">
            <div className="flex-1 relative">
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(to right, #1e3a8a 0%, #1e3a8a 60%, #d4af37 65%, #d4af37 70%, #4fd1c7 75%, #4fd1c7 100%)',
                clipPath: 'polygon(0 0, 100% 5%, 100% 10%, 0 15%, 0 20%, 100% 25%, 100% 30%, 0 35%, 0 40%, 100% 45%, 100% 50%, 0 55%, 0 60%, 100% 65%, 100% 70%, 0 75%, 0 80%, 100% 85%, 100% 90%, 0 95%, 0 100%)'
              }}></div>
            </div>
          </div>

          {/* Right Decorative Border */}
          <div className="absolute right-0 top-0 bottom-0 w-16 flex flex-col">
            <div className="flex-1 relative">
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(to left, #1e3a8a 0%, #1e3a8a 60%, #d4af37 65%, #d4af37 70%, #4fd1c7 75%, #4fd1c7 100%)',
                clipPath: 'polygon(100% 0, 0 5%, 0 10%, 100% 15%, 100% 20%, 0 25%, 0 30%, 100% 35%, 100% 40%, 0 45%, 0 50%, 100% 55%, 100% 60%, 0 65%, 0 70%, 100% 75%, 100% 80%, 0 85%, 0 90%, 100% 95%, 100% 100%)'
              }}></div>
            </div>
          </div>

          {/* Top Left Corner Accent */}
          <div className="absolute top-8 left-16" style={{ width: '60px', height: '60px' }}>
            <div className="absolute top-0 left-0 w-12 h-1" style={{ backgroundColor: '#ca8a04' }}></div>
            <div className="absolute top-0 left-0 w-1 h-12" style={{ backgroundColor: '#ca8a04' }}></div>
            <div className="absolute top-10 left-10 w-4 h-4" style={{ backgroundColor: '#ca8a04' }}></div>
          </div>

          {/* Bottom Right Corner Accent */}
          <div className="absolute bottom-8 right-16" style={{ width: '60px', height: '60px' }}>
            <div className="absolute bottom-0 right-0 w-12 h-1" style={{ backgroundColor: '#ca8a04' }}></div>
            <div className="absolute bottom-0 right-0 w-1 h-12" style={{ backgroundColor: '#ca8a04' }}></div>
            <div className="absolute bottom-10 right-10 w-4 h-4" style={{ backgroundColor: '#ca8a04' }}></div>
          </div>

          {/* Gold Seal/Emblem at Top */}
          <div className="text-center mb-8 relative z-10">
            <div className="inline-block mb-6">
              <div
                className="relative mx-auto"
                style={{
                  width: '120px',
                  height: '120px',
                  background: 'radial-gradient(circle, #d4af37 0%, #b8941f 50%, #8b6914 100%)',
                  borderRadius: '50%',
                  boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4), inset 0 2px 10px rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <div className="absolute inset-2 border-2 rounded-full opacity-50" style={{ borderColor: '#fde047' }}></div>
                <span className="text-4xl font-bold relative z-10" style={{ fontFamily: 'serif', color: '#ffffff' }}>EP</span>
                {/* Ribbon tails */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-16 h-8" style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
                  clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}></div>
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-12 h-6" style={{
                  background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
                  clipPath: 'polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}></div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="text-center px-8 relative z-10" style={{ fontFamily: 'serif' }}>
            <h1 className="text-6xl font-bold mb-3 tracking-wide" style={{
              fontFamily: 'serif',
              letterSpacing: '0.1em',
              color: '#000000'
            }}>
              CERTIFICATE
            </h1>
            <h2 className="text-3xl font-semibold mb-12" style={{ fontFamily: 'serif', color: '#000000' }}>
              OF ACHIEVEMENT
            </h2>

            <p className="text-xl mb-8" style={{ fontFamily: 'serif', color: '#000000' }}>
              THIS CERTIFICATE IS PRESENTED TO :
            </p>
            <div className="mb-8">
              <div className="inline-block border-b-2 pb-2 px-16 mb-8" style={{ borderColor: '#000000' }}>
                <h2 className="text-5xl font-bold" style={{ fontFamily: 'serif', color: '#000000' }}>
                  {userName}
                </h2>
              </div>
            </div>

            <p className="text-lg mb-4 leading-relaxed" style={{ fontFamily: 'serif', color: '#000000' }}>
              Congratulations on your remarkable success!
            </p>
            <p className="text-lg mb-8 leading-relaxed" style={{ fontFamily: 'serif', color: '#000000' }}>
              Your dedication and passion have set a remarkable standard.
            </p>

            {/* Skill Details */}
            <div className="my-12">
              <p className="text-2xl font-semibold mb-4" style={{ fontFamily: 'serif', color: '#000000' }}>
                {skill} - {level}
              </p>
              <p className="text-xl mb-2" style={{ fontFamily: 'serif', color: '#000000' }}>
                Score: {score}/100
              </p>
              <p className="text-sm mb-4" style={{ fontFamily: 'serif', color: '#4b5563' }}>
                Issued on {date}
              </p>
              <p className="text-xs" style={{ fontFamily: 'serif', color: '#6b7280' }}>
                Transaction: {transactionHash.slice(0, 16)}...{transactionHash.slice(-12)}
              </p>
            </div>

            {/* QR Code Section */}
            <div className="mt-16 mb-8 flex justify-center">
              <div className="p-4 border-2 inline-block" style={{ backgroundColor: '#ffffff', borderColor: '#9ca3af' }}>
                <QRCode
                  value={explorerUrl}
                  size={120}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox="0 0 256 256"
                />
              </div>
            </div>
            <p className="text-xs mb-12" style={{ fontFamily: 'serif', color: '#4b5563' }}>
              Scan QR code to verify on Stellar Explorer
            </p>

            {/* Signature Lines */}
            <div className="flex justify-between mt-16 pt-8 border-t" style={{ borderColor: '#9ca3af' }}>
              <div className="flex-1 text-center">
                <div className="border-b-2 w-48 mx-auto mb-2" style={{ borderColor: '#000000' }}></div>
                <p className="text-sm" style={{ fontFamily: 'serif', color: '#000000' }}>MANAGER</p>
              </div>
              <div className="flex-1 text-center">
                <div className="border-b-2 w-48 mx-auto mb-2" style={{ borderColor: '#000000' }}></div>
                <p className="text-sm" style={{ fontFamily: 'serif', color: '#000000' }}>CEO</p>
              </div>
            </div>
          </div>
        </div>

        {/* Download buttons */}
        <div className="flex gap-4 justify-center p-6 bg-gray-50 border-t">
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
          <button
            onClick={downloadPNG}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            <Download className="w-5 h-5" />
            Download PNG
          </button>
        </div>
      </motion.div>
    </div>
  );
}

