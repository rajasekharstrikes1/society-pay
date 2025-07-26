import React, { useState, useEffect, useCallback } from "react";
import { Save, TestTube, MessageSquare } from "lucide-react";
import { whatsappService } from "../../services/whatsapp";
import { WhatsAppTemplate } from "../../types";

// --- Type Definitions ---
interface WhatsAppConfigData {
  wabaNumber: string;
  apiKey: string;
  baseUrl: string;
}

interface WhatsAppConfigProps {
  communityId: string;
  initialConfig?: WhatsAppConfigData;
  onSave: (config: WhatsAppConfigData) => void;
}

export default function WhatsAppConfig({ initialConfig, onSave }: WhatsAppConfigProps) {
  const [config, setConfig] = useState<WhatsAppConfigData>({
    wabaNumber: initialConfig?.wabaNumber || "",
    apiKey: initialConfig?.apiKey || "",
    baseUrl: initialConfig?.baseUrl || "https://cpaasreseller.notify24x7.com/REST/directApi",
  });
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [testNumber, setTestNumber] = useState("");
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Wrapped fetchTemplates in useCallback for stability
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      whatsappService.setConfig(config);
      const fetchedTemplates = await whatsappService.fetchTemplates();
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    if (config.wabaNumber && config.apiKey) {
      fetchTemplates();
    }
  }, [config.wabaNumber, config.apiKey, fetchTemplates]);

  const handleSave = () => {
    onSave(config);
  };

  const handleTestMessage = async () => {
    if (!testNumber || !selectedTemplate) {
      alert("Please enter a test number and select a template.");
      return;
    }

    try {
      setTesting(true);
      whatsappService.setConfig(config);
      
      if (selectedTemplate === "text") {
        await whatsappService.sendTextMessage(testNumber, "This is a test message.");
      } else {
        await whatsappService.sendTemplateMessage(testNumber, selectedTemplate);
      }
      
      alert("Test message sent successfully!");
    } catch (error) {
      console.error("Error sending test message:", error);
      alert("Failed to send test message.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <MessageSquare className="h-6 w-6 text-green-600 mr-3" />
        <h2 className="text-xl font-semibold text-gray-900">WhatsApp Configuration</h2>
      </div>

      <div className="space-y-4">
        {/* WABA Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            WABA Number
          </label>
          <input
            type="text"
            value={config.wabaNumber}
            onChange={(e) => setConfig({ ...config, wabaNumber: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter WABA Number"
          />
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter API Key"
          />
        </div>

        {/* Base URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base URL
          </label>
          <input
            type="url"
            value={config.baseUrl}
            onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Base URL"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </button>
        </div>
      </div>

      {/* Test Section */}
      {config.wabaNumber && config.apiKey && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Test Configuration</h3>
          
          <div className="space-y-4">
            {/* Test Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Phone Number
              </label>
              <input
                type="tel"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number with country code (e.g., +919876543210)"
              />
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Select a template</option>
                <option value="text">Simple Text Message</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.name}>
                    {template.name}
                  </option>
                ))}
              </select>
              {loading && (
                <p className="text-sm text-gray-500 mt-1">Loading templates...</p>
              )}
            </div>

            {/* Test Button */}
            <div className="flex justify-end">
              <button
                onClick={handleTestMessage}
                disabled={testing || !testNumber || !selectedTemplate}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testing ? "Sending..." : "Send Test Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
