# Segurança, privacidade e adequação à LGPD

Este documento registra controles técnicos do InterpretArte. Ele não substitui a análise jurídica nem declara, por si só, conformidade integral com a Lei Geral de Proteção de Dados.

## Dados tratados

O sistema pode armazenar identificação do paciente, CPF, Cartão SUS, RG, data de nascimento, endereço, dados de triagem e anotações clínicas. Esses dados devem ser tratados como pessoais e, no caso das informações de saúde, como dados pessoais sensíveis.

O vídeo gravado para reconhecimento de Libras é salvo apenas em arquivo temporário, processado pela API e removido após a resposta. O sistema não deve usar vídeos de atendimento para treinamento sem autorização específica e registro da origem do material.

## Controles implementados

- autenticação profissional por token Bearer assinado, com validade de oito horas;
- autorização separada para médico e enfermagem;
- senhas novas derivadas com PBKDF2-HMAC-SHA256, salt aleatório e 600 mil iterações;
- migração automática dos hashes SHA-256 antigos após um login válido;
- token armazenado no dispositivo pelo `expo-secure-store`;
- cadastro público de profissional pendente até aprovação por um médico autenticado;
- prontuários e listagens disponíveis somente para profissionais autenticados;
- consulta pública por CPF/SUS devolvendo apenas nome abreviado, senha e estado da fila;
- endpoint público de acompanhamento que não devolve dados clínicos;
- geração atômica e única das senhas de atendimento;
- validação de função profissional e normalização dos indicadores booleanos da triagem;
- upload limitado a 40 MB, formatos de vídeo permitidos e até 1.800 frames;
- processamento de vídeo fora do event loop principal da API;
- segredo de assinatura configurável por variável de ambiente e chave local fora do Git;
- credenciais, banco local, vídeos brutos e arquivos temporários ignorados pelo Git.

## Regras operacionais antes de uso real

1. Publicar a API somente por HTTPS. O endereço HTTP da rede local deve ser usado apenas em demonstração controlada.
2. Definir `INTERPRETARTE_SECRET_KEY` por meio do gerenciador de segredos do ambiente.
3. Remover ou trocar as senhas das contas de demonstração.
4. Restringir acesso ao servidor e aos backups do SQLite.
5. Definir responsáveis institucionais pelo tratamento e atendimento aos titulares.
6. Informar finalidade, base legal, compartilhamentos, prazo de retenção e canal para exercício de direitos.
7. Definir política de backup, restauração, descarte e resposta a incidentes.
8. Registrar autorização e proveniência dos vídeos usados no treinamento da IA.

## Pendências institucionais e jurídicas

- confirmar a base legal aplicável ao atendimento e ao tratamento de dados de saúde;
- definir controlador, operadores, encarregado e canal de contato;
- estabelecer prazos de retenção para cadastros, triagens, prontuários, logs e backups;
- preparar aviso de privacidade em linguagem acessível, incluindo versão em Libras;
- validar procedimentos para acesso, correção, anonimização, portabilidade e eliminação;
- realizar relatório de impacto à proteção de dados quando a instituição considerar necessário;
- homologar os controles com segurança da informação e assessoria jurídica da instituição.

## Limites atuais

O SQLite local não possui criptografia de dados em repouso. Não há ainda trilha de auditoria persistente, revogação individual de tokens, recuperação de senha nem limitação distribuída de tentativas. Esses pontos devem ser concluídos antes de uma implantação clínica real.
