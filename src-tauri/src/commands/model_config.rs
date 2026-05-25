use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::time::{Duration, Instant};

const DEFAULT_CLOUD_MODEL: &str = "claude-sonnet-4-6";
const DEFAULT_LOCAL_URL: &str = "http://localhost:1234/v1";

/// Model configuration surfaced to the frontend. Persisted inside
/// `~/.claude/settings.json` so the Claude Code CLI honors it directly.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelConfig {
    /// "cloud" (Anthropic) or "local" (LM Studio / OpenAI-compatible endpoint)
    pub mode: String,
    pub cloud_model: String,
    pub local_base_url: Option<String>,
    pub local_model_name: Option<String>,
}

impl Default for ModelConfig {
    fn default() -> Self {
        Self {
            mode: "cloud".to_string(),
            cloud_model: DEFAULT_CLOUD_MODEL.to_string(),
            local_base_url: Some(DEFAULT_LOCAL_URL.to_string()),
            local_model_name: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EndpointTestResult {
    pub success: bool,
    pub latency_ms: Option<u64>,
    pub error: Option<String>,
}

/// Path to ~/.claude/settings.json without requiring the directory to exist
/// (unlike claude::get_claude_dir which canonicalizes and fails if absent).
fn settings_path() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
    Ok(home.join(".claude").join("settings.json"))
}

/// Pure: derive a ModelConfig from raw settings JSON. Local mode is detected by
/// the presence of `env.ANTHROPIC_BASE_URL`.
fn config_from_settings(settings: &serde_json::Value) -> ModelConfig {
    let env = settings.get("env");
    let base_url = env
        .and_then(|e| e.get("ANTHROPIC_BASE_URL"))
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty());
    let model = settings.get("model").and_then(|v| v.as_str());

    if let Some(base_url) = base_url {
        let local_model = env
            .and_then(|e| e.get("ANTHROPIC_MODEL"))
            .and_then(|v| v.as_str())
            .or(model)
            .map(|s| s.to_string());
        ModelConfig {
            mode: "local".to_string(),
            cloud_model: DEFAULT_CLOUD_MODEL.to_string(),
            local_base_url: Some(base_url.to_string()),
            local_model_name: local_model,
        }
    } else {
        ModelConfig {
            mode: "cloud".to_string(),
            cloud_model: model.unwrap_or(DEFAULT_CLOUD_MODEL).to_string(),
            local_base_url: Some(DEFAULT_LOCAL_URL.to_string()),
            local_model_name: None,
        }
    }
}

/// Pure: merge a ModelConfig into raw settings JSON, preserving all unrelated
/// keys (read-modify-write — `save_claude_settings` is a full overwrite).
fn apply_config_to_settings(
    settings: &mut serde_json::Value,
    config: &ModelConfig,
) -> Result<(), String> {
    if !settings.is_object() {
        *settings = serde_json::json!({});
    }
    let obj = settings.as_object_mut().unwrap();

    match config.mode.as_str() {
        "cloud" => {
            obj.insert(
                "model".to_string(),
                serde_json::Value::String(config.cloud_model.clone()),
            );
            // Drop only the local-routing env vars; keep any other env entries.
            if let Some(env) = obj.get_mut("env").and_then(|e| e.as_object_mut()) {
                env.remove("ANTHROPIC_BASE_URL");
                env.remove("ANTHROPIC_MODEL");
                if env.is_empty() {
                    obj.remove("env");
                }
            }
        }
        "local" => {
            let base_url = config
                .local_base_url
                .clone()
                .filter(|s| !s.is_empty())
                .ok_or_else(|| "local_base_url is required for local mode".to_string())?;
            let model_name = config
                .local_model_name
                .clone()
                .filter(|s| !s.is_empty())
                .ok_or_else(|| "local_model_name is required for local mode".to_string())?;
            obj.insert(
                "model".to_string(),
                serde_json::Value::String(model_name.clone()),
            );
            let env = obj
                .entry("env")
                .or_insert_with(|| serde_json::json!({}));
            if !env.is_object() {
                *env = serde_json::json!({});
            }
            let env_obj = env.as_object_mut().unwrap();
            env_obj.insert(
                "ANTHROPIC_BASE_URL".to_string(),
                serde_json::Value::String(base_url),
            );
            env_obj.insert(
                "ANTHROPIC_MODEL".to_string(),
                serde_json::Value::String(model_name),
            );
        }
        other => return Err(format!("Invalid mode: {}", other)),
    }
    Ok(())
}

/// Reads the current model configuration from ~/.claude/settings.json.
#[tauri::command]
pub async fn get_model_config() -> Result<ModelConfig, String> {
    let path = settings_path()?;
    if !path.exists() {
        return Ok(ModelConfig::default());
    }
    let content =
        std::fs::read_to_string(&path).map_err(|e| format!("Failed to read settings: {}", e))?;
    let settings: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse settings JSON: {}", e))?;
    Ok(config_from_settings(&settings))
}

/// Writes the model configuration into ~/.claude/settings.json atomically
/// (temp file + rename), preserving unrelated keys. Returns the re-derived config.
#[tauri::command]
pub async fn set_model_config(config: ModelConfig) -> Result<ModelConfig, String> {
    let path = settings_path()?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create .claude dir: {}", e))?;
    }

    let mut settings: serde_json::Value = if path.exists() {
        let content = std::fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read settings: {}", e))?;
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse settings JSON: {}", e))?
    } else {
        serde_json::json!({})
    };

    apply_config_to_settings(&mut settings, &config)?;

    let json_string = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;

    // Atomic write (INV-3): write temp in same dir, then rename over the target.
    let tmp_path = path.with_extension("json.tmp");
    std::fs::write(&tmp_path, &json_string)
        .map_err(|e| format!("Failed to write temp settings: {}", e))?;
    std::fs::rename(&tmp_path, &path)
        .map_err(|e| format!("Failed to commit settings: {}", e))?;

    Ok(config_from_settings(&settings))
}

/// Pings a local OpenAI-compatible endpoint (LM Studio) by requesting its
/// model list. Reports reachability and round-trip latency.
#[tauri::command]
pub async fn test_local_endpoint(
    base_url: String,
    model_name: Option<String>,
) -> Result<EndpointTestResult, String> {
    let _ = model_name; // reserved for a future chat-completions probe
    // Guardrail (review H-2): only probe http(s) URLs, not arbitrary schemes.
    let trimmed = base_url.trim();
    if !(trimmed.starts_with("http://") || trimmed.starts_with("https://")) {
        return Ok(EndpointTestResult {
            success: false,
            latency_ms: None,
            error: Some("Base URL must start with http:// or https://".to_string()),
        });
    }
    let url = format!("{}/models", trimmed.trim_end_matches('/'));
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let start = Instant::now();
    match client.get(&url).send().await {
        Ok(resp) => {
            let latency = start.elapsed().as_millis() as u64;
            if resp.status().is_success() {
                Ok(EndpointTestResult {
                    success: true,
                    latency_ms: Some(latency),
                    error: None,
                })
            } else {
                Ok(EndpointTestResult {
                    success: false,
                    latency_ms: Some(latency),
                    error: Some(format!("HTTP {}", resp.status())),
                })
            }
        }
        Err(e) => Ok(EndpointTestResult {
            success: false,
            latency_ms: None,
            error: Some(e.to_string()),
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cloud_config_from_empty_settings() {
        let c = config_from_settings(&serde_json::json!({}));
        assert_eq!(c.mode, "cloud");
        assert_eq!(c.cloud_model, DEFAULT_CLOUD_MODEL);
    }

    #[test]
    fn cloud_config_reads_model() {
        let c = config_from_settings(&serde_json::json!({"model": "claude-opus-4-7"}));
        assert_eq!(c.mode, "cloud");
        assert_eq!(c.cloud_model, "claude-opus-4-7");
    }

    #[test]
    fn local_config_detected_by_base_url() {
        let s = serde_json::json!({
            "model": "llama-3.2",
            "env": {"ANTHROPIC_BASE_URL": "http://localhost:1234/v1", "ANTHROPIC_MODEL": "llama-3.2"}
        });
        let c = config_from_settings(&s);
        assert_eq!(c.mode, "local");
        assert_eq!(c.local_base_url.as_deref(), Some("http://localhost:1234/v1"));
        assert_eq!(c.local_model_name.as_deref(), Some("llama-3.2"));
    }

    #[test]
    fn apply_cloud_preserves_other_keys() {
        let mut s = serde_json::json!({
            "theme": "dark",
            "env": {"FOO": "bar", "ANTHROPIC_BASE_URL": "x", "ANTHROPIC_MODEL": "y"}
        });
        let cfg = ModelConfig {
            mode: "cloud".into(),
            cloud_model: "claude-sonnet-4-6".into(),
            local_base_url: None,
            local_model_name: None,
        };
        apply_config_to_settings(&mut s, &cfg).unwrap();
        assert_eq!(s["model"], "claude-sonnet-4-6");
        assert_eq!(s["theme"], "dark"); // unrelated key preserved
        assert_eq!(s["env"]["FOO"], "bar"); // unrelated env preserved
        assert!(s["env"].get("ANTHROPIC_BASE_URL").is_none()); // local routing removed
    }

    #[test]
    fn apply_cloud_drops_empty_env() {
        let mut s = serde_json::json!({"env": {"ANTHROPIC_BASE_URL": "x"}});
        let cfg = ModelConfig {
            mode: "cloud".into(),
            cloud_model: "claude-sonnet-4-6".into(),
            local_base_url: None,
            local_model_name: None,
        };
        apply_config_to_settings(&mut s, &cfg).unwrap();
        assert!(s.get("env").is_none()); // env had only routing keys → removed
    }

    #[test]
    fn apply_local_sets_env() {
        let mut s = serde_json::json!({"theme": "dark"});
        let cfg = ModelConfig {
            mode: "local".into(),
            cloud_model: "claude-sonnet-4-6".into(),
            local_base_url: Some("http://localhost:1234/v1".into()),
            local_model_name: Some("llama-3.2".into()),
        };
        apply_config_to_settings(&mut s, &cfg).unwrap();
        assert_eq!(s["model"], "llama-3.2");
        assert_eq!(s["theme"], "dark");
        assert_eq!(s["env"]["ANTHROPIC_BASE_URL"], "http://localhost:1234/v1");
        assert_eq!(s["env"]["ANTHROPIC_MODEL"], "llama-3.2");
    }

    #[test]
    fn apply_local_requires_fields() {
        let mut s = serde_json::json!({});
        let cfg = ModelConfig {
            mode: "local".into(),
            cloud_model: "x".into(),
            local_base_url: None,
            local_model_name: None,
        };
        assert!(apply_config_to_settings(&mut s, &cfg).is_err());
    }

    #[test]
    fn round_trip_cloud() {
        let mut s = serde_json::json!({});
        let cfg = ModelConfig {
            mode: "cloud".into(),
            cloud_model: "claude-haiku-4-5".into(),
            local_base_url: None,
            local_model_name: None,
        };
        apply_config_to_settings(&mut s, &cfg).unwrap();
        let back = config_from_settings(&s);
        assert_eq!(back.mode, "cloud");
        assert_eq!(back.cloud_model, "claude-haiku-4-5");
    }

    #[tokio::test]
    async fn test_endpoint_rejects_non_http_scheme() {
        let r = test_local_endpoint("ftp://evil/internal".to_string(), None)
            .await
            .unwrap();
        assert!(!r.success);
        assert!(r.error.unwrap().contains("http"));
    }

    #[test]
    fn invalid_mode_errors() {
        let mut s = serde_json::json!({});
        let cfg = ModelConfig {
            mode: "bogus".into(),
            cloud_model: "x".into(),
            local_base_url: None,
            local_model_name: None,
        };
        assert!(apply_config_to_settings(&mut s, &cfg).is_err());
    }
}
