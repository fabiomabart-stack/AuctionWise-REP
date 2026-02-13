
import { GoogleGenAI, Type } from "@google/genai";
import { AuctionData } from "../types";

export const extractAuctionData = async (
  fileBase64?: string,
  urlText?: string
): Promise<Partial<AuctionData>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Você é um Analista de Investimentos e Especialista em Direito Imobiliário focado em Leilões de Imóveis no Brasil. 
  Sua tarefa é ler o documento ou texto fornecido (Edital de Leilão ou link) e extrair os dados precisos para uma planilha de controle de custos, além de realizar uma análise jurídica crítica.
  
  Extraia os seguintes campos:
  1. Endereço completo e nome do Edifício.
  2. Valor de Avaliação (Appraisal Value).
  3. Valor Mínimo do 2º Leilão (Min Bid).
  4. Data do 2º Leilão (Data).
  5. Tipo de Leilão: Judicial ou Extrajudicial.
  6. Total de Débitos de IPTU e quem é o responsável (Arrematante ou Vendedor/Comitente).
  7. Total de Débitos de Condomínio e quem é o responsável.
  8. Outros débitos e o responsável.
  9. Estado de Ocupação (Ocupado, Desocupado).
  10. Informação do Registro de Imóveis (RGI/Matrícula).
  
  ANÁLISE JURÍDICA ESPECIALIZADA (Campo attentionNotes):
  Como um especialista em direito imobiliário, analise minuciosamente o edital em busca de riscos. No campo 'attentionNotes', produza um texto profissional abordando:
  - Riscos de sucessão de débitos: Verifique se o edital menciona explicitamente que o arrematante recebe o imóvel livre de débitos anteriores (Art. 130 CTN) ou se há pegadinhas.
  - Ônus e Gravames: Identifique hipotecas, penhoras, usufruto, alienação fiduciária ou indisponibilidades.
  - Situação Processual: Verifique se há menção a recursos pendentes, embargos à execução ou processos conexos que possam anular o leilão.
  - Desocupação: Analise se há menção a liminares ou detalhes sobre quem detém a posse.
  - Alertas Críticos: Qualquer cláusula abusiva ou incomum que impacte a viabilidade do negócio.

  Retorne os dados estritamente no formato JSON definido.`;

  const contents = [];
  
  if (fileBase64) {
    contents.push({
      inlineData: {
        mimeType: "application/pdf",
        data: fileBase64,
      },
    });
  }

  if (urlText) {
    contents.push({ text: `Texto/Link do Leilão: ${urlText}` });
  }

  contents.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: contents },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          address: { type: Type.STRING },
          buildingName: { type: Type.STRING },
          appraisalValue: { type: Type.NUMBER },
          minBid2ndAuction: { type: Type.NUMBER },
          auctionDate: { type: Type.STRING },
          auctionType: { type: Type.STRING, description: "Judicial, Extrajudicial, Unknown" },
          iptuDebt: { type: Type.NUMBER },
          iptuResponsible: { type: Type.STRING, description: "Purchaser, Seller or Shared" },
          condoDebt: { type: Type.NUMBER },
          condoResponsible: { type: Type.STRING, description: "Purchaser, Seller or Shared" },
          otherDebts: { type: Type.NUMBER },
          otherDebtsResponsible: { type: Type.STRING, description: "Purchaser, Seller or Shared" },
          occupancyStatus: { type: Type.STRING, description: "Occupied, Vacant, Unknown" },
          rgiInfo: { type: Type.STRING },
          attentionNotes: { type: Type.STRING, description: "Professional legal analysis and warnings from a real estate law perspective." },
        },
      },
    },
  });

  try {
    const data = JSON.parse(response.text || "{}");
    return data;
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    return {};
  }
};
