import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SelectComponent } from "@/components/ui/select";
import { Loader2, Plug, Cloud, MonitorSmartphone } from "lucide-react";

export interface ModelConfig {
  mode: string; // "cloud" | "local"
  cloud_model: string;
  local_base_url: string | null;
  local_model_name: string | null;
}

interface EndpointTestResult {
  success: boolean;
  latency_ms: number | null;
  error: string | null;
}

interface ModelSwitcherProps {
  setToast: (toast: { message: string; type: "success" | "error" } | null) => void;
}

const CLOUD_MODELS = [
  { value: "claude-opus-4-7", label: "Claude Opus 4.7 (most capable)" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (balanced)" },
  { value: "claude-haiku-4-5", label: "Claude Haiku 4.5 (fastest)" },
];

const DEFAULT_LOCAL_URL = "http://localhost:1234/v1";

export function ModelSwitcher({ setToast }: ModelSwitcherProps) {
  const [config, setConfig] = useState<ModelConfig>({
    mode: "cloud",
    cloud_model: "claude-sonnet-4-6",
    local_base_url: DEFAULT_LOCAL_URL,
    local_model_name: null,
  });
  const [active, setActive] = useState<ModelConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<EndpointTestResult | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const loaded = await invoke<ModelConfig>("get_model_config");
      setConfig({ ...loaded, local_base_url: loaded.local_base_url || DEFAULT_LOCAL_URL });
      setActive(loaded);
    } catch (error) {
      console.error("Failed to load model config:", error);
      setToast({ message: "Failed to load model configuration", type: "error" });
    }
  };

  const save = async () => {
    if (config.mode === "local") {
      if (!config.local_base_url?.trim() || !config.local_model_name?.trim()) {
        setToast({ message: "Local mode needs a base URL and a model name", type: "error" });
        return;
      }
    }
    setSaving(true);
    try {
      const applied = await invoke<ModelConfig>("set_model_config", { config });
      setActive(applied);
      setToast({ message: "Model configuration saved to ~/.claude/settings.json", type: "success" });
    } catch (error) {
      console.error("Failed to save model config:", error);
      setToast({ message: `Failed to save model config: ${error}`, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config.local_base_url?.trim()) {
      setToast({ message: "Enter a base URL first", type: "error" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const result = await invoke<EndpointTestResult>("test_local_endpoint", {
        baseUrl: config.local_base_url,
        modelName: config.local_model_name,
      });
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, latency_ms: null, error: String(error) });
    } finally {
      setTesting(false);
    }
  };

  const activeLabel =
    active?.mode === "local"
      ? `Local: ${active.local_model_name || "unset"}`
      : `Cloud: ${active?.cloud_model || "unset"}`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium">Model</h3>
          <p className="text-sm text-muted-foreground">
            Switch Claude Code between Anthropic cloud models and a local LM Studio endpoint.
            Writes to <code className="text-xs">~/.claude/settings.json</code>.
          </p>
        </div>
        <Badge variant={active?.mode === "local" ? "secondary" : "default"} className="shrink-0">
          {activeLabel}
        </Badge>
      </div>

      <RadioGroup
        value={config.mode}
        onValueChange={(mode) => setConfig((p) => ({ ...p, mode }))}
        className="grid grid-cols-2 gap-3"
      >
        <label
          htmlFor="mode-cloud"
          className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors"
        >
          <RadioGroupItem value="cloud" id="mode-cloud" />
          <Cloud className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium">Cloud (Anthropic)</div>
            <div className="text-xs text-muted-foreground">Opus / Sonnet / Haiku</div>
          </div>
        </label>
        <label
          htmlFor="mode-local"
          className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors"
        >
          <RadioGroupItem value="local" id="mode-local" />
          <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium">Local (LM Studio)</div>
            <div className="text-xs text-muted-foreground">OpenAI-compatible endpoint</div>
          </div>
        </label>
      </RadioGroup>

      {config.mode === "cloud" ? (
        <div className="space-y-2">
          <Label htmlFor="cloud-model">Cloud model</Label>
          <SelectComponent
            value={config.cloud_model}
            onValueChange={(v) => setConfig((p) => ({ ...p, cloud_model: v }))}
            options={CLOUD_MODELS}
            placeholder="Select a model"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="local-url">Base URL</Label>
            <Input
              id="local-url"
              placeholder={DEFAULT_LOCAL_URL}
              value={config.local_base_url || ""}
              onChange={(e) => setConfig((p) => ({ ...p, local_base_url: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="local-model">Model name</Label>
            <Input
              id="local-model"
              placeholder="e.g. lmstudio-community/Llama-3.2-3B-Instruct"
              value={config.local_model_name || ""}
              onChange={(e) => setConfig((p) => ({ ...p, local_model_name: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={testConnection} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
              Test connection
            </Button>
            {testResult && (
              <span
                className={`text-sm ${testResult.success ? "text-green-500" : "text-destructive"}`}
              >
                {testResult.success
                  ? `Reachable${testResult.latency_ms != null ? ` (${testResult.latency_ms}ms)` : ""}`
                  : `Failed: ${testResult.error}`}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            The endpoint must speak the Anthropic Messages API (set LM Studio or a proxy
            accordingly). The test only checks that <code className="text-xs">/models</code> is reachable.
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save model configuration
        </Button>
      </div>
    </div>
  );
}
