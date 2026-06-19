# Use uma imagem Python oficial como base
FROM python:3.10-slim-bookworm

# Instala a dependência de sistema (libgl1) que falta para o OpenCV
RUN apt-get update && apt-get install -y libgl1-mesa-glx libglib2.0-0 libsm6 libxext6 libxrender1

# Defina o diretório de trabalho dentro do container
WORKDIR /app

# Copie o arquivo de dependências
COPY requirements.txt .

# Instale as dependências
RUN pip install --no-cache-dir -r requirements.txt

# Copie o código-fonte para dentro do container
COPY src/ /app/src/

# Copie a pasta de modelos para dentro do container
# COPY models/ /app/models/

# Exponha a porta do WebSocket/API
EXPOSE 8000

# Defina o comando padrão para rodar o servidor uvicorn
# CMD ["uvicorn", "src.ws_server:app", "--host", "0.0.0.0", "--port", "8000"]