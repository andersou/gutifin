import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import {
  getAllUserMessages,
  sendWhatsMessage,
} from "./evolution-api-client.js";

import {
  generateOpenAiResponse,
} from "./open-ai-client.ts";

import { COMMAND_SEPARATOR } from "./env.ts";

/**
 * Como a Evolution API não permite a personalização do header
 * Coloquei algumas verificações para garantir que o webhook só seja chamado
 * por mensagens do WhatsApp e de uma única origem
 */

const EVOLUTION_API_ORIGIN_IP_REQ = Deno.env.get("EVOLUTION_API_ORIGIN_IP_REQ");
const EVOLUTION_API_INSTANCE_NAME = Deno.env.get("EVOLUTION_API_INSTANCE_NAME");
const EVOLUTION_API_SENDER_JID = Deno.env.get("EVOLUTION_API_SENDER_JID");

Deno.serve(async (req) => {
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  console.log("cf-connecting-ip", cfConnectingIp);
  if (
    cfConnectingIp != null &&
    EVOLUTION_API_ORIGIN_IP_REQ != null &&
    cfConnectingIp != EVOLUTION_API_ORIGIN_IP_REQ
  ) {
    return new Response("Unauthorized source", { status: 401 });
  }
  const { event, instance, data } = await req.json();
  if (event != "messages.upsert") {
    return new Response("Unauthorized event", { status: 401 });
  }
  if (instance != EVOLUTION_API_INSTANCE_NAME) {
    return new Response("Unauthorized instance", { status: 401 });
  }
  if (data.key.fromMe == true) {
    return new Response("unprocessable", { status: 422 });
  }
  if (
    EVOLUTION_API_SENDER_JID != null &&
    data.key.remoteJid != EVOLUTION_API_SENDER_JID
  ) {
    return new Response("unprocessable", { status: 422 });
  }
  const message = data.message.conversation;
  console.log("Mensagem recebida: ", message);

  

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const systemPrompt = `
Você é um assistente financeiro integrado a um sistema, seu nome é Gutifin, o melhor e mais bem humorado assitente financeiro robô via Whatsapp. Sua tarefa é interpretar mensagens do usuário contendo descrições de gastos ou receitas, valores e categorias financeiras.

REGRAS:

1. Sempre responda em linguagem simples, clara e curta, adequada para o WhatsApp.
2. Quando identificar corretamente a **descrição**, o **valor** e a **categoria**, e a mensagem for clara o suficiente, você **confirma com o usuário** e inclui no final da resposta, de forma separada, os dados formatados para o sistema.
3. Use a sempre a seguinte estrutura para sua resposta, as áreas definidas entre [] são substituidas :

[resposta ao usuário]
${COMMAND_SEPARATOR}
[Operação: adicionar, listar ou excluir]
- No caso de **adicionar**, use a estrutura:
DESCRIÇÃO, CATEGORIA, VALOR
- No caso de **listar**, use uma das opções:
[ultimo-dia, ultima-semana, ultimo-mes, todos]
- No caso de **excluir**, não é necessário passar dados, apenas a operação.


Exemplo:
Vou listar seus gastos
${COMMAND_SEPARATOR}
Operação: listar
todos

4. Tente inferir ao máximo os dados, apenas não faça isso se a mensagem for muito vaga. O unico campo que você não pode inferir é o **valor**.
5. Seja direto e não use linguagem técnica.
6. Evite solicitar confirmação do usuário, a menos que seja necessário entender alguma informaçao adicional. Mas quando solicitar confirmação, apenas adicione a operação após a confirmação.
`;

  // const messagesReceived = await getAllUserMessages(
  //   data.key.remoteJid,
  // );
  // const messagesOpenaiMapped = messagesReceived.messages.records.slice(1, 5) //para nao pegar a ultima mensagem
  //   .map((msg) => {
  //     return {
  //       role: msg.key.fromMe ? "assistant" : "user",
  //       content: msg.message.conversation,
  //     };
  //   });

  // messagesOpenaiMapped.unshift({
  //   "role": "system",
  //   "content":
  //     "As mensagens seguintes são apenas contexto. Responda apenas à última mensagem do usuário.",
  // });
  // console.log("Mensagens de contexto:", messagesOpenaiMapped);
  const response = await generateOpenAiResponse( systemPrompt, message);

  const gptResponseJson = await response.json();
  console.log("Resposta da API Openai:", gptResponseJson);
  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: "Failed to get response from API Openai" }),
      { status: 500 },
    );
  }

  const gptResponse = gptResponseJson.choices[0].message.content;
  let toUserResponse = gptResponse;
  console.log("Resposta do GPT:", gptResponse);
  if (gptResponse.includes(COMMAND_SEPARATOR)) {
    const [userMsg, systemBlock] = gptResponse.split(COMMAND_SEPARATOR).map((
      s: string,
    ) => s.trim());
    toUserResponse = userMsg;

    console.log("System block:", systemBlock);
    const lines = systemBlock.split("\n").map((l: string) => l.trim());
    const operacaoLine = lines.find((line: string) =>
      line.toLowerCase().startsWith("operação:")
    );

    if (operacaoLine) {
      const operacao = operacaoLine.split(":")[1].trim().toLowerCase();

      switch (operacao) {
        case "adicionar": {
          const dados = lines.find((line: string) =>
            !line.toLowerCase().startsWith("operação:")
          );
          if (dados) {
            const [descricao, categoria, valorStr] = dados.split(",").map((
              s: string,
            ) => s.trim().toUpperCase());
            const valor = parseFloat(valorStr.replace(",", "."));

            if (!isNaN(valor)) {
              const { error } = await supabase.from("financeiro_lancamentos")
                .insert({
                  descricao,
                  categoria,
                  valor,
                });

              if (error) {
                console.error("Erro ao salvar no Supabase:", error);
              } else {
                console.log("Lançamento salvo com sucesso!");
              }
              toUserResponse =
                `${toUserResponse}\nLançamento adicionado com sucesso:\n• ${descricao} | ${categoria} | R$${valor}`;
            } else {
              console.warn("Valor inválido para lançamento:", valorStr);
            }
          }
          break;
        }

        case "listar": {
          const tipo = lines.find((line: string) =>
            ["ultimo-dia", "ultima-semana", "ultimo-mes", "todos"].find((tp) =>
              line.includes(
                tp,
              )
            )
          );
          console.log("Tipo de listagem:", tipo);
          if (!tipo) break;

          let fromDate: Date | null = null;

          switch (tipo) {
            case "ultimo-dia":
              fromDate = new Date();
              fromDate.setDate(fromDate.getDate() - 1);
              break;
            case "ultima-semana":
              fromDate = new Date();
              fromDate.setDate(fromDate.getDate() - 7);
              break;
            case "ultimo-mes":
              fromDate = new Date();
              fromDate.setMonth(fromDate.getMonth() - 1);
              break;
            case "todos":
              fromDate = null;
              break;
          }

          let query = supabase
            .from("financeiro_lancamentos")
            .select("*")
            .order("criado_em", { ascending: false });

          if (fromDate) {
            query = query.gte("criado_em", fromDate.toISOString());
          }

          const { data: resultados, error } = await query;

          if (error) {
            console.error("Erro ao listar lançamentos:", error);
            await sendWhatsMessage(
              data.key.remoteJid,
              "Erro ao buscar os lançamentos.",
            );
            break;
          }

          if (!resultados || resultados.length === 0) {
            toUserResponse = `${toUserResponse}\nNenhum lançamento encontrado.`;
            break;
          }

          const formatted = resultados.map((
            item: { descricao: string; categoria: string; valor: number },
          ) => `• ${item.descricao} | ${item.categoria} | R$${item.valor}`)
            .join("\n");

          const titulo = tipo === "ultimo-dia"
            ? "do último dia"
            : tipo === "ultima-semana"
            ? "da última semana"
            : tipo === "ultimo-mes"
            ? "do último mês"
            : "registrados";

          const resposta =
            `Aqui estão os lançamentos ${titulo}:\n ${formatted}\n\n Total: R$ ${
              resultados.reduce(
                (acc: number, item: { valor: number }) => acc + item.valor,
                0,
              ).toFixed(2)
            }`;

          toUserResponse = `${toUserResponse}\n ${resposta}`;
          break;
        }

        case "excluir": {
          // const isUltimo = lines.includes("ultimo");
          const isUltimo = true;

          if (isUltimo) {
            // Buscar o último lançamento
            const { data: ultimos, error } = await supabase
              .from("financeiro_lancamentos")
              .select("id, descricao, categoria, valor")
              .order("criado_em", { ascending: false })
              .limit(1);

            if (error || !ultimos || ultimos.length === 0) {
              toUserResponse =
                `${toUserResponse}\nNenhum lançamento encontrado.`;
              break;
            }

            const ultimo = ultimos[0];

            const { error: deleteError } = await supabase
              .from("financeiro_lancamentos")
              .delete()
              .eq("id", ultimo.id);

            if (deleteError) {
              console.error("Erro ao excluir último lançamento:", deleteError);
              await sendWhatsMessage(
                data.key.remoteJid,
                "Erro ao excluir o último lançamento.",
              );
              break;
            }

            toUserResponse =
              `${toUserResponse}\nLançamento excluído com sucesso:\n• ${ultimo.descricao} | ${ultimo.categoria} | R$${ultimo.valor}`;
            break;
          }

          // Se não for "ultimo", cai no caso anterior
          // 👇 Inclua aqui a lógica tradicional de exclusão por descrição/categoria/valor
          break;
        }

        default:
          console.warn("Operação não reconhecida:", operacao);
      }
    }
  }
  sendWhatsMessage(
    data.key.remoteJid,
    toUserResponse,
  );

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } },
  );
});


