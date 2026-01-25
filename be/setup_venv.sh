#!/bin/bash

# Script to setup and activate venv with Python 3.11 and install requirements

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if Python 3.11 is available
if ! command -v python3.11 &> /dev/null; then
    echo "Error: Python 3.11 is not found in PATH"
    echo "Please install Python 3.11 or update the script to use the correct path"
    exit 1
fi

# Check if venv exists, if not create it
if [ ! -d "venv" ]; then
    echo "Creating virtual environment with Python 3.11..."
    python3.11 -m venv venv
fi

# Activate the virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Verify we're using Python 3.11
PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}')
echo "Python version in venv: $PYTHON_VERSION"

# Upgrade pip to latest version
echo "Upgrading pip..."
python -m pip install --upgrade pip

# Install requirements
echo "Installing requirements from requirements.txt..."
python -m pip install -r requirements.txt

echo ""
echo "Setup complete! Virtual environment is activated."
echo "To activate it manually in the future, run: source venv/bin/activate"
