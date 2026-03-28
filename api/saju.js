import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, dayStem, relationship, concern, sajuData } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Vercel 환경변수에 API 키가 없습니다.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 에러 해결 핵심: 모델명을 'gemini-1.5-flash'로 명시하고 최신 호출 방식을 사용합니다.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      당신은 사주 상담가 '해담'입니다. 아래 정보를 바탕으로 따뜻하게 풀이하세요.
      내담자: ${name}, 일간: ${dayStem}, 고민: ${concern}, 명식: ${JSON.stringify(sajuData)}
      
      [필수 조건]
      1. 한자 없이 자연의 물상(나무, 햇살, 바다 등)에 비유해서 설명할 것.
      2. 실제 사람이 다정하게 말하는 어조(~해요)를 사용할 것.
      3. 반드시 아래 JSON 형식으로만 답변할 것. 다른 말은 절대 금지.
      {"nature": "...", "pros_cons": "...", "fortune_2026": "...", "advice": "..."}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // JSON 추출 (마크다운 제거)
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    res.status(200).json(JSON.parse(jsonString));

  } catch (error) {
    console.error("상세 에러:", error);
    res.status(500).json({ error: "분석 실패: " + error.message });
  }
}
