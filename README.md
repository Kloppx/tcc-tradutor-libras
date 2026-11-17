# InterpretArte — acessibilidade em saúde com Libras e IA

Projeto de TCC de Sistemas de Informação do CESMAC. O InterpretArte combina um aplicativo mobile para recepção, triagem e atendimento clínico em Unidades Básicas de Saúde com um motor de inteligência artificial que reconhece sinais de Libras em vídeos gravados pelo aplicativo.

## Arquitetura

O projeto possui dois núcleos:

1. **Aplicativo mobile:** React Native, Expo e TypeScript, com fluxos de paciente, enfermagem e médico.
2. **Backend e IA:** Python, FastAPI, SQLite, OpenCV, MediaPipe e TensorFlow para receber vídeos, extrair sequências de pontos de referência e classificar os sinais.

O vocabulário atual possui 10 classes: `curar`, `doenca`, `dor`, `hospital`, `posto de saude`, `ppa`, `remedio`, `saude`, `sus` e `ubs`. Na avaliação registrada em `reports/v3`, o modelo alcançou **83,67% de acurácia** e **82,71% de F1 macro**.

## Tecnologias

| Camada | Tecnologias |
| :--- | :--- |
| Mobile | React Native, Expo, TypeScript, React Navigation |
| Inteligência artificial | Python, TensorFlow, MediaPipe, OpenCV, Scikit-learn |
| API e dados | FastAPI, SQLite, upload HTTP |
| Distribuição | Git e EAS Update |

## Início rápido em um notebook Windows

### Pré-requisitos

- Git;
- Python 3.10;
- Node.js 20 ou superior;
- Expo Go instalado no celular;
- notebook e celular conectados à mesma rede Wi-Fi.

Clone o repositório, abra o PowerShell na raiz do projeto e execute:

```powershell
.\scripts\setup_notebook.ps1
```

O script detecta o IPv4 do notebook, cria o ambiente Python, instala as dependências do backend e do aplicativo e gera o arquivo `mobile/.env`. Caso a detecção escolha a interface de rede errada, informe o endereço manualmente:

```powershell
.\scripts\setup_notebook.ps1 -ServerIp 192.168.0.10
```

Inicie o backend no primeiro terminal:

```powershell
.\venv\Scripts\python.exe -m uvicorn src.ws_server:app --host 0.0.0.0 --port 8000
```

Inicie o aplicativo no segundo terminal:

```powershell
cd mobile
npm.cmd start -- --clear
```

Leia o QR Code com o Expo Go. Se o Windows perguntar, permita o acesso do Python à rede privada. Se a porta `8000` já estiver ocupada, encerre o processo anterior antes de iniciar o servidor.

### Contas de demonstração

| Perfil | E-mail | Senha |
| :--- | :--- | :--- |
| Médico | `medico@ubs.com` | `123` |
| Enfermeiro | `enfermeiro@ubs.com` | `123` |

O banco SQLite é criado automaticamente no primeiro início do backend, junto com as contas e os pacientes de demonstração.

## Configuração manual de rede

Se preferir configurar o aplicativo manualmente, copie `mobile/.env.example` para `mobile/.env` e substitua `SEU_IP_LOCAL` pelo IPv4 do computador.

Exemplos:

- emulador Android: `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000`;
- celular físico: `EXPO_PUBLIC_API_URL=http://192.168.X.X:8000`.

O backend expõe, entre outros, os endpoints:

- `POST /api/auth/login`;
- `POST /api/auth/register`;
- `GET /api/professionals`;
- `PUT /api/professionals/{id}/activation`;
- `DELETE /api/professionals/{id}`;
- `GET /api/patients`;
- `POST /api/patients`;
- `POST /api/patients/lookup`;
- `GET /api/patients/{id}/status`;
- `PUT /api/patients/{id}/triage`;
- `PUT /api/patients/{id}/clinical-note`;
- `POST /predict_video`.

As rotas profissionais exigem um token Bearer emitido no login. Cadastros públicos ficam inativos até que um médico os aprove na tela de gestão; cadastros feitos por um médico autenticado já são ativados. O autoatendimento, a consulta mínima por CPF/SUS e o acompanhamento da senha continuam públicos, sem expor o prontuário completo.

## Segurança e privacidade

Em produção, defina `INTERPRETARTE_SECRET_KEY` com um segredo aleatório e disponibilize a API exclusivamente por HTTPS. Sem essa variável, o backend gera uma chave local em `data/.api_secret`, adequada apenas ao desenvolvimento. As decisões técnicas e os pontos que ainda exigem validação institucional estão documentados em `docs/SEGURANCA_E_LGPD.md`.

## Adição incremental de vídeos para a IA

Organize os novos arquivos em pastas separadas por palavra:

```text
novos_videos/
├── Hospital/
├── Posto de saúde/
├── PPA/
├── SUS/
└── UBS/
```

Confira a organização sem copiar arquivos:

```powershell
.\venv\Scripts\python.exe scripts\organize_new_videos.py --source-root "C:\caminho\novos_videos" --dry-run
```

Para adicionar os vídeos e executar o pipeline completo:

```powershell
.\venv\Scripts\python.exe scripts\run_full_pipeline.py --new-videos "C:\caminho\novos_videos" --report-dir reports\v3
```

O processo mantém os arquivos existentes, ignora duplicatas, processa apenas os vídeos novos e mostra barras de progresso no terminal. O treinamento continua usando todas as classes já cadastradas.

## Documentação e manual

A documentação acadêmica completa, com requisitos, segurança, matrizes, instalação e manual ilustrado dos fluxos, está disponível em [`docs/DOCUMENTACAO_E_MANUAL_INTERPRETARTE.pdf`](docs/DOCUMENTACAO_E_MANUAL_INTERPRETARTE.pdf).

## Apresentação

A versão mais recente está em `APRESENTACAO_REGISTRO_INTERPRETARTE_v10.pptx` e contém o vídeo de demonstração incorporado, o diagrama de sequência da IA, a estrutura da rede neural, a assertividade por palavra no conjunto de teste e os resultados finais.

## EAS Update

O arquivo `mobile/eas.json` contém os perfis `development`, `preview` e `production`. Os principais comandos estão disponíveis como scripts NPM:

```powershell
cd mobile
npm.cmd run eas:update:preview
npm.cmd run eas:update:production
npm.cmd run eas:build:preview:android
npm.cmd run eas:build:production:android
```

## Autor

Victor Hugo Nascimento Calheiros — Analista de Business Intelligence e estudante de Tecnologia no CESMAC, Maceió, Alagoas.
