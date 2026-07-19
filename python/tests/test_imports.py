"""Verify all Python WRIVON modules import correctly."""

import pytest


def test_version():
    from wrivon import __version__
    assert __version__ == "0.2.0"


def test_shared_config():
    from wrivon.shared import load_shared_config, get_commands, get_chat_modes, get_provider_order, get_tools, get_defaults

    config = load_shared_config()
    assert config is not None
    assert config["version"] == 1
    assert "nvidia" in config["providers"]
    assert "cloudflare" in config["providers"]
    assert "groq" in config["providers"]
    assert len(config["provider_fallback_order"]) == 3
    assert config["provider_fallback_order"] == ["nvidia", "cloudflare", "groq"]

    commands = get_commands()
    assert "/help" in commands
    assert "/build" in commands
    assert "/exit" in commands

    modes = get_chat_modes()
    assert "code" in modes
    assert "ask" in modes
    assert "plan" in modes
    assert modes["code"]["sandbox"] == "workspace-write"
    assert modes["ask"]["sandbox"] == "read-only"

    tools = get_tools()
    for name in ["read", "write", "edit", "bash", "glob", "grep", "web_fetch", "web_search"]:
        assert name in tools, f"Missing tool: {name}"

    order = get_provider_order()
    assert order == ["nvidia", "cloudflare", "groq"]

    defaults = get_defaults()
    assert "sandbox" in defaults
    assert defaults["sandbox"]["filesystem"] == "workspace-write"


def test_config():
    from wrivon.config import load_config, validate_config, DEFAULT_CONFIG, expand_env

    cfg = load_config()
    assert cfg["provider"] == "nvidia"
    assert cfg["model"] == "deepseek-ai/deepseek-v4-flash"
    assert "nvidia" in cfg["providers"]
    assert "cloudflare" in cfg["providers"]
    assert "groq" in cfg["providers"]

    nv = cfg["providers"]["nvidia"]
    assert nv["kind"] == "openai"
    assert "nvidia.com" in nv["baseUrl"]
    assert nv["fastModel"] == "deepseek-ai/deepseek-v4-flash"
    assert "mistral" in nv["powerfulModel"]

    cf = cfg["providers"]["cloudflare"]
    assert cf["kind"] == "cloudflare"
    assert "cloudflare.com" in cf["baseUrl"]

    warnings, errors = validate_config(cfg)
    assert len(errors) == 0
    # API key warnings are expected since no .env.local in CI

    assert expand_env("hello") == "hello"
    assert expand_env("env:NONEXISTENT_VAR") == ""


def test_provider_chain():
    from wrivon.provider import ProviderChain
    from wrivon.config import load_config

    cfg = load_config()
    chain = ProviderChain(cfg)
    assert chain.primary == "nvidia"
    # In CI there may be no API keys, but the chain should still build


def test_session():
    from wrivon.session import open_session, list_sessions, generate_id

    sess = open_session(meta={"provider": "test", "model": "test-model", "cwd": "/tmp"})
    assert sess["id"] is not None
    assert sess["path"] is not None

    sessions = list_sessions()
    assert isinstance(sessions, list)

    assert len(generate_id()) > 4


def test_llm_client():
    from wrivon.llm import LLMClient

    client = LLMClient(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key="test-key",
        model="test-model",
        kind="openai",
    )
    assert client.model == "test-model"
    assert "nvidia.com" in client._endpoint

    # cloudflare endpoint format
    cf_client = LLMClient(
        base_url="https://api.cloudflare.com/client/v4/accounts",
        api_key="test-key",
        model="@cf/meta/llama-3.3-70b-instruct-fp8-fast",
        kind="cloudflare",
        account_id="test-account",
    )
    assert "test-account" in cf_client._endpoint
    assert "chat/completions" in cf_client._endpoint


def test_tools():
    from wrivon.tools import TOOL_MAP, AVAILABLE_TOOLS, execute_tool

    assert len(TOOL_MAP) == 8
    assert len(AVAILABLE_TOOLS) == 8
    for name in ["read", "write", "edit", "bash", "glob", "grep", "web_fetch", "web_search"]:
        assert name in TOOL_MAP
        assert name in {t["name"] for t in AVAILABLE_TOOLS.values()}

    # Dispatch to unknown tool
    result = execute_tool("nonexistent", {})
    assert "Error" in result

    # Sandbox restriction
    result = execute_tool("write", {"filePath": "/tmp/test", "content": "test"}, sandbox="read-only")
    assert "disabled" in result


def test_tool_implementations():
    from wrivon.tools.editor import read_file, write_file, edit_file
    from wrivon.tools.shell import run_bash
    from wrivon.tools.search import glob_files, grep_files
    import tempfile
    import os

    result = read_file("__WRIVON_TEST_NONEXISTENT_FILE__.txt")
    assert "Error" in result

    result = glob_files("*.py", path=".")
    assert isinstance(result, str)

    # Use a temp dir so we don't match test source code
    tmpdir = tempfile.mkdtemp()
    try:
        result = grep_files(r"ZX__ZZ_NONEXISTENT_PATTERN_ZZ__ZX", path=tmpdir)
        assert "No matches" in result
    finally:
        import shutil
        shutil.rmtree(tmpdir, ignore_errors=True)
    tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False)
    tmp_path = tmp.name
    tmp.close()

    try:
        result = write_file(tmp_path, "hello world\nline two\n")
        assert "written" in result

        result = read_file(tmp_path)
        assert "hello world" in result
        assert "line two" in result

        result = edit_file(tmp_path, "hello world", "HELLO WORLD")
        assert "edited" in result

        result = read_file(tmp_path)
        assert "HELLO WORLD" in result

        # edit with nonexistent oldString
        result = edit_file(tmp_path, "nonexistent", "anything")
        assert "not found" in result

        # edit with multiple matches (create duplicates)
        write_file(tmp_path, "duplicate\nduplicate\n")
        result = edit_file(tmp_path, "duplicate", "replaced")
        assert "Found 2 matches" in result

    finally:
        os.unlink(tmp_path)


def test_build_mode():
    from wrivon.agent.build import get_build_label, extract_plan

    label = get_build_label()
    assert label["name"] == "build"
    assert len(label["instruction"]) > 500

    plan = extract_plan('```json\n{"appName": "test", "files": []}\n```')
    assert plan is not None
    assert plan["appName"] == "test"

    plan = extract_plan('some text without json')
    assert plan is None
