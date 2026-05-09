#!/bin/bash
git add .
git commit -m "Automated backup: $(date)"
git push origin main
