import React, { useState, useRef, useEffect } from "react";
import { Copy, AlertCircle, ChevronUp, ChevronDown, ChevronsUp, Shield, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import { Badge } from "../../../ui/badge";
import { Button } from "../../../ui/button";
import { useToast } from "../../../common/ToastProvider";
import HotspotHeader from "./HotspotHeader";
import HotspotTabs from "./HotspotTabs";

const HotspotDetails = ({ selectedHotspot }) => {
  const [activeTab, setActiveTab] = useState("risk");
  const { success } = useToast();

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  // ✅ Hotspot object
  const hotspot = selectedHotspot || null;

  // Priority icon helper
const getPriorityIcon = (priority) => {
  switch (priority?.toLowerCase()) {
    case "high":
      return <ChevronsUp className="h-4 w-4 text-red-500" />;
    case "medium":
      return <ChevronUp className="h-4 w-4 text-orange-500" />;
    case "low":
      return <ChevronDown className="h-4 w-4 text-blue-500" />;
    default:
      return null;
  }
};
  const filePath =
    hotspot?.component?.path ||
    hotspot?.component?.longName ||
    hotspot?.component?.name ||
    "";

  // Copy path handler
  const handleCopyPath = () => {
    if (filePath) {
      navigator.clipboard.writeText(filePath);
      success("File path copied to clipboard");
    }
  };

  // Editor mount callback
  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    setTimeout(() => editor?.layout(), 0);

    const resizeHandler = () => editor?.layout();
    window.addEventListener("resize", resizeHandler);
    return () => window.removeEventListener("resize", resizeHandler);
  };

  // Highlight hotspot lines
  useEffect(() => {
    if (!hotspot || !editorRef.current || !monacoRef.current) return;

    const startLine = hotspot?.textRange?.startLine || hotspot?.line || 1;
    const endLine = hotspot?.textRange?.endLine || hotspot?.line || startLine;
    const monaco = monacoRef.current;
    const range = new monaco.Range(startLine, 1, endLine, 1);

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      [
        {
          range,
          options: {
            isWholeLine: true,
            className: "hotspot-monaco-line-highlight",
            linesDecorationsClassName: "hotspot-monaco-gutter-highlight",
          },
        },
      ]
    );

    editorRef.current.revealRangeInCenter(range);
  }, [hotspot]);

  // Empty state
  if (!hotspot) {
    return (
      <Card className="border-slate-200 h-full min-h-[400px]">
        <CardContent className="flex flex-col items-center justify-center h-full py-16 text-center">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No hotspot selected</h3>
          <p className="text-sm text-slate-500 max-w-xs">
            Select a security hotspot from the list to view its details and assess the risk.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          {/* Title row with copy */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3 className="text-base font-semibold text-slate-900 flex-1">
              {hotspot.message}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={handleCopyPath}
              title="Copy file path"
            >
              <Copy className="h-4 w-4 text-slate-500" />
            </Button>
          </div>

          {/* Rule info */}
          <p className="text-sm text-slate-600 mb-4">
            {hotspot.rule?.name} <span className="text-slate-400">{hotspot.rule?.key}</span>
          </p>

          {/* Status and Review button row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge 
                  variant="outline" 
                  className="bg-amber-50 text-amber-700 border-amber-200"
                >
                  {hotspot.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-600">
                This security hotspot needs to be reviewed to assess whether the code poses a risk.
              </p>
            </div>
            <Button className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white">
              Review
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metadata Card */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Review priority</p>
              <div className="flex items-center gap-1.5">
                {getPriorityIcon(hotspot.rule?.vulnerabilityProbability)}
                <span className="text-sm font-medium text-slate-700">
                  {hotspot.rule?.vulnerabilityProbability}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Category</p>
              <p className="text-sm font-medium text-slate-700">{hotspot.rule?.securityCategory}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Assignee</p>
              <div className="flex items-center gap-1.5 text-slate-400">
                <User className="h-3.5 w-3.5" />
                <span className="text-sm">Not assigned</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Content */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <HotspotTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            hotspot={hotspot}
            filePath={filePath}
            handleCopyPath={handleCopyPath}
            handleEditorMount={handleEditorMount}
          />
        </CardContent>
      </Card>

    </div>
  );
};

export default HotspotDetails;
