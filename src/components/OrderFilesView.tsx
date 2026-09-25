import React, { useState, useEffect } from 'react';
import { 
  FolderGit2, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  Trash2, 
  Eye, 
  FileText, 
  Calendar, 
  IndianRupee, 
  AlertCircle,
  X,
  RefreshCw
} from 'lucide-react';
import { OrderFile, AdminAuthUser } from '../types';

interface OrderFilesViewProps {
  currentUser: AdminAuthUser | null;
  onOpenOrderGenerator?: () => void;
}

export const OrderFilesView: React.FC<OrderFilesViewProps> = ({
  currentUser,
  onOpenOrderGenerator,
}) => {
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [viewingFile, setViewingFile] = useState<OrderFile | null>(null);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/memorandum/order-files?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Failed to fetch order files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [searchQuery]);

  const handleDelete = async (id: string, orderNumber: string) => {
    if (currentUser?.role !== 'Admin') {
      alert('ಆದೇಶ ಕಡತವನ್ನು ಅಳಿಸಲು ಕೇವಲ ಅಡ್ಮಿನ್‌ಗೆ (Admin) ಮಾತ್ರ ಅಧಿಕಾರವಿದೆ.');
      return;
    }
    if (!confirm(`ನೀವು ನಿಜವಾಗಿಯೂ ಈ ಆದೇಶ ಕಡತವನ್ನು (${orderNumber}) ಅಳಿಸಲು ಬಯಸುವಿರಾ?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/memorandum/order-files/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': currentUser.role,
          'x-user-name': currentUser.displayName,
        },
      });
      if (res.ok) {
        setFiles(curr => curr.filter(f => f.id !== id && f.fileId !== id));
        if (viewingFile?.id === id) setViewingFile(null);
      } else {
        const d = await res.json();
        alert(d.error || 'ಅಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ');
      }
    } catch (err: any) {
      alert('ದೋಷ ಸಂಭವಿಸಿದೆ: ' + err.message);
    }
  };

  const handlePrint = (file: OrderFile) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>ಜ್ಞಾಪನಾ ಆದೇಶ - ${file.orderNumber}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body { margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body class="bg-white">
            <div class="no-print mb-4 flex justify-end gap-2 p-2 bg-stone-100 border-b">
              <button onclick="window.print()" class="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">Print Now</button>
              <button onclick="window.close()" class="bg-stone-600 text-white px-4 py-2 rounded text-sm font-bold">Close</button>
            </div>
            ${file.generatedDocumentHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    }
  };

  const filteredFiles = files.filter(f => {
    if (selectedType !== 'All' && f.orderType !== selectedType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-sky-950 text-sky-200 flex items-center justify-center shrink-0">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase px-2 py-0.5 bg-sky-100 text-sky-900 border border-sky-300 rounded">
                  ದಾಖಲಾತಿ ಶಾಖೆ • ಕಡತ ಭಂಡಾರ
                </span>
                <span className="text-xs text-stone-500">ಒಟ್ಟು ಆದೇಶಗಳು: {files.length}</span>
              </div>
              <h1 className="text-xl font-bold text-stone-900 mt-1 font-sans">
                ಆದೇಶಗಳ ಕಡತ (Order Files & Archives)
              </h1>
              <p className="text-xs text-stone-600 mt-0.5">
                ಇಲಾಖೆಯಿಂದ ಹೊರಡಿಸಲಾದ ಎಲ್ಲಾ ಜ್ಞಾಪನಾ ಆದೇಶಗಳ ಅಧಿಕೃತ ಕಡತಗಳು, ಮುದ್ರಣ ಹಾಗೂ ಮರುಪರಿಶೀಲನಾ ದಾಖಲಾತಿ.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchFiles}
              className="p-2 border border-stone-300 hover:bg-stone-100 rounded text-stone-600 transition-colors cursor-pointer"
              title="ಮರುಲೋಡ್ ಮಾಡಿ"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            {onOpenOrderGenerator && (
              <button
                type="button"
                onClick={onOpenOrderGenerator}
                className="px-4 py-2 bg-sky-950 hover:bg-sky-900 text-white text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>+ ನೂತನ ಜ್ಞಾಪನಾ ಆದೇಶ ಸೃಜಿಸಿ</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ಆದೇಶ ಸಂಖ್ಯೆ, ಕೆಜಿಐಡಿ, ನೌಕರರ ಹೆಸರು ಹುಡುಕಿ..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded focus:border-sky-950 focus:ring-1 focus:ring-sky-950 outline-none"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-stone-500" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs border border-stone-300 rounded px-3 py-2 bg-white text-stone-800 outline-none"
          >
            <option value="All">ಎಲ್ಲಾ ಆದೇಶ ಪ್ರಕಾರಗಳು (All Types)</option>
            <option value="ಗಳಿಕೆ ರಜೆ">ಗಳಿಕೆ ರಜೆ</option>
            <option value="ಶಿಶುಪಾಲನ ರಜೆ">ಶಿಶುಪಾಲನ ರಜೆ</option>
            <option value="10 ವರ್ಷದ ಕಾಲಮಿತಿ ವೇತನ ಬಡ್ತಿ">10 ವರ್ಷದ ಕಾಲಮಿತಿ ವೇತನ ಬಡ್ತಿ</option>
            <option value="15 ವರ್ಷದ ಸ್ವಯಂ ಚಾಲಿತ ವೇತನ ಬಡ್ತಿ">15 ವರ್ಷದ ಸ್ವಯಂ ಚಾಲಿತ ವೇತನ ಬಡ್ತಿ</option>
            <option value="20 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ">20 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ</option>
            <option value="25 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ">25 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ</option>
            <option value="30 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ">30 ವರ್ಷದ ಹೆಚ್ಚುವರಿ ವೇತನ ಬಡ್ತಿ</option>
          </select>
        </div>
      </div>

      {/* Table of Orders */}
      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">ಕಡತ ಸಂಖ್ಯೆ & ದಿನಾಂಕ</th>
                <th className="py-3 px-4">ಜ್ಞಾಪನ ಸಂಖ್ಯೆ (Order No)</th>
                <th className="py-3 px-4">ನೌಕರರ ಹೆಸರು & ಕೆಜಿಐಡಿ</th>
                <th className="py-3 px-4">ಆದೇಶ ಪ್ರಕಾರ (Order Type)</th>
                <th className="py-3 px-4">ವೇತನ ಪರಿಷ್ಕರಣೆ</th>
                <th className="py-3 px-4">ದಾಖಲಿಸಿದವರು</th>
                <th className="py-3 px-4 text-right">ಕ್ರಮಗಳು (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-stone-800">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-500">
                    ಯಾವುದೇ ಆದೇಶ ಕಡತಗಳು ಕಂಡುಬಂದಿಲ್ಲ.
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-stone-900 block">{file.fileId}</span>
                      <span className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> {file.orderDate}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-sky-950">
                      {file.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-stone-900 block">{file.employeeName}</span>
                      <span className="text-[11px] font-mono text-stone-500">KGID: {file.kgidNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-900 border border-sky-200">
                        {file.orderType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {file.oldBasicPay !== file.newBasicPay ? (
                        <div>
                          <span className="text-stone-500 line-through text-[11px]">₹{file.oldBasicPay.toLocaleString('en-IN')}</span>
                          <span className="text-emerald-700 font-bold block">₹{file.newBasicPay.toLocaleString('en-IN')}/-</span>
                        </div>
                      ) : (
                        <span className="text-stone-600 font-medium">ರಜೆ ಮಂಜೂರಾತಿ</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-stone-600 text-[11px]">
                      {file.createdBy}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingFile(file)}
                          className="p-1.5 text-sky-900 hover:bg-sky-50 rounded border border-sky-200 transition-colors cursor-pointer"
                          title="ಆದೇಶ ವೀಕ್ಷಿಸಿ"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrint(file)}
                          className="p-1.5 text-stone-700 hover:bg-stone-100 rounded border border-stone-200 transition-colors cursor-pointer"
                          title="ಮುದ್ರಿಸಿ (Print)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {currentUser?.role === 'Admin' && (
                          <button
                            type="button"
                            onClick={() => handleDelete(file.id, file.orderNumber)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 transition-colors cursor-pointer"
                            title="ಅಳಿಸಿ (Admin Only)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW ORDER MODAL */}
      {viewingFile && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-stone-300 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50 rounded-t-lg">
              <div>
                <span className="text-[10px] font-bold uppercase text-sky-950 px-2 py-0.5 bg-sky-100 rounded border border-sky-300">
                  {viewingFile.orderType}
                </span>
                <h3 className="text-sm font-bold text-stone-900 mt-1 font-mono">
                  {viewingFile.orderNumber}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrint(viewingFile)}
                  className="px-3 py-1.5 bg-sky-950 hover:bg-sky-900 text-white text-xs font-bold rounded flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> ಮುದ್ರಿಸಿ
                </button>
                <button
                  type="button"
                  onClick={() => setViewingFile(null)}
                  className="text-stone-400 hover:text-stone-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-stone-100/60">
              <div 
                className="bg-white shadow-xs border border-stone-300 p-6 rounded"
                dangerouslySetInnerHTML={{ __html: viewingFile.generatedDocumentHtml }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
