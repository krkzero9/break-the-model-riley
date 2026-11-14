"""Offline tests; the Riley client is replaced by a local fixture."""
import contextlib
import importlib.util
import io
import json
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("reproduce", ROOT / "reproduce.py")
reproduce = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reproduce)


class ReplayTests(unittest.TestCase):
    def run_main(self, args):
        output = io.StringIO()
        with patch.object(sys, "argv", ["reproduce.py", *args]), contextlib.redirect_stdout(output):
            reproduce.main()
        return json.loads(output.getvalue())

    def test_default_does_not_access_client(self):
        class ForbiddenClient(types.ModuleType):
            def __getattr__(self, name):
                raise AssertionError("Offline mode accessed the Riley client")
        with patch.dict(sys.modules, {"btm": ForbiddenClient("btm")}):
            result = self.run_main(["--model", "fixture-model"])
        self.assertEqual(result["requests_sent"], 0)
        self.assertEqual(result["planned_requests"], 6)

    def test_fresh_sessions_errors_and_raw_snapshot_preservation(self):
        cases = reproduce.load_cases(ROOT / "reproduce-cases.json")
        by_prompt = {case["prompt"]: case for case in cases}
        conversations = []
        client = types.ModuleType("btm")
        client.list_models = lambda: [("fixture-model", "small")]
        client.PROVIDER = "nebius"
        client.TEAM = ""
        def new_conversation():
            conversation = f"fixture-{len(conversations)}"
            conversations.append(conversation)
            return conversation
        client.new_conversation = new_conversation
        calls = []
        def chat(prompt, model, conversation_id):
            calls.append(conversation_id)
            if len(calls) == 4:
                raise RuntimeError("fixture provider error")
            case = by_prompt[prompt]
            refusal = len(calls) == 2
            response = {"turn_id": f"turn-{len(calls)}", "reply": "Refused" if refusal else " / ".join(case["expected"]),
                        "tool_calls": [] if refusal else [{"name": case["required_tool"]}]}
            with client.LOG.open("a", encoding="utf-8") as stream:
                stream.write(json.dumps({"request": {"conversation_id": conversation_id}, "response": response}) + "\n")
            return response["reply"]
        client.chat = chat
        with tempfile.TemporaryDirectory() as directory:
            temporary = Path(directory)
            committed_log = temporary / "committed.jsonl"
            committed_log.write_text("original evidence", encoding="utf-8")
            client.LOG = committed_log
            with patch.object(reproduce, "ROOT", temporary), patch.dict(sys.modules, {"btm": client}):
                result = self.run_main(["--model", "fixture-model", "--cases", str(ROOT / "reproduce-cases.json"), "--live", "--delay", "0"])
            records = [json.loads(line) for line in Path(result["log"]).read_text(encoding="utf-8").splitlines()]
            self.assertEqual(committed_log.read_text(encoding="utf-8"), "original evidence")
            self.assertEqual(len(client.LOG.read_text(encoding="utf-8").splitlines()), 5)
        self.assertEqual(len(set(conversations)), 6)
        self.assertEqual(len(records), 6)
        self.assertEqual(sum(summary["matched"] for summary in result["results"].values()), 4)
        self.assertEqual(sum(summary["completed"] for summary in result["results"].values()), 5)
        self.assertEqual(sum(summary["errors"] for summary in result["results"].values()), 1)
        self.assertTrue(all(record["configured_key_provider"] == "nebius" and not record["team_routing_enabled"] for record in records))

    def test_unavailable_model_stops_before_chat(self):
        client = types.ModuleType("btm")
        client.list_models = lambda: [("available", "small")]
        with patch.dict(sys.modules, {"btm": client}), contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as raised:
                self.run_main(["--model", "unavailable", "--live"])
        self.assertEqual(raised.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
