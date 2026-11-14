"""Fresh-session replay skeleton. Defaults to an offline plan; never changes keys or providers."""
import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def normalize(value):
    return " ".join(value.casefold().split())


def check_output(reply, tool_calls, case):
    text = normalize(reply)
    missing = [value for value in case["expected"] if normalize(value) not in text]
    tools = {call["name"] for call in tool_calls}
    tool_ran = case["required_tool"] in tools
    return {"missing": missing, "required_tool_ran": tool_ran,
            "evidence_match": not missing and tool_ran}


def load_cases(filename):
    cases = json.loads(Path(filename).read_text(encoding="utf-8-sig"))
    for case in cases:
        if not case["expected"] or not case["prompt"].strip():
            raise ValueError("Each case needs a prompt and expected values")
        if any(normalize(value) in normalize(case["prompt"]) for value in case["expected"]):
            raise ValueError("Expected values must not already appear in the prompt")
    return cases


def logged_response(log, conversation_id):
    for line in reversed(Path(log).read_text(encoding="utf-8").splitlines()):
        record = json.loads(line)
        if record["request"]["conversation_id"] == conversation_id:
            return record["response"]
    raise RuntimeError("No response log found for this conversation")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", action="append", required=True, help="Exact model ID; repeat for more models")
    parser.add_argument("--cases", type=Path, default=ROOT / "reproduce-cases.json")
    parser.add_argument("--repeat", type=int, choices=(2, 3), default=3)
    parser.add_argument("--live", action="store_true", help="Send the plan using the existing configured key")
    parser.add_argument("--delay", type=float, default=65, help="Seconds between requests, including failures")
    args = parser.parse_args()
    if args.delay < 0:
        parser.error("--delay must be nonnegative")
    cases = load_cases(args.cases)
    planned = len(args.model) * len(cases) * args.repeat
    if not args.live:
        print(json.dumps({"mode": "offline plan", "models": args.model,
                          "cases": [case["id"] for case in cases], "repeats": args.repeat,
                          "planned_requests": planned, "requests_sent": 0}, indent=2))
        return

    # Import only after --live. btm retains its normal raw response logging.
    import btm
    available = {model for model, _tier in btm.list_models()}
    if not set(args.model).issubset(available):
        parser.error("A selected model is unavailable for the existing key; no provider fallback")
    destination = ROOT / "logs" / "reproductions" / (datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S") + ".jsonl")
    destination.parent.mkdir(parents=True, exist_ok=True)
    # Keep new raw calls separate from the committed evidence snapshot.
    btm.LOG = destination.with_suffix(".raw.jsonl")
    counts = {}
    completed = 0
    for model in args.model:
        for case in cases:
            summary = {"matched": 0, "completed": 0, "errors": 0, "planned": args.repeat}
            for trial in range(1, args.repeat + 1):
                conversation = btm.new_conversation()  # Exactly what /new does in chat.py.
                result = {"timestamp": datetime.now(timezone.utc).isoformat(),
                          "configured_key_provider": btm.PROVIDER,
                          "team_routing_enabled": bool(btm.TEAM), "model": model, "case": case["id"],
                          "trial": trial, "conversation_id": conversation,
                          "prompt": case["prompt"], "expected": case["expected"]}
                try:
                    reply = btm.chat(case["prompt"], model=model, conversation_id=conversation)
                    response = logged_response(btm.LOG, conversation)
                    calls = response.get("tool_calls") or []
                    result.update(check_output(reply, calls, case))
                    result.update({"turn_id": response["turn_id"], "reply": reply, "tool_calls": calls})
                    summary["matched"] += int(result["evidence_match"])
                    summary["completed"] += 1
                except Exception as error:
                    result["error"] = str(error)
                    summary["errors"] += 1
                with destination.open("a", encoding="utf-8") as stream:
                    stream.write(json.dumps(result, ensure_ascii=False) + "\n")
                completed += 1
                if completed < planned:
                    time.sleep(args.delay)
            counts[f"{model} / {case['id']}"] = summary
    print(json.dumps({"results": counts, "log": str(destination)}, indent=2))


if __name__ == "__main__":
    main()
