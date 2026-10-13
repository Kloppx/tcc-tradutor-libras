@echo off
cd /d "c:\Users\nchvi\Documents\tcc-tradutor-libras"
.\venv\Scripts\python.exe -m uvicorn src.ws_server:app --host 0.0.0.0 --port 8000
