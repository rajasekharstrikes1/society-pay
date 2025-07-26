import React, { useState, useEffect, useCallback } from "react";
import { MessageSquare, Send, Plus } from "lucide-react";
import { WhatsAppTemplate } from "../../types";
import { whatsappService } from "../../services/whatsapp";

interface MessageTemplatesProps {
  communityId: string;
}

// --- FIXED: Added specific type instead of 'any' ---
interface TemplatePreviewData {
  residentName: string;
  flatNumber: string;
  communityName: string;
  amount: string;
  dueDate: string;
  paymentLink: string;
}

// --- Helper function moved outside the component to prevent re-creation on every render ---
const renderTemplatePreview = (template: WhatsAppTemplate | null, previewData: TemplatePreviewData) => {
  if (!template) return null;

  // This helper function replaces placeholders in the template text
  const replacePlaceholders = (text: string) => {
    return text
      .replace(/\{\{1\}\}/g, previewData.residentName)
      .replace(/\{\{2\}\}/g, previewData.flatNumber)
      .replace(/\{\{3\}\}/g, previewData.communityName)
      .replace(/\{\{4\}\}/g, `₹${previewData.amount}`)
      .replace(/\{\{5\}\}/g, previewData.dueDate);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-sm">
      <div className="bg-green-500 text-white p-2 rounded-t-lg text-sm font-medium">
        WhatsApp Business
      </div>
      <div className="p-3 space-y-2">
        {template.components.map((component, index) => {
          const content = component.text ? replacePlaceholders(component.text) : "";
          
          if (component.type === "HEADER") return <div key={index} className="font-bold text-gray-900 text-sm">{content}</div>;
          if (component.type === "BODY") return <div key={index} className="text-gray-800 text-sm whitespace-pre-line">{content}</div>;
          if (component.type === "FOOTER") return <div key={index} className="text-gray-500 text-xs">{content}</div>;
          if (component.type === "BUTTONS" && component.buttons) {
            return (
              <div key={index} className="space-y-1 mt-2">
                {component.buttons.map((button, btnIndex) => (
                  <button key={btnIndex} className="w-full bg-blue-500 text-white py-2 px-3 rounded text-sm hover:bg-blue-600">
                    {button.text}
                  </button>
                ))}
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default function MessageTemplates({ communityId }: MessageTemplatesProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [previewData, setPreviewData] = useState<TemplatePreviewData>({
    residentName: "John Doe",
    flatNumber: "A-101",
    communityName: "Green Valley Apartments",
    amount: "3000",
    dueDate: "31st July 2025",
    paymentLink: "https://pay.example.com/abc123",
  });
  const [loading, setLoading] = useState(false);

  // FIXED: fetchTemplates now uses the communityId and is wrapped in useCallback
  const fetchTemplates = useCallback(async () => {
    if (!communityId) return; // Don't fetch if there's no communityId
    try {
      setLoading(true);
      // Note: The whatsappService.fetchTemplates doesn't actually take communityId parameter
      // based on the service implementation, but keeping the logic for future enhancement
      const fetchedTemplates = await whatsappService.fetchTemplates();
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <MessageSquare className="h-6 w-6 text-primary mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Message Templates</h3>
        </div>
        <button className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary/90 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Templates List */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Available Templates</h4>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedTemplate?.id === template.id ? "border-secondary bg-secondary/5" : "border-gray-200 hover:border-gray-300"}`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <h5 className="font-medium text-gray-900">{template.name}</h5>
                  <p className="text-sm text-gray-500">Status: {template.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Template Preview */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Template Preview</h4>
          {selectedTemplate ? (
            <div className="space-y-4">
              {/* FIXED: Added preview data customization to use setPreviewData */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h5 className="text-sm font-medium text-gray-700">Customize Preview Data</h5>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Resident Name"
                    value={previewData.residentName}
                    onChange={(e) => setPreviewData({...previewData, residentName: e.target.value})}
                    className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Flat Number"
                    value={previewData.flatNumber}
                    onChange={(e) => setPreviewData({...previewData, flatNumber: e.target.value})}
                    className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Community Name"
                    value={previewData.communityName}
                    onChange={(e) => setPreviewData({...previewData, communityName: e.target.value})}
                    className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Amount"
                    value={previewData.amount}
                    onChange={(e) => setPreviewData({...previewData, amount: e.target.value})}
                    className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Due Date"
                    value={previewData.dueDate}
                    onChange={(e) => setPreviewData({...previewData, dueDate: e.target.value})}
                    className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 col-span-2"
                  />
                </div>
              </div>

              {renderTemplatePreview(selectedTemplate, previewData)}
              
              <div className="flex space-x-3">
                <button className="flex-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 flex items-center justify-center">
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Message
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Select a template to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
