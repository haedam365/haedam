const { GoogleGenerativeAI } = require('@google/generative-ai');

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { name, dayStem, relationship, concern, sajuData } = req.body;

    // Vercel 환경변수에 설정할 Gemini API 키
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    너는 20년 경력의 따뜻하고 통찰력 있는 사주 명리학 전문가야.
    아래 내담자의 정보를 바탕으로 4가지 항목을 각각 400~500자로 풀이해 줘.

    [내담자 정보]
    - 이름: ${name}
    - 일간(본질): ${dayStem}
    - 연애상태: ${relationship}
    - 현재고민: ${concern}
    - 사주명식: ${JSON.stringify(sajuData)}

    [출력 조건]
    반드시 아래 JSON 형식으로만 답변할 것. 마크다운(\`\`\`) 제외.
    {
        "nature": "타고난 성향과 기질...",
        "pros_cons": "장점과 단점...",
        "fortune_2026": "2026년(병오년) 총운...",
        "advice": "현재 고민과 연애상태를 반영한 조언..."
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        res.status(200).json(JSON.parse(text));
    } catch (error) {
        res.status(500).json({ error: '사주 풀이를 생성하는 중 오류가 발생했습니다.' });
    }
}