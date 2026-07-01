# 🏥 Interpretarte - Sistema de Acessibilidade em Saúde (Libras + AI)

**Projeto Integrado: Mobile (React Native) & AI Engine (Python)** *Desenvolvido para o TCC de Sistemas de informação - CESMAC 2026*

O **Interpretarte** é uma solução completa de acessibilidade para Unidades Básicas de Saúde (UBS). Ele combina uma interface mobile robusta para gestão clínica com um motor de inteligência artificial em Python capaz de traduzir a Língua Brasileira de Sinais (Libras) em tempo real, facilitando o atendimento de pacientes surdos.

---

## 🏗️ Arquitetura do Sistema

O projeto é dividido em dois núcleos principais que se comunicam para garantir um fluxo de dados íntegro e performático:



1. **Client (Mobile)**: Desenvolvido em **React Native**, gerencia a recepção, triagem de enfermagem e o prontuário médico.
2. **Brain (AI Engine + API)**: Desenvolvido em **Python**, utiliza visão computacional para processar frames de vídeo e extrair significados linguísticos, além de expor a API REST usada pelo app para autenticação e CRUD de pacientes.

---

## 🐍 Núcleo de Inteligência Artificial (Python)

O motor de tradução atua como o núcleo de processamento do sistema:

- **Visão Computacional**: Uso de `OpenCV` e `MediaPipe` para mapeamento de *landmarks* articulares das mãos e face.
- **Processamento de Sequência**: Implementação de modelos [LSTM/Random Forest/MediaPipe Hands] para reconhecimento de gestos dinâmicos.
- **Integração de Dados**: Backend estruturado em [FastAPI] para fornecer predições em tempo real e também autenticação, cadastro, triagem e prontuário ao aplicativo móvel.

---

## 📱 Interface Mobile (React Native)

Focada na usabilidade do profissional de saúde e na experiência do paciente:

- **Perfis de Acesso (RBAC)**: Distinção clara entre fluxos de Enfermagem (Triagem) e Médico (Consulta).
- **BI & Analytics**: Dashboards integrados com `react-native-chart-kit` para monitoramento do fluxo de pacientes.
- **Validação e UX**: Máscaras de dados, integração com **API ViaCEP** e notificações profissionais com `react-native-toast-message`.
- **Hospedagem**: Deploys via **EAS Update** para atualizações rápidas.

---

## 📊 Perspectiva de Business Intelligence

Como analista de BI, o projeto foi estruturado para gerar dados limpos e acionáveis:
- **Integridade**: Separação de camadas de dados (Cadastro -> Triagem -> Diagnóstico).
- **Eficiência**: Gráficos de volume de atendimento para gestão de gargalos em UBS públicas.
- **Acessibilidade**: Botão flutuante de Libras presente em todas as etapas do atendimento.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologias |
| :--- | :--- |
| **Mobile** | React Native, Expo, TypeScript, React Navigation |
| **Inteligência Artificial** | Python, MediaPipe, OpenCV, Scikit-Learn |
| **Integração/API** | FastAPI, SQLite, WebSockets, ViaCEP API |
| **DevOps/Deploy** | Git (PR Flow), EAS Update |

---

## ⚙️ Configuração de Ambiente (Mobile)

No diretório [mobile/.env.example](mobile/.env.example) existe um modelo para configurar a URL do WebSocket de tradução.

1. Copie o arquivo `.env.example` para `.env` dentro de `mobile`.
2. Ajuste `EXPO_PUBLIC_WS_URL` para o ambiente de teste:
	- Emulador Android: `ws://10.0.2.2:8000/ws/predict`
	- Celular físico: `ws://SEU_IP_LOCAL:8000/ws/predict`

3. Ajuste também `EXPO_PUBLIC_API_URL` para o mesmo host do backend HTTP:
	- Emulador Android: `http://10.0.2.2:8000`
	- Celular físico: `http://SEU_IP_LOCAL:8000`

O backend expõe os principais endpoints em `/api`:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/professionals`
- `DELETE /api/professionals/{id}`
- `GET /api/patients`
- `POST /api/patients`
- `PUT /api/patients/{id}/triage`
- `PUT /api/patients/{id}/clinical-note`

---

## 🚀 EAS Update

O projeto já inclui configuração em [mobile/eas.json](mobile/eas.json) com canais:
- `development`
- `preview`
- `production`

Fluxo básico para publicar update OTA:

```bash
cd mobile
npx eas login
npx eas update:configure
npx eas update --branch production --message "Atualização de interface e fluxo"
```

Atalhos via scripts NPM no diretório `mobile`:

```bash
npm run eas:update:preview
npm run eas:update:production
npm run eas:build:preview:android
npm run eas:build:production:android
```

---

## 👨‍💻 Autor
Victor Hugo Nascimento Calheiros, Analista de Business Intelligence & Estudante de Tecnologia no CESMAC. Maceió, Alagoas.
