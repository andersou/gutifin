# 🤖 Gutifin – Seu Assistente Financeiro no WhatsApp

O **Gutifin** é um assistente pessoal pensado para te ajudar a manter sua vida financeira em ordem – tudo isso direto pelo WhatsApp!  
Simples, prático e eficiente. 💸📱

## 🚀 Visão Geral

O Gutifin foi desenvolvido para rodar diretamente no **Supabase**, aproveitando ao máximo sua estrutura robusta, suporte a Edge Functions, banco de dados e um **free tier generoso** – perfeito para quem está começando ou quer escalar com economia.

## 🧰 Pré-requisitos

Antes de rodar o Gutifin, você vai precisar de:

- ✅ Uma instância ativa da [EvolutionAPI](https://doc.evolution-api.com/v2/pt/get-started/introduction) para enviar e receber mensagens via WhatsApp.
- ✅ Conta no [Supabase](https://supabase.com) com projeto configurado.
- ✅ Node.js e Supabase CLI instalados na sua máquina.
- ✅ Uma conta em algum serviço OpenAI-compatible, algumas opções gratuitas são o openrouter.ai e o Google Gemini

## 🔐 Variáveis de Ambiente

O Gutifin utiliza as seguintes variáveis de ambiente definidas no arquivo `env.ts`:

### Configurações de LLM (Modelo de Linguagem)

| Variável                | Descrição                                                                          | Valor                                                                    |
| ----------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `OPENAI_API_URL`        | URL de endpoint para integração com a API do Google Gemini (compatível com OpenAI) | https://generativelanguage.googleapis.com/v1beta/openai/chat/completions |
| `OPENAI_API_MODEL`      | Modelo específico do Gemini utilizado para processamento de linguagem natural      | gemini-2.5-pro-exp-03-25                                                 |
| `OPENAI_API_KEY_SECRET` | Nome da variável de ambiente que contém a chave de API do Gemini                   | GEMINI_OPENAI_API_KEY                                                    |
| `OPENAI_API_KEY`        | A chave de API do Gemini obtida da variável de ambiente                            | Obtido via Deno.env.get(OPENAI_API_KEY_SECRET)                           |

### Configurações do Gutifin

| Variável            | Descrição                                                 | Valor                                        |
| ------------------- | --------------------------------------------------------- | -------------------------------------------- |
| `COMMAND_SEPARATOR` | String utilizada para separar comandos em mensagens       | "__HAS_COMMAND:"                             |
| `EVOLUTION_API_KEY` | Chave de API da EvolutionAPI para integração com WhatsApp | Obtido via Deno.env.get("EVOLUTION_API_KEY") |

### Como configurar as variáveis de ambiente no Supabase

Para configurar as variáveis de ambiente necessárias, utilize o Supabase CLI:

```bash
# Configurar chave de API do Google Gemini
supabase secrets set GEMINI_OPENAI_API_KEY=sua_chave_api_gemini

# Configurar chave de API da EvolutionAPI
supabase secrets set EVOLUTION_API_KEY=sua_chave_api_evolution
```

Certifique-se de substituir `sua_chave_api_gemini` e `sua_chave_api_evolution` pelas suas chaves reais.

## ⚙️ Como Instalar

1. **Clone o projeto:**
   ```bash
   git clone https://github.com/seu-usuario/gutifin.git
   cd gutifin
   ```

2. **Configure o ambiente:**

   No arquivo `env.ts`, defina as variáveis necessárias (como tokens, secrets, etc). Você pode usar o Supabase CLI para definir os secrets:

   ```bash
   supabase secrets set NOME_DA_VARIAVEL=valor
   ```

3. **Implemente a função Edge:**

   Faça o deploy da função que será chamada via webhook:

   ```bash
   supabase functions deploy gutifin
   ```

4. **Crie o banco de dados:**

   Rode as migrações para configurar a estrutura inicial:

   ```bash
   supabase db push
   ```

5. **Configure o Webhook na EvolutionAPI:**

   Aponte o evento `messages.upsert` para a URL da função Edge que foi gerada no Supabase.  
   Exemplo:
   ```
   https://<projeto>.functions.supabase.co/gutifin
   ```

## 🧠 O que o Gutifin faz?

- 📊 Controla entradas e saídas financeiras
- 📅 Ajuda a organizar compromissos financeiros
- 📈 Gera resumos diretamente no WhatsApp

Tudo com uma linguagem simples, amigável e sem precisar sair do seu app de mensagens favorito!


## 📌 Contribuindo

Pull requests são super bem-vindos! Se quiser sugerir melhorias, correções ou novas funcionalidades, fique à vontade para abrir uma issue ou PR.  
Vamos juntos melhorar o Gutifin! ❤️

## 📄 Licença

Este projeto está sob a licença MIT.
