import os
import unicodedata

def normalizar_texto(texto):
    """
    Remove acentos, espaços e deixa tudo em minúsculo.
    Ex: 'Água' vira 'agua', 'Bom Dia' vira 'bom_dia'
    """
    # Normaliza unicode (remove acentos)
    nfkd_form = unicodedata.normalize('NFKD', texto)
    texto_sem_acento = u"".join([c for c in nfkd_form if not unicodedata.combining(c)])
    
    # Remove espaços, coloca em lower case e substitui espaços por underline
    return texto_sem_acento.lower().strip().replace(' ', '_')

def renomear_videos(caminho_raiz):
    # Verifica se o caminho existe
    if not os.path.exists(caminho_raiz):
        print(f"Erro: O caminho '{caminho_raiz}' não foi encontrado.")
        return

    # Percorre todas as pastas dentro do diretório raiz
    print(f"--- Iniciando organização em: {caminho_raiz} ---")
    
    for nome_pasta in os.listdir(caminho_raiz):
        caminho_completo_pasta = os.path.join(caminho_raiz, nome_pasta)

        # Garante que é uma pasta (e não um arquivo solto na raiz)
        if os.path.isdir(caminho_completo_pasta):
            
            # Cria o prefixo padronizado (ex: pasta 'Água' -> prefixo 'agua')
            prefixo = normalizar_texto(nome_pasta)
            
            # Pega todos os arquivos da pasta
            arquivos = [f for f in os.listdir(caminho_completo_pasta) 
                        if os.path.isfile(os.path.join(caminho_completo_pasta, f))]
            
            # Ordena para garantir consistência (opcional, mas recomendado)
            arquivos.sort()
            
            print(f"\nProcessando pasta: '{nome_pasta}' (Total: {len(arquivos)} arquivos)")
            
            contador = 1
            for arquivo in arquivos:
                # Separa o nome da extensão (ex: .mp4)
                nome_antigo, extensao = os.path.splitext(arquivo)
                
                # Ignora arquivos ocultos ou de sistema (como .DS_Store no Mac ou thumbs.db)
                if nome_antigo.startswith('.'):
                    continue

                # Cria o novo nome: agua_0001.mp4
                novo_nome = f"{prefixo}_{contador:04d}{extensao}"
                
                caminho_antigo = os.path.join(caminho_completo_pasta, arquivo)
                caminho_novo = os.path.join(caminho_completo_pasta, novo_nome)

                # Evita renomear se já estiver certo (para não dar erro)
                if caminho_antigo != caminho_novo:
                    try:
                        os.rename(caminho_antigo, caminho_novo)
                        # print(f"Renomeado: {arquivo} -> {novo_nome}") # Descomente se quiser ver um por um
                    except OSError as e:
                        print(f"Erro ao renomear {arquivo}: {e}")
                
                contador += 1
            
            print(f"Concluído! {contador-1} vídeos renomeados em '{nome_pasta}'.")

    print("\n--- Processo Finalizado com Sucesso ---")

# ==========================================
# CONFIGURAÇÃO
# ==========================================

# Substitua este caminho pelo caminho da sua pasta de vídeos
# Dica: No Windows, use r"C:\Caminho\..." ou barras duplas C:\\Caminho\\...
CAMINHO_DO_DATASET = r"D:\Videos tcc"

if __name__ == "__main__":
    # Confirmação de segurança
    print(f"O script vai renomear arquivos em: {CAMINHO_DO_DATASET}")
    resposta = input("Você tem certeza? Digite 's' para continuar: ")
    
    if resposta.lower() == 's':
        renomear_videos(CAMINHO_DO_DATASET)
    else:
        print("Operação cancelada.")