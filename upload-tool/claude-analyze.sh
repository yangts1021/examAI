#!/bin/bash
# ============================================================
# ExamAI - 使用 Claude CLI 分析考卷圖片 (免 API Key)
#
# 用法:
#   ./claude-analyze.sh 正面.jpg
#   ./claude-analyze.sh 正面.jpg 背面.jpg
#   ./claude-analyze.sh 正面.jpg 背面.jpg | pbcopy   # 複製到剪貼簿
#
# 需求: 已安裝並登入 claude CLI (Claude Code)
# ============================================================

set -e

if [ $# -eq 0 ]; then
  echo "用法: $0 <圖片路徑> [背面圖片路徑]" >&2
  echo "" >&2
  echo "範例:" >&2
  echo "  $0 exam_front.jpg" >&2
  echo "  $0 exam_front.jpg exam_back.jpg" >&2
  echo "  $0 exam_front.jpg | pbcopy  # 複製結果到剪貼簿" >&2
  exit 1
fi

# Validate files exist
for f in "$@"; do
  if [ ! -f "$f" ]; then
    echo "錯誤: 檔案不存在 - $f" >&2
    exit 1
  fi
done

PROMPT='Read the image file(s) I will specify below and analyze the exam paper(s).

You MUST output ONLY a single valid JSON object (no markdown fences, no explanation text before or after). The JSON must match this exact structure:

{
  "subject": "科目名稱",
  "scope": "範圍/章節",
  "questions": [
    {
      "questionNumber": 1,
      "text": "題目內容",
      "optionA": "選項A",
      "optionB": "選項B",
      "optionC": "選項C",
      "optionD": "選項D",
      "correctAnswer": "A",
      "explanation": "詳解",
      "diagramCoordinates": [ymin, xmin, ymax, xmax],
      "groupId": "",
      "groupContent": ""
    }
  ]
}

Instructions:
1. Identify the Subject and Scope.
2. Extract ALL multiple-choice questions.
3. HANDLE QUESTION GROUPS: If multiple questions share the same context (reading comprehension, data sets), assign the SAME groupId and put the shared passage in groupContent for every question in that group.
4. SOLVE each question to determine correctAnswer (A, B, C, or D).
5. Provide a detailed explanation.
6. If a question has a diagram/graph/figure, provide bounding box as diagramCoordinates [ymin, xmin, ymax, xmax] on 0-1000 scale. Otherwise omit this field.
7. Return explanation, subject, scope, and groupContent in Traditional Chinese (繁體中文).

Image file(s) to analyze:'

# Append file paths to prompt
for f in "$@"; do
  ABSOLUTE_PATH="$(cd "$(dirname "$f")" && pwd)/$(basename "$f")"
  PROMPT="$PROMPT
- $ABSOLUTE_PATH"
done

# Run claude CLI in print mode
# The -p flag runs non-interactively and outputs the result directly
echo "正在使用 Claude 分析考卷..." >&2

RESULT=$(claude -p "$PROMPT" 2>/dev/null)

# Try to extract JSON from the result (in case Claude wraps it in markdown)
# First try: direct JSON parse
if echo "$RESULT" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
  echo "$RESULT"
else
  # Try to extract JSON from markdown code block
  EXTRACTED=$(echo "$RESULT" | python3 -c "
import sys, re, json
text = sys.stdin.read()
# Try to find JSON in code blocks
match = re.search(r'\`\`\`(?:json)?\s*\n?(.*?)\n?\`\`\`', text, re.DOTALL)
if match:
    data = json.loads(match.group(1))
    print(json.dumps(data, ensure_ascii=False))
else:
    # Try to find raw JSON object
    match = re.search(r'(\{.*\})', text, re.DOTALL)
    if match:
        data = json.loads(match.group(1))
        print(json.dumps(data, ensure_ascii=False))
    else:
        print(text)
" 2>/dev/null)

  if [ -n "$EXTRACTED" ]; then
    echo "$EXTRACTED"
  else
    echo "$RESULT"
  fi
fi

echo "" >&2
echo "分析完成！可以將上方 JSON 結果貼入上傳工具的「匯入 JSON」欄位。" >&2
