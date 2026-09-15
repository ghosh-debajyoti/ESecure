import os
import subprocess
from setuptools import setup

print("Running top-level build hook for frontend...")
try:
    subprocess.check_call(["npm", "--version"])
    subprocess.check_call(["npm", "install", "--prefix", "frontend"])
    subprocess.check_call(["npm", "run", "build", "--prefix", "frontend"])
    os.system("rm -rf static")
    os.system("cp -R frontend/dist static")
    print("Frontend built and copied to static/ successfully.")
except Exception as e:
    print(f"Failed to build frontend: {e}")

setup(
    name="e_kavach_build_hook",
    version="1.0.0",
    packages=[],
)
