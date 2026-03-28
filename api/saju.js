const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, dayStem, relationship, concern, sajuData } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 사주 데이터를 읽기 좋게 문자열로 변환
    const formatSaju = `년:${sajuData.year}, 월:${sajuData.month}, 일:${sajuData.day}, 시:${sajuData.time}`;

    const prompt = `
      너는 다정하고 지혜로운 사주 상담가 '해담'이야. 
      아래 내담자 정보를 바탕으로 한자 용어 없이 자연의 비유(나무, 햇살, 바다 등)를 담아 따뜻하게 풀이해줘.

      내담자: ${name} (${relationship})
      본질: ${dayStem} (일간)
      고민: ${concern}
      사주명식: ${formatSaju}

      [답변 규칙]
      - 반드시 JSON 형식으로만 답변할 것. 다른 말은 절대 덧붙이지 마.
      - 말투는 실제 사람이 말하듯 "~해요", "~일 거예요" 같은 구어체를 사용해.
      - 각 항목은 공백 포함 300자 내외로 정성껏 작성해.

      {
        "nature": "자연에 비유한 성향과 기질...",
        "pros_cons": "본인의 장점과 주의할 점...",
        "fortune_2026": "2026년 병오년의 흐름...",
        "advice": "고민에 대한 명리적 조언..."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // JSON 추출 로직 강화
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    const jsonString = text.slice(jsonStart, jsonEnd);

    res.status(200).json(JSON.parse(jsonString));

  } catch (error) {
    console.error("AI 에러:", error);
    res.status(500).json({ error: '분석 실패: ' + error.message });
  }
};
