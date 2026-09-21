"""
Convenience script — creates a virtual environment and installs requirements.
Run once before starting the backend:

    python setup.py
"""
import subprocess
import sys
from pathlib import Path

VENV = Path(__file__).parent / "venv"


def main() -> None:
    # Create venv if missing
    if not VENV.exists():
        print("Creating virtual environment …")
        subprocess.check_call([sys.executable, "-m", "venv", str(VENV)])
    else:
        print("Virtual environment already exists, skipping creation.")

    pip = VENV / ("Scripts" if sys.platform == "win32" else "bin") / "pip"
    print("Installing requirements …")
    subprocess.check_call([str(pip), "install", "--upgrade", "pip"])
    subprocess.check_call([str(pip), "install", "-r", "requirements.txt"])
    print("\n✓ All dependencies installed.")
    print("  Activate the environment with:  venv\\Scripts\\activate")
    print("  Then start the server with:     uvicorn app.main:app --reload")


if __name__ == "__main__":
    main()
