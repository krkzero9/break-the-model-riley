"""Index preserved evidence without sending model requests or merging test rounds."""
import hashlib
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def relative(path):
    return path.relative_to(ROOT).as_posix()

snapshot = json.loads((ROOT / "logs/import-provenance.json").read_text(encoding="utf-8"))
trace_index = {}
sessions = []
for name in ["logs/my_attempts.jsonl", "logs/my_attempts_session2.jsonl", "logs/sparsh-2026-11-14/my_attempts.jsonl"]:
    path = ROOT / name
    rows = [json.loads(line) for line in path.read_text(encoding="utf-8-sig").splitlines() if line.strip()]
    ids = set()
    for line, row in enumerate(rows, 1):
        request, response = row.get("request", {}), row.get("response", {})
        turn = response.get("turn_id")
        if not turn:
            continue
        ids.add(turn)
        trace_index.setdefault(turn, []).append({"path": name, "line": line, "model": request.get("model"),
            "conversation_id": request.get("conversation_id"), "timestamp_as_recorded": row.get("ts"),
            "tool_names": [call.get("name") for call in response.get("tool_calls") or []]})
    sessions.append({"path": name, "records": len(rows), "unique_turn_ids": len(ids), "sha256": digest(path),
                     "models": dict(Counter(row.get("request", {}).get("model", "unknown") for row in rows))})

script = "const fs=require('fs'),vm=require('vm');const c={window:{}};vm.runInNewContext(fs.readFileSync('presentation/presentation-data.js','utf8'),c);console.log(JSON.stringify({registry:c.window.PRESENTATION_DATA.registry,reports:c.window.PRESENTATION_DATA.teammateReports}));"
data = json.loads(subprocess.check_output(["node", "-e", script], cwd=ROOT, text=True, encoding="utf-8"))
references = {}
for tier, turn, table, finding in data["registry"]:
    references[turn] = {"turn_id": turn, "earlier_registry": {"cohort": tier, "table": table, "finding": finding}}
for record in data["reports"]["records"]:
    reference = references.setdefault(record["turn"], {"turn_id": record["turn"]})
    reference["teammate_report"] = {"status_as_reviewed": record["status"], "cohort": record["cohort"], "sources": record["sources"]}
incoming_ids = set()
for name in ["LEAK_REPORT.md", "ganesh-very-large-model-leak-report.md", "umair-very-large-model-leak_report.md", "logs/teammate-sessions/2026-11-14-incoming/FINDINGS-original.md"]:
    for line,text in enumerate((ROOT/name).read_text(encoding="utf-8").splitlines(),1):
        for turn in set(re.findall(r"\b[0-9a-f]{32}\b",text)):
            incoming_ids.add(turn)
            reference = references.setdefault(turn, {"turn_id": turn})
            reference.setdefault("incoming_report_locations", []).append({"path": name, "line": line})
for turn, reference in references.items():
    reference["raw_trace_locations"] = trace_index.get(turn, [])

files = []
for name in ["README.md", "FINAL_SUBMISSION.md", ".gitignore", ".gitattributes", "AGENTS.md", "FINDINGS.md", "LEAK_REPORT.md", "PROMPTS.md", "attack.py", "probe.py", "secret_probe.py", "ganesh-very-large-model-leak-report.md", "umair-very-large-model-leak_report.md", "btm.py", "chat.py", "setup.py", "example_attack.py", "requirements.txt", "presentation.html", "financial_prompts.txt", "reproduce.py", "reproduce-cases.json"]:
    files.append(ROOT / name)
for directory in ["presentation", "database", "tests", "tools", "logs"]:
    files.extend(path for path in (ROOT / directory).rglob("*") if path.is_file() and path.suffix in {".js", ".html", ".css", ".json", ".jsonl", ".txt", ".md", ".pdf", ".jpeg", ".py"} and "reproductions" not in path.parts and "__pycache__" not in path.parts and path.name != "evidence-index.json")

index = {
    "submission_repository": snapshot["submission_repo"], "base_commit": snapshot["base_commit"], "incoming_commit": snapshot["incoming_commit"],
    "purpose": "Source inventory and trace lookup; matching a turn ID does not classify an attack outcome.",
    "limits": [
        "The database export reconstructs reported schemas and fictional reply samples; it is not a backend SQLite copy.",
        "The presentation shows combined inventory counts; its earlier 45-ID registry remains distinct. Ten later Sparsh records have not been individually reviewed.",
        "Existing success-rate files are participant summaries. Guard/version attribution and trial selection have not been independently audited here.",
        "Raw trace matches are indexed without reclassifying earlier reports. Tool invocation is not confirmed external delivery."
    ],
    "sessions": sessions,
    "reference_counts": {"earlier_registry": len(data["registry"]), "teammate_references": len(data["reports"]["records"]), "incoming_report_references": len(incoming_ids), "unique_combined": len(references), "with_raw_trace": sum(bool(record["raw_trace_locations"]) for record in references.values())},
    "references": list(references.values()),
    "files": [{"path": relative(path), "bytes": path.stat().st_size, "sha256": digest(path), "lf_sha256": hashlib.sha256(path.read_bytes().replace(b"\r\n", b"\n")).hexdigest()} for path in sorted(set(files))],
    "hash_note": "sha256 records exact source bytes. lf_sha256 also permits checking existing Git text files after platform line-ending conversion; imported raw evidence has -text attributes."
}
(ROOT / "logs/evidence-index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"sessions": [{key: item[key] for key in ["path", "records", "unique_turn_ids"]} for item in sessions], "reference_counts": index["reference_counts"], "indexed_files": len(index["files"])}))
