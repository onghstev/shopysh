#!/bin/bash
# ============================================
# Download Qwen2.5 3B Instruct Q4_K_M GGUF model
# for local CPU inference via llama.cpp
# ============================================
set -e

MODEL_NAME="qwen2.5-3b-instruct-q4_k_m.gguf"
MODEL_URL="https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf"

# Get the Docker volume mount path
MODEL_DIR=$(docker volume inspect shopysh_llm_models --format '{{ .Mountpoint }}' 2>/dev/null || echo "")

if [ -z "$MODEL_DIR" ]; then
  echo "📦 Creating Docker volume for LLM models..."
  docker volume create shopysh_llm_models
  MODEL_DIR=$(docker volume inspect shopysh_llm_models --format '{{ .Mountpoint }}')
fi

MODEL_PATH="$MODEL_DIR/$MODEL_NAME"

if [ -f "$MODEL_PATH" ]; then
  echo "✅ Model already downloaded: $MODEL_PATH"
  echo "   Size: $(du -h "$MODEL_PATH" | cut -f1)"
  exit 0
fi

echo "🧠 Downloading Qwen2.5 3B Instruct Q4_K_M..."
echo "   Source: HuggingFace (Qwen official)"
echo "   Size:   ~1.93 GB"
echo "   This may take a while depending on your connection speed."
echo ""

# Download with progress bar and resume support
sudo curl -L --progress-bar --retry 3 --retry-delay 5 \
  -C - \
  -o "$MODEL_PATH" \
  "$MODEL_URL"

echo ""
echo "✅ Model downloaded successfully!"
echo "   Path: $MODEL_PATH"
echo "   Size: $(du -h "$MODEL_PATH" | cut -f1)"
echo ""
echo "🚀 Start the LLM server with: docker compose up -d llm"
