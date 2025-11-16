import os
import io
import pandas as pd
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload

# --- Configurações ---

# Se você modificar esses escopos, delete o 'token.json'.
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

# Caminhos DENTRO do container Docker
CREDENTIALS_PATH = '/app/credentials/credentials.json'
TOKEN_PATH = '/app/credentials/token.json'
SAVE_DIR = '/app/data/raw_videos'
MAP_FILE_PATH = '/app/data/processed/dataset_map.csv'

# !! IMPORTANTE: PEGUE ISSO DA URL DO GOOGLE DRIVE !!
# Ex: .../drive/folders/[ESSE_ID_LONGO_AQUI]
FOLDER_ID = '1OoLotuNgrFRFk0Kr0Qz9fF-kl1C24bXD'

# ---------------------


def authenticate():
    """Autentica o usuário e retorna um objeto de 'credentials'."""
    creds = None
    
    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Atualizando token de acesso...")
            creds.refresh(Request())
        else:
            print("Iniciando fluxo de autenticação...")
            
            # --- MUDANÇA AQUI ---
            PORT = 56677
            # Definimos o URI que o Google AGORA ACEITA (da Parte 1)
            REDIRECT_URI = f'http://localhost:{PORT}/'
            
            flow = InstalledAppFlow.from_client_secrets_file(
                CREDENTIALS_PATH, 
                SCOPES,
                redirect_uri=REDIRECT_URI) # Informa ao flow o URI correto
            
            # Ainda escutamos em 0.0.0.0 para o Docker funcionar
            creds = flow.run_local_server( port=PORT, open_browser=False)
            # --- FIM DA MUDANÇA ---
            
        with open(TOKEN_PATH, 'w') as token:
            token.write(creds.to_json())
            print(f"Token salvo em: {TOKEN_PATH}")

    return creds


def download_file(service, file_id, file_name, local_path):
    """Baixa um único arquivo do Drive."""
    try:
        request = service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        
        done = False
        while done is False:
            status, done = downloader.next_chunk()
            print(f" > Download {file_name}: {int(status.progress() * 100)}%.")
            
        # Salva o arquivo no disco
        fh.seek(0)
        with open(local_path, 'wb') as f:
            f.write(fh.read())
            
    except HttpError as error:
        print(f"Um erro ocorreu ao baixar {file_name}: {error}")


def main():
    """Script principal para baixar vídeos e criar o mapa do dataset."""
    print("Iniciando Fase 1: Aquisição de Dados")
    creds = authenticate()
    
    if not creds:
        print("Falha na autenticação. Abortando.")
        return

    try:
        service = build('drive', 'v3', credentials=creds)
        
        # Garante que os diretórios de salvamento existem
        os.makedirs(SAVE_DIR, exist_ok=True)
        os.makedirs(os.path.dirname(MAP_FILE_PATH), exist_ok=True)

        video_map = [] # Lista para [caminho_local, rotulo]
        
        # Lista os arquivos na pasta especificada
        query = f"'{FOLDER_ID}' in parents and trashed = false"
        results = service.files().list(
            q=query,
            pageSize=1000, # Limite de arquivos
            fields="nextPageToken, files(id, name)"
        ).execute()
        
        items = results.get('files', [])

        if not items:
            print("Nenhum arquivo encontrado na pasta do Drive.")
            return

        print(f"Encontrados {len(items)} arquivos. Iniciando download...")

        for item in items:
            file_id = item['id']
            file_name = item['name']
            
            # O nome do arquivo (ex: "Obrigado.mp4") é o rótulo
            label = os.path.splitext(file_name)[0]
            local_path = os.path.join(SAVE_DIR, file_name)
            
            # Adiciona ao mapa
            # Usamos o caminho *dentro* do container
            map_entry = {'video_path': local_path, 'label': label}
            video_map.append(map_entry)
            
            # Só baixa se ainda não tivermos
            if not os.path.exists(local_path):
                print(f"Baixando: {file_name} (Rótulo: {label})")
                download_file(service, file_id, file_name, local_path)
            else:
                print(f"Já existe: {file_name}. Pulando download.")

        # ---- Criação do Mapa do Dataset ----
        if video_map:
            print("\nCriando mapa do dataset...")
            df = pd.DataFrame(video_map)
            
            # Salva o CSV
            df.to_csv(MAP_FILE_PATH, index=False)
            print(f"Mapa do dataset salvo em: {MAP_FILE_PATH}")
            print("\n--- Estatísticas dos Rótulos ---")
            print(df['label'].value_counts())
            print("---------------------------------")
        
        print("\nFase 1 concluída com sucesso!")

    except HttpError as error:
        print(f"Um erro ocorreu na API do Drive: {error}")
    except Exception as e:
        print(f"Um erro inesperado ocorreu: {e}")


if __name__ == '__main__':
    if FOLDER_ID == 'COLE_O_ID_DA_PASTA_DO_DRIVE_AQUI':
        print("ERRO: Você esqueceu de definir o 'FOLDER_ID' no topo do script.")
    else:
        main()