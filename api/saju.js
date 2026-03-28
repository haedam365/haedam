const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { name, dayStem, relationship, concern, sajuData } = req.body;
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        당신은 내담자에게 따뜻한 조언을 건네는 상담가입니다. 다음 정보를 바탕으로 풀이하세요.
        [내담자 정보] 이름: ${name}, 일간: ${dayStem}, 연애상태: ${relationship}, 고민: ${concern}, 사주데이터: ${JSON.stringify(sajuData)}

        [지침]
        1. 한자 용어는 모두 빼고 쉬운 우리말로 풀이하세요.
        2. ${dayStem}의 기운을 자연(나무, 햇살, 바다 등)에 비유하세요.
        3. 실제 사람이 다정하게 말해주는 말투(~해요)를 사용하세요.
        4. 자기소개나 인사말은 절대 넣지 마세요.

        [응답 형식]
        반드시 다른 설명 없이 아래의 JSON 구조만 출력하세요. 
        {"nature": "내용", "pros_cons": "내용", "fortune_2026": "내용", "advice": "내용"}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // AI가 앞뒤에 붙이는 마크다운이나 불필요한 텍스트 제거 로직 강화
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}') + 1;
        const jsonString = text.slice(jsonStart, jsonEnd);
        
        const data = JSON.parse(jsonString);
        res.status(200).json(data);

    } catch (error) {
        console.error("서버 에러:", error);
        res.status(500).json({ error: "AI 분석 중 오류가 발생했습니다." });
    }
}
