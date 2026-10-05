import { ChevronRight, FileText, FileUp, Info, Upload } from "lucide-react";

export default function UploadQuestionPaper({
  Card,
  SectionHeader,
  fileRef,
  selectedFile,
  handleFile,
  submitMockUpload,
  uploadMessage,
}) {
  return (
    <Card className="overflow-hidden">
      <SectionHeader icon={Upload} title="Upload Question Paper" />

      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <p className="mb-4 text-sm text-slate-500">
            Submit a complete and finalized question paper in PDF format.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFile}
          />

          <button
            onClick={() => fileRef.current?.click()}
            className="flex min-h-[155px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#cbd9e5] bg-[#fbfdff] px-4 transition hover:border-[#3f7ba4] hover:bg-[#f7fbfe]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e9f3fa] text-[#1670ad]">
              <FileUp size={22} />
            </div>

            <div className="mt-3 text-sm font-medium text-slate-700">
              {selectedFile ? selectedFile.name : "Drag & drop your PDF file here"}
            </div>

            {!selectedFile && (
              <>
                <div className="mt-1 text-xs text-slate-400">or</div>
                <span className="mt-2 rounded-md bg-[#176bb0] px-6 py-2 text-xs font-medium text-white shadow-sm">
                  Select PDF File
                </span>
              </>
            )}

            <div className="mt-2 text-[10px] text-slate-400">
              Only PDF files are allowed (Max size: 50 MB)
            </div>
          </button>

          {selectedFile && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-blue-600" />
                <div>
                  <div className="text-xs font-medium text-slate-800">
                    {selectedFile.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>

              <button
                onClick={submitMockUpload}
                className="rounded-md bg-[#176bb0] px-4 py-2 text-xs font-medium text-white transition hover:bg-[#125b95]"
              >
                Submit Question Paper
              </button>
            </div>
          )}

          {uploadMessage && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
              <Info size={15} className="mt-0.5 shrink-0 text-[#176bb0]" />
              {uploadMessage}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-[#fbfcfe] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Info size={17} className="text-[#176bb0]" />
            Guidelines
          </div>

          <ul className="mt-3 space-y-3 text-xs leading-5 text-slate-500">
            {[
              "File format: PDF only",
              "Maximum file size: 50 MB",
              "Ensure all pages are included",
              "Verify examination, subject and set details",
              "Upload only the final and complete paper",
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <ChevronRight size={14} className="mt-0.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
