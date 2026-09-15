import sys

def main():
    file_path = "/Users/dev/.gemini/antigravity-ide/brain/ff5d6224-fcb5-4b92-99da-02a671a6aeea/walkthrough.md"
    with open(file_path, "r") as f:
        content = f.read()

    new_section = """
## 7. Business Mode Investigation Workflow Enforcement

The Business Mode data workflow was fundamentally rebuilt to revolve strictly around the **CURRENT INVESTIGATION**, ensuring 100% data provenance tracking for every specific email analyzed or case selected.

**Key Architectural Upgrades:**
- **Global Context (`BusinessMode.tsx`):**
  - Implemented an `activeCase` global state that is securely persisted to `localStorage` as `businessActiveCase`. This ensures that after analyzing an email, the context survives across all tabs and browser reloads without silently failing to a demo state.
  - Interfaced this global state into every Business panel component (`BusinessOverview`, `BusinessAnalyze`, `AttackProgression`, `EmployeeRisk`, `BusinessHistory`).
- **Strict Empty States:**
  - If a user opens Business Mode without an active case, they are met with a secure lock-screen: `"NO ACTIVE INVESTIGATION. Upload an .eml file to begin."` No fake placeholder data is injected.
- **Context-Aware Analytics:**
  - **Overview:** Added a distinct `CURRENT INVESTIGATION` header badge displaying the exact subject, case number, and threat score, while preserving the backend-sourced organizational aggregations distinctly below it.
  - **Attack Progression (Current Case Filter):** The progression timeline is now dynamically filtered. It explicitly displays the `CURRENT CASE` as the anchor, and programmatically searches backend relationships to link only legitimately matched events (via shared IOCs or TLSH) labeling them `RELATED HISTORICAL CASE`. If no matching chain exists, it securely falls back to `"No related campaign identified."`
  - **Employee Risk:** Added a `CURRENT TARGET EXPOSURE` banner. It extracts the *actual* target email and department from the newly analyzed .eml trace data, resolving their specific organizational aggregate risk dynamically, strictly separating it from historical department tables.
- **History Binding:**
  - When a user views "Analysis History" and selects an older case, it now securely overwrites the global `activeCase` and redirects back to the main Overview dashboard to pivot the entire Business Mode investigation context around that historical case.

"""
    # Insert new section before "**UI Additions:**"
    target = "**UI Additions:**"
    if target in content:
        content = content.replace(target, new_section + target)
    else:
        content += new_section

    with open(file_path, "w") as f:
        f.write(content)

if __name__ == "__main__":
    main()
