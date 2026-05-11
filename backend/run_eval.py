# ══════════════════════════════════════════════════════
# HOW TO RUN run_eval.py  (fully automated)
# ══════════════════════════════════════════════════════
# Only ONE manual step required — start the backend:
#
#   Terminal 1:
#   cd backend
#   .\venv\Scripts\activate
#   uvicorn main:app --reload --host 0.0.0.0 --port 8000
#
#   Terminal 2 (once backend shows "ready"):
#   cd backend
#   .\venv\Scripts\activate
#   python run_eval.py
#
# The script will automatically:
#   ✅ Find the PDF in real_demo_medical_pdfs/
#   ✅ Upload it to the backend
#   ✅ Wait for indexing
#   ✅ Run all 15 evaluation questions
#   ✅ Print the full accuracy report
#
# Total time: ~35-50 seconds
# ══════════════════════════════════════════════════════

import os
import sys
import time
import httpx

# Ensure UTF-8 output on Windows (handles ✅ ❌ ✓ characters)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://localhost:8000"

# ──────────────────────────────────────────────────────
# PDF PATH RESOLUTION
# ──────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

PDF_FILENAME = "PDF_Deid_Deidentification_0.pdf"

SEARCH_PATHS = [
    os.path.join(PROJECT_ROOT, "real_demo_medical_pdfs", PDF_FILENAME),
    os.path.join(PROJECT_ROOT, PDF_FILENAME),
    os.path.join(SCRIPT_DIR, PDF_FILENAME),
    os.path.join(SCRIPT_DIR, "..", "real_demo_medical_pdfs", PDF_FILENAME),
]

pdf_path = None
for path in SEARCH_PATHS:
    if os.path.exists(path):
        pdf_path = os.path.abspath(path)
        break

if pdf_path is None:
    print("[ERROR] Could not find PDF_Deid_Deidentification_0.pdf")
    print("        Searched in:")
    for p in SEARCH_PATHS:
        print(f"          {p}")
    sys.exit(1)

print(f"[✓] Found PDF at: {pdf_path}")


# ──────────────────────────────────────────────────────
# BENCHMARK DATASET
# Patient: Kimberly Lawrence | DOB: 24/05/1977 | Female
# Hospital: Sierra Valley Medical Institute INC
# Doctor: Cheryl Blankenship (DR14144B)
# Diagnosis: Type 2 Diabetes Mellitus + Peripheral Neuropathy
# ──────────────────────────────────────────────────────
BENCHMARK = [
    {
        "question": "What is the patient's full name?",
        "expected_answer": "Kimberly Lawrence",
        "expected_chunk_keywords": ["kimberly", "lawrence", "patient"]
    },
    {
        "question": "What is the patient's primary medical diagnosis?",
        "expected_answer": "Diabetes",
        "expected_chunk_keywords": ["diabetes", "type 2", "diagnosis"]
    },
    {
        "question": "What secondary condition does the patient have?",
        "expected_answer": "Peripheral Neuropathy",
        "expected_chunk_keywords": ["neuropathy", "peripheral", "diabetes"]
    },
    {
        "question": "What medication is prescribed for the patient's diabetes?",
        "expected_answer": "Metformin",
        "expected_chunk_keywords": ["metformin", "500", "diabetes"]
    },
    {
        "question": "What is the Metformin dosage prescribed?",
        "expected_answer": "500",
        "expected_chunk_keywords": ["metformin", "500", "mg"]
    },
    {
        "question": "What medication is prescribed for neuropathy symptoms?",
        "expected_answer": "Gabapentin",
        "expected_chunk_keywords": ["gabapentin", "300", "neuropathy"]
    },
    {
        "question": "What medication is prescribed for cholesterol management?",
        "expected_answer": "Atorvastatin",
        "expected_chunk_keywords": ["atorvastatin", "20mg", "cholesterol"]
    },
    {
        "question": "What is the name of the treating doctor?",
        "expected_answer": "Blankenship",
        "expected_chunk_keywords": ["blankenship", "cheryl", "doctor"]
    },
    {
        "question": "What is the name of the hospital?",
        "expected_answer": "Sierra Valley",
        "expected_chunk_keywords": ["sierra", "valley", "medical", "institute"]
    },
    {
        "question": "What symptom does the patient report in the feet?",
        "expected_answer": "tingling",
        "expected_chunk_keywords": ["tingling", "feet", "neuropathy"]
    },
    {
        "question": "What is the Gabapentin dosage prescribed?",
        "expected_answer": "300",
        "expected_chunk_keywords": ["gabapentin", "300", "neuropathy"]
    },
    {
        "question": "What type of Diabetes is the patient diagnosed with?",
        "expected_answer": "Type 2",
        "expected_chunk_keywords": ["type 2", "diabetes", "diagnosis"]
    },
    {
        "question": "What is the patient's last name?",
        "expected_answer": "Lawrence",
        "expected_chunk_keywords": ["lawrence", "kimberly", "patient"]
    },
    {
        "question": "What is the combined total daily dosage in mg of all medications prescribed?",
        "expected_answer": "820",
        "expected_chunk_keywords": ["metformin", "gabapentin", "atorvastatin"]
    },
    {
        "question": "What is the patient's date of birth in Day Month Year format?",
        "expected_answer": "24th May 1977",
        "expected_chunk_keywords": ["1977", "dob", "born"]
    }
]


# ──────────────────────────────────────────────────────
# HELPER FUNCTIONS
# ──────────────────────────────────────────────────────

def lcs_length(a, b):
    a_tokens = a.lower().split()
    b_tokens = b.lower().split()
    m, n = len(a_tokens), len(b_tokens)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a_tokens[i-1] == b_tokens[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    return dp[m][n]


def rouge_l(hypothesis, reference):
    lcs = lcs_length(hypothesis, reference)
    ref_len = len(reference.lower().split())
    hyp_len = len(hypothesis.lower().split())
    if ref_len == 0 or hyp_len == 0:
        return 0.0
    precision = lcs / hyp_len
    recall = lcs / ref_len
    if precision + recall == 0:
        return 0.0
    return round(2 * precision * recall / (precision + recall), 4)


def normalize_score(score, level):
    if level == "High":
        return int(70 + (min(score, 0.55) - 0.40) / 0.15 * 30)
    elif level == "Medium":
        return int(40 + (min(score, 0.40) - 0.22) / 0.18 * 30)
    else:
        return int((min(score, 0.22) / 0.22) * 40)


# ──────────────────────────────────────────────────────
# STEP 1 — HEALTH CHECK
# ──────────────────────────────────────────────────────
def check_backend():
    try:
        r = httpx.get(f"{BASE_URL}/health", timeout=5)
        if r.status_code != 200:
            print(f"[ERROR] Backend returned HTTP {r.status_code}")
            print("        Start it first:")
            print("        cd backend")
            print("        .\\venv\\Scripts\\activate")
            print("        uvicorn main:app --reload --host 0.0.0.0 --port 8000")
            sys.exit(1)
    except Exception:
        print("[ERROR] Backend is not running.")
        print("        Start it first:")
        print("        cd backend")
        print("        .\\venv\\Scripts\\activate")
        print("        uvicorn main:app --reload --host 0.0.0.0 --port 8000")
        sys.exit(1)
    print("[✓] Backend is online")


# ──────────────────────────────────────────────────────
# STEP 2 — AUTO UPLOAD PDF
# ──────────────────────────────────────────────────────
def upload_pdf():
    print(f"[→] Uploading {PDF_FILENAME} ...")
    try:
        with open(pdf_path, "rb") as f:
            response = httpx.post(
                f"{BASE_URL}/upload",
                files={"file": (PDF_FILENAME, f, "application/pdf")},
                timeout=120.0
            )
    except Exception as e:
        print(f"[ERROR] Upload request failed: {e}")
        sys.exit(1)

    if response.status_code != 200:
        print(f"[ERROR] Upload failed: HTTP {response.status_code}")
        print(f"        Response: {response.text[:300]}")
        sys.exit(1)

    data = response.json()
    print(f"[✓] Upload successful")
    print(f"    Pages   : {data.get('page_count', '?')}")
    print(f"    Chunks  : {data.get('chunk_count', '?')}")
    print(f"    OCR used: {data.get('used_ocr', False)}")

    print("[→] Waiting 2s for index to settle...")
    time.sleep(2)


# ──────────────────────────────────────────────────────
# STEP 3 — RUN EVALUATION
# ──────────────────────────────────────────────────────
def run_evaluation():
    total = len(BENCHMARK)
    sep = "=" * 60

    print(f"\n{sep}")
    print("  STARTING EVALUATION — 15 questions")
    print("  1.5s delay between calls to respect rate limits")
    print(f"{sep}\n")

    results = []

    for idx, item in enumerate(BENCHMARK):
        q_num = idx + 1
        question = item["question"]
        expected = item["expected_answer"]
        keywords = item["expected_chunk_keywords"]

        print(f"[ Q{q_num:02d} ] {question}")

        retrieval_correct = False
        answer_correct = False
        not_hallucinated = False
        conf_level = "Low"
        conf_score = 0.0
        rl_score = 0.0
        answer_text = ""
        calibration = "N/A"
        error_flag = False

        try:
            resp = httpx.post(
                f"{BASE_URL}/chat",
                json={"question": question},
                timeout=120
            )

            if resp.status_code != 200:
                print(f"  [ERROR] Q{q_num:02d} — HTTP {resp.status_code}")
                error_flag = True
            else:
                data = resp.json()

                if "answer" not in data:
                    print(f"  [ERROR] Q{q_num:02d} — 'answer' key missing in response")
                    error_flag = True
                else:
                    answer_text = data.get("answer", "")
                    conf_level = data.get("confidence", {}).get("level", "Low")
                    conf_score = data.get("confidence", {}).get("score", 0.0)
                    sources = data.get("sources", [])

                    # Metric 1: Retrieval Recall@5
                    combined_source_text = " ".join(
                        s.get("text", "").lower() for s in sources
                    )
                    retrieval_correct = any(
                        kw.lower() in combined_source_text for kw in keywords
                    )

                    # Metric 2: Grounded QA Accuracy
                    answer_correct = expected.lower() in answer_text.lower()

                    # Metric 3: Hallucination absent
                    not_hallucinated = (
                        "Insufficient medical evidence" not in answer_text
                        and answer_text.strip() != ""
                        and len(answer_text.strip()) > 20
                    )

                    # Metric 4: Confidence calibration
                    if answer_correct:
                        calibration = "OK" if conf_level in ("High", "Medium") else "FAIL"
                    else:
                        calibration = "N/A"

                    # ROUGE-L
                    rl_score = rouge_l(answer_text, expected)

        except Exception as e:
            print(f"  [ERROR] Q{q_num:02d} — Exception: {e}")
            error_flag = True

        if error_flag:
            results.append({
                "retrieval": False,
                "answer": False,
                "no_hallucination": False,
                "calibration": "N/A",
                "rouge_l": 0.0,
                "answer_correct": False,
            })
            print(f"  {'─' * 56}")
            if idx < total - 1:
                print("[...] Waiting 1.5s\n")
                time.sleep(1.5)
            continue

        # Per-question output
        r_icon = "✅ PASS" if retrieval_correct else "❌ FAIL"
        a_icon = "✅ PASS" if answer_correct else "❌ FAIL"
        h_icon = "✅ CLEAN" if not_hallucinated else "❌ HALLUCINATED"

        if calibration == "OK":
            cal_icon = "✅ OK"
        elif calibration == "FAIL":
            cal_icon = "❌ FAIL"
        else:
            cal_icon = "N/A"

        norm_pct = normalize_score(conf_score, conf_level)
        success = retrieval_correct and answer_correct and not_hallucinated
        result_icon = "✅ END-TO-END SUCCESS" if success else "❌ END-TO-END FAIL"

        print(f"  Expected   : {expected}")
        print(f"  Generated  : {answer_text[:120]}")
        print(f"  Retrieval  : {r_icon}   QA: {a_icon}   Hallucination: {h_icon}")
        print(f"  Confidence : {conf_level} ({norm_pct}%)  Calibration: {cal_icon}")
        print(f"  ROUGE-L    : {rl_score:.4f}")
        print(f"  Raw Score  : {conf_score:.4f}")
        print(f"  Result     : {result_icon}")
        print(f"  {'─' * 56}")

        results.append({
            "retrieval": retrieval_correct,
            "answer": answer_correct,
            "no_hallucination": not_hallucinated,
            "calibration": calibration,
            "rouge_l": rl_score,
            "answer_correct": answer_correct,
        })

        if idx < total - 1:
            print("[...] Waiting 1.5s\n")
            time.sleep(1.5)

    # ── Final Summary Report ──────────────────────────
    n_retrieval    = sum(1 for r in results if r["retrieval"])
    n_answer       = sum(1 for r in results if r["answer"])
    n_hallucinated = sum(1 for r in results if not r["no_hallucination"])
    n_success      = sum(
        1 for r in results
        if r["retrieval"] and r["answer"] and r["no_hallucination"]
    )
    avg_rouge = sum(r["rouge_l"] for r in results) / total if total > 0 else 0.0

    correct_answers  = [r for r in results if r["answer_correct"]]
    n_cal_correct    = sum(1 for r in correct_answers if r["calibration"] == "OK")
    n_cal_total      = len(correct_answers)
    cal_pct          = (n_cal_correct / n_cal_total * 100) if n_cal_total > 0 else 0.0

    print(f"\n{sep}")
    print("  MEDICAL AI ASSISTANT — EVALUATION REPORT")
    print("  Model  : Groq llama-3.3-70b-versatile + Voyage voyage-3")
    print(f"  PDF    : {PDF_FILENAME}")
    print(f"  Total  : {total} questions")
    print(f"{sep}\n")
    print(f"  Retrieval Recall@5          :  {n_retrieval/total*100:5.1f}%   ( {n_retrieval} / {total} )")
    print(f"  Grounded QA Accuracy        :  {n_answer/total*100:5.1f}%   ( {n_answer} / {total} )")
    print(f"  Hallucination Rate          :  {n_hallucinated/total*100:5.1f}%   ( {n_hallucinated} / {total} hallucinated )")
    print(f"  Confidence Calibration      :  {cal_pct:5.1f}%   ( {n_cal_correct} / {n_cal_total} correct answers )")
    print(f"  Avg ROUGE-L Score           :  {avg_rouge:.4f}")
    print(f"  {'─' * 57}")
    print(f"  Overall End-to-End Accuracy :  {n_success/total*100:5.1f}%   ( {n_success} / {total} fully correct )")
    print()
    print("  Confidence Threshold Used   :  High >= 0.40  |  Medium >= 0.22")
    print("  Hallucination Guard Active  :  YES (rerank_score < 0.10 blocked)")
    print(f"{sep}\n")


# ──────────────────────────────────────────────────────
# ENTRY POINT
# ──────────────────────────────────────────────────────
if __name__ == "__main__":
    check_backend()   # Step 1: verify backend is live
    upload_pdf()      # Step 2: upload PDF + wait for index
    run_evaluation()  # Step 3: run all 15 questions + print report
