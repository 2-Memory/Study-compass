// FIX: Import React, useState, and useEffect to be used in components.
import React, { useState, useEffect } from "react";
// FIX: Import createRoot for rendering the React application.
import { createRoot } from "react-dom/client";
import { GoogleGenAI } from "@google/genai";

// --- Helper Functions ---
const hexToRgba = (hex, alpha = 1) => {
    if (!hex || !hex.startsWith('#')) return `rgba(255, 255, 255, ${alpha})`;
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};


// --- Data for new Habit Checker feature ---

const habitQuestions = [
    { "question": "공부를 시작하기 전에 책상 정리가 완벽해야 마음이 편하다.", "type": "B" },
    { "question": "공부 계획을 세울 때, 실천 가능한 분량보다 더 많이 적는다.", "type": "A" },
    { "question": "친구의 **'딱 10분만 쉬자'**는 제안에 쉽게 넘어간다.", "type": "E" },
    { "question": "시험 범위의 마지막 장을 덮는 순간, 공부했던 내용이 기억나지 않는다.", "type": "D" },
    { "question": "모르는 문제가 생기면 답지보다 구글 검색을 먼저 해본다.", "type": "F" },
    { "question": "잠을 줄여가며 공부하지만, 실제 집중하는 시간은 짧다.", "type": "G" },
    { "question": "노트 필기나 플래너 꾸미는 데 실제 공부 시간보다 더 많은 시간을 소비한다.", "type": "H" },
    { "question": "어제 배운 내용을 복습하는 것보다 오늘 진도를 나가는 것이 더 중요하다고 생각한다.", "type": "D" },
    { "question": "**'이 부분은 시험에 안 나올 거야'**라고 스스로 납득하며 과감하게 넘어간다.", "type": "C" },
    { "question": "공부 중 휴대폰을 덮어뒀다가도, 10분마다 습관적으로 휴대폰을 확인한다.", "type": "E" },
    { "question": "틀린 문제에 10분 이상 매달리기보다, 바로 해설을 보고 다음 문제로 넘어간다.", "type": "F" },
    { "question": "타이머를 설정하지 않으면 공부에 집중하기 어렵다.", "type": "A" },
    { "question": "필기구나 형광펜 색깔을 고르는 데 10분 이상 고민한다.", "type": "H" },
    { "question": "벼락치기를 해도 생각보다 성적이 잘 나오는 편이다.", "type": "C" },
    { "question": "책상에 앉아있는 시간이 많으면 스스로 만족도가 높다.", "type": "G" },
    { "question": "암기할 때 **'이해가 안 되더라도 일단 외우자'**고 생각한다.", "type": "D" },
    { "question": "공부 인증 사진을 찍어 SNS에 올리는 것이 동기 부여가 된다.", "type": "H" },
    { "question": "주변이 아주 조용해야만 공부가 잘 되고, 작은 소음에도 예민하다.", "type": "B" },
    { "question": "자투리 시간을 활용하기보다, 3시간 이상 집중할 수 있는 긴 시간을 선호한다.", "type": "A" },
    { "question": "휴식 시간 5분이 50분처럼 느껴진다. (복귀하기 힘들다.)", "type": "E" }
];

const habitTypes = {
    'E': { name: '도파민 중독형', priority: 1, description: '휴대폰, SNS 등 즉각적인 보상에 쉽게 빠져들어 공부 집중력을 유지하는 데 가장 큰 어려움을 겪는 유형입니다. 잠깐의 휴식이 긴 딴짓으로 이어지기 쉽습니다.' },
    'G': { name: '집중 시간 조작형', priority: 2, description: '책상에 앉아있는 시간을 실제 공부 시간과 동일시하는 경향이 있습니다. 실제 집중하는 시간은 짧지만, 오랜 시간 공부했다는 착각에 빠져 비효율적인 학습을 반복합니다.' },
    'C': { name: '벼락치기 도박사형', priority: 3, description: '평소에는 공부를 미루다가 시험 직전에 모든 것을 쏟아붓는 유형입니다. 운에 의존하는 경향이 있으며, 장기적인 학습 효과를 기대하기 어렵습니다.' },
    'D': { name: '휘발성 암기형', priority: 4, description: '이해보다는 단순 암기에 의존하여 공부합니다. 복습을 소홀히 하여 배운 내용이 금방 사라지는 특징이 있습니다.' },
    'H': { name: '낭만 필기 장인형', priority: 5, description: '학습 내용의 본질을 파악하기보다 필기나 플래너를 예쁘게 꾸미는 데 더 많은 시간과 에너지를 쏟습니다. 공부의 결과물보다 과정의 미학을 중시합니다.' },
    'B': { name: '환경 설정 장인형', priority: 6, description: '공부를 시작하기 위해 완벽한 환경이 갖춰져야만 하는 유형입니다. 공부 전 준비 과정이 길어져 실제 학습 시작이 늦어지는 경우가 많습니다.' },
    'F': { name: '효율 추구형', priority: 7, description: '어려운 문제에 깊이 고민하기보다 빠른 해결책을 찾는 것을 선호합니다. 해설이나 검색에 의존하여 스스로 문제를 해결하는 능력을 키우기 어렵습니다.' },
    'A': { name: '계획 중독형', priority: 8, description: '계획을 세우는 것 자체에서 큰 만족감을 느끼지만, 막상 실천으로 옮기는 데는 어려움을 겪습니다. 계획이 너무 거창하여 실행력이 떨어지는 경우가 많습니다.' }
};


// --- Data for original Study Compass feature ---

const questions = [
  { question: "수업 중 선생님이 한 명씩 돌아다니며 봐주는 것을 좋아하나요?", weights: { '현강형': 1, '과외/관리형': 2 } },
  { question: "수업 내용을 필기할 때, 선생님의 말 하나하나를 모두 받아 적는 편인가요?", weights: { '현강형': 2 } },
  { question: "모르는 문제가 생겼을 때, 인터넷보다 즉시 질문하여 해결하는 것을 선호하나요?", weights: { '현강형': 1, '과외/관리형': 2 } },
  { question: "혼자보다 그룹 스터디를 할 때 더 집중이 잘 되나요?", weights: { '현강형': 1, '과외/관리형': 1, '토론/협력형': 3 } },
  { question: "정해진 시간표에 맞춰 규칙적으로 공부하는 것을 좋아하나요?", weights: { '현강형': 1, '과외/관리형': 1 } },
  { question: "공부 중 잡담/휴식 후 다시 집중하기까지 시간이 오래 걸리나요?", weights: { '과외/관리형': 2 } },
  { question: "개념을 여러 문제를 풀며 스스로 깨치는 것을 선호하나요?", weights: { '인강형': 2, '실전/응용형': 2 } },
  { question: "개념 설명을 들을 때, 한 번에 이해 안 되면 보충 설명을 요청하나요?", weights: { '과외/관리형': 2, '토론/협력형': 1 } },
  { question: "선생님이 칠판에 적어준 내용을 그대로 따라 적는 것만으로도 이해가 되나요?", weights: { '인강형': 1, '현강형': 1 } },
  { question: "정해진 커리큘럼 없이, 약한 부분만 집중적으로 공부하는 것을 선호하나요?", weights: { '인강형': 2, '과외/관리형': 1 } },
  { question: "학습 계획을 스스로 세우고, 실천하는 데 어려움이 없나요?", weights: { '인강형': 3 } },
  { question: "굳이 질문할 필요 없이, 모르는 내용은 혼자서도 충분히 해결할 수 있나요?", weights: { '인강형': 2, '실전/응용형': 1 } },
  { question: "정해진 강의 시간 없이, 내가 원하는 속도로 진도를 나가고 싶나요?", weights: { '인강형': 3 } },
  { question: "학습 목표를 '1시간에 50문제 풀기'처럼 구체적으로 세우는 것을 좋아하나요?", weights: { '인강형': 1, '실전/응용형': 2 } },
  { question: "틀린 문제를 다시 풀 때, 선생님이 옆에서 자세히 설명해주는 것을 좋아하나요?", weights: { '과외/관리형': 3 } },
  { question: "학습 진도를 꾸준히 점검해주고, 채찍질해주는 사람이 필요하다고 느끼나요?", weights: { '과외/관리형': 3 } },
  { question: "다른 사람과 함께 공부하며 서로의 학습법을 공유하는 것을 좋아하나요?", weights: { '현강형': 1, '토론/협력형': 2 } },
  { question: "학습 성취도를 점검할 때, 다른 사람과 비교하는 것보다 나의 지난 기록과 비교하는 것을 선호하나요?", weights: { '인강형': 1 } },
  { question: "모르는 문제를 풀이할 때, 선생님 설명을 듣고 그대로 이해하는 편인가요?", weights: { '현강형': 2, '과외/관리형': 1 } },
  { question: "공부 환경이 시끄러워도 집중할 수 있나요?", weights: { '인강형': 1 } },
  { question: "개념을 다른 사람에게 설명해주면서 더 잘 이해하게 되는 경험이 있나요?", weights: { '토론/협력형': 3 } },
  { question: "이론만 배우기보다, 배운 내용을 바로 문제에 적용해보고 싶나요?", weights: { '실전/응용형': 3 } },
  { question: "스터디 그룹에서 토론을 주도하고 새로운 아이디어를 내는 것을 즐기나요?", weights: { '토론/협력형': 2 } },
  { question: "오답 노트를 만들 때, 단순히 해설을 옮겨 적기보다 나만의 풀이법을 정리하는 것을 선호하나요?", weights: { '실전/응용형': 2 } },
  { question: "친구의 질문에 답해주거나, 모르는 것을 가르쳐주는 것에 보람을 느끼나요?", weights: { '토론/협력형': 2 } },
];

const RenderQuestionWithMarkdown = ({ text }) => {
  const parts = text.split('**');
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? <strong key={index}>{part}</strong> : part
      )}
    </>
  );
};

// --- New Habit Checker Component ---
const HabitChecker = ({ onFinish }) => {
    const [step, setStep] = useState('quiz'); // quiz, loading, result
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [scores, setScores] = useState({ A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0, H: 0 });
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const fetchHabitRecommendation = async (finalScores: Record<string, number>) => {
        setStep('loading');
        try {
            const maxScore = Math.max(...Object.values(finalScores));
            const topTypes = Object.keys(finalScores).filter(type => finalScores[type] === maxScore);

            let resultTypeKey = topTypes[0];
            if (topTypes.length > 1) {
                resultTypeKey = topTypes.sort((a, b) => habitTypes[a].priority - habitTypes[b].priority)[0];
            }
            
            const resultType = habitTypes[resultTypeKey];

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
너는 학생들의 나쁜 공부 습관을 교정해주는 전문 학습 코치야.
내가 알려주는 학생의 '공부 방해 유형'에 대해 다음 형식에 맞춰 진단 결과와 해결책을 JSON으로 작성해줘.

[진단 유형]
${resultType.name}

[유형 설명]
${resultType.description}

[요구사항]
- 'analysis'에는 유형의 특징과 문제점을 친절하지만 명확하게 분석해줘.
- 'solutions'에는 해당 습관을 극복하기 위한 구체적이고 실천 가능한 팁을 3가지 제공해줘. 각 해결책은 'title'과 'description'으로 구성해.
- 전체적인 톤은 학생을 지지하고 격려하는 긍정적인 말투를 사용해줘.
- 반드시 JSON 형식으로만 응답해야 해.

{
  "title": "${resultType.name}",
  "analysis": "...",
  "solutions": [
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." }
  ]
}
`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: { responseMimeType: "application/json" }
            });
            
            const jsonText = response.text.trim();
            const parsedResult = JSON.parse(jsonText);

            setResult(parsedResult);
        } catch (e) {
            console.error(e);
            setError('결과를 분석하는 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setStep('result');
        }
    };
    
    const handleAnswer = (isYes) => {
        let nextScores = { ...scores };
        if (isYes) {
            const questionType = habitQuestions[currentQuestionIndex].type;
            nextScores[questionType]++;
        }

        if (currentQuestionIndex < habitQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setScores(nextScores);
        } else {
            setScores(nextScores);
            fetchHabitRecommendation(nextScores);
        }
    };

    const renderContent = () => {
        switch (step) {
            case 'quiz':
                const progress = ((currentQuestionIndex + 1) / habitQuestions.length) * 100;
                return (
                    <div className="content">
                        <div className="progress-bar">
                            <div className="progress" style={{ width: `${progress}%` }}></div>
                        </div>
                         <h2><RenderQuestionWithMarkdown text={habitQuestions[currentQuestionIndex].question} /></h2>
                         <div className="options-grid">
                             <button className="option-btn yes-btn" onClick={() => handleAnswer(true)}>예</button>
                             <button className="option-btn no-btn" onClick={() => handleAnswer(false)}>아니오</button>
                         </div>
                    </div>
                );
            case 'loading':
                return (
                    <div className="content">
                        <h2>결과 분석 중...</h2>
                        <p>AI가 당신의 공부 습관을 분석하고 있어요. 잠시만 기다려주세요!</p>
                        <div className="loader"></div>
                    </div>
                );
            case 'result':
                return (
                    <div className="content result-container">
                        {error && <p className="error">{error}</p>}
                        {result && (
                            <>
                                <h2>가장 시급한 공부 방해 요소는...</h2>
                                <div className="recommendation-card">
                                    <h3>{result.title}</h3>
                                    <p>{result.analysis}</p>
                                </div>
                                {result.solutions.map((sol, index) => (
                                    <div key={index} className="recommendation-card">
                                        <h3>✅ {sol.title}</h3>
                                        <p>{sol.description}</p>
                                    </div>
                                ))}
                            </>
                        )}
                        <button className="btn" onClick={onFinish}>진단 허브로 돌아가기</button>
                    </div>
                );
        }
    };
    return renderContent();
};


// --- Original Study Compass Component ---
const StudyCompass = ({ onFinish }) => {
  const [step, setStep] = useState('quiz'); // quiz, loading, result
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [scores, setScores] = useState({ '인강형': 0, '현강형': 0, '과외/관리형': 0, '토론/협력형': 0, '실전/응용형': 0 });
  // FIX: Change initial state to null to correctly handle object-based recommendation data.
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState('');
  
  const fetchRecommendation = async (finalScores: Record<string, number>) => {
    setStep('loading');
    try {
        const maxScore = Math.max(...Object.values(finalScores));
        const topTypes = Object.keys(finalScores).filter(type => finalScores[type] === maxScore);
        const resultType = topTypes.join(', ');

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
너는 학생들의 학습 유형을 분석하는 전문 학습 컨설턴트야.
내가 알려주는 학생의 '학습 유형'에 대해 다음 형식에 맞춰 진단 결과와 맞춤 학습 전략을 추천해줘.

[진단 유형]
${resultType}

[요구사항]
- 'title'에는 "${resultType} 맞춤 학습 전략" 이라고 만들어줘.
- 'analysis'에는 진단 유형의 강점과 약점을 간략하게 분석해줘.
- 'solutions'에는 해당 유형의 학생에게 가장 효과적인 공부 방법, 추천 강의 형태, 추천 교재 스타일을 구체적으로 제안해줘. 각 해결책은 'title'과 'description'으로 구성해줘.
- 말투는 학생에게 용기를 주는 친근하고 긍정적인 톤을 유지해줘.
- 반드시 JSON 형식으로만 응답해야 해.

{
  "title": "...",
  "analysis": "...",
  "solutions": [
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." }
  ]
}
`;
            
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        
        const jsonText = response.text.trim();
        const parsedResult = JSON.parse(jsonText);
        setRecommendation(parsedResult);

    } catch (e) {
        console.error(e);
        setError('결과를 분석하는 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
        setStep('result');
    }
  };
  
    const handleAnswer = (weights) => {
        const nextScores = { ...scores };
        for (const type in weights) {
            if (nextScores.hasOwnProperty(type)) {
                nextScores[type] += weights[type];
            }
        }
        
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setScores(nextScores);
        } else {
            setScores(nextScores);
            fetchRecommendation(nextScores);
        }
    };
    
    const renderContent = () => {
        switch (step) {
            case 'quiz':
                const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
                const currentQuestion = questions[currentQuestionIndex];
                return (
                    <div className="content">
                        <div className="progress-bar">
                            <div className="progress" style={{ width: `${progress}%` }}></div>
                        </div>
                         <h2>{currentQuestion.question}</h2>
                         <div className="options-grid">
                            <button className="option-btn yes-btn" onClick={() => handleAnswer(currentQuestion.weights)}>예</button>
                            <button className="option-btn no-btn" onClick={() => handleAnswer({})}>아니오</button>
                         </div>
                    </div>
                );
            case 'loading':
                 return (
                    <div className="content">
                        <h2>결과 분석 중...</h2>
                        <p>AI가 당신의 학습 성향을 분석하고 있어요. 잠시만 기다려주세요!</p>
                        <div className="loader"></div>
                    </div>
                );
            case 'result':
                return (
                    <div className="content result-container">
                        {error && <p className="error">{error}</p>}
                        {recommendation && (
                            <>
                                <h2>당신을 위한 맞춤 학습 전략은...</h2>
                                <div className="recommendation-card">
                                    <h3>{recommendation.title}</h3>
                                    <p>{recommendation.analysis}</p>
                                </div>
                                {recommendation.solutions.map((sol, index) => (
                                    <div key={index} className="recommendation-card">
                                        <h3>✅ {sol.title}</h3>
                                        <p>{sol.description}</p>
                                    </div>
                                ))}
                            </>
                        )}
                        <button className="btn" onClick={onFinish}>진단 허브로 돌아가기</button>
                    </div>
                );
        }
    };
    return renderContent();
};

const DiagnosticHub = ({ onSelect }) => {
    return (
        <div className="content">
            <h1>학습 나침반 AI</h1>
            <p>AI 진단을 통해 당신에게 꼭 맞는 학습 전략과<br/>건강한 공부 습관을 찾아보세요.</p>
            <div className="selection-grid">
                <div className="selection-card" onClick={() => onSelect('habit')}>
                    <h2>공부 방해 요소 진단</h2>
                    <p>나의 집중력을 갉아먹는 나쁜 습관은 무엇일까요? AI가 당신의 공부 습관을 진단하고 해결책을 제시합니다.</p>
                    <span className="start-arrow">→</span>
                </div>
                <div className="selection-card" onClick={() => onSelect('compass')}>
                    <h2>맞춤 공부법 진단</h2>
                    <p>인강? 현강? 과외? 나에게 가장 잘 맞는 공부 스타일을 찾아 학습 효율을 극대화하세요.</p>
                    <span className="start-arrow">→</span>
                </div>
            </div>
        </div>
    );
};

const Planner = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [selectedDate, setSelectedDate] = useState(today);
    const [view, setView] = useState('week'); // week or month
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('#FF6B6B');

    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    const loadDataForDate = (date) => {
        const dateKey = `planner_data_${formatDate(date)}`;
        try {
            const data = localStorage.getItem(dateKey);
            setCategories(data ? JSON.parse(data) : []);
        } catch (e) {
            console.error("Failed to load or parse data for", dateKey, e);
            setCategories([]);
        }
    };

    const saveDataForDate = (date, data) => {
        const dateKey = `planner_data_${formatDate(date)}`;
        localStorage.setItem(dateKey, JSON.stringify(data));
    };

    useEffect(() => {
        loadDataForDate(selectedDate);
    }, [selectedDate]);

    const getDayBackgroundColor = (date) => {
        const dateKey = `planner_data_${formatDate(date)}`;
        const data = localStorage.getItem(dateKey);
        if (!data) return null;

        try {
            const storedCategories = JSON.parse(data);
            if (!Array.isArray(storedCategories) || storedCategories.length === 0) return null;

            const completionCounts = storedCategories.map(category => ({
                color: category.color,
                count: Array.isArray(category.todos) ? category.todos.filter(todo => todo.completed).length : 0
            }));
            
            const totalCompleted = completionCounts.reduce((sum, c) => sum + c.count, 0);
            if (totalCompleted === 0) {
                return null;
            }

            const maxCountCategory = completionCounts.reduce((max, current) => {
                return current.count > max.count ? current : max;
            });

            return maxCountCategory.color;
        } catch (e) {
            console.error(`Failed to parse planner data for ${dateKey}`, e);
            return null;
        }
    };

    const handleAddCategory = (e) => {
        e.preventDefault();
        if (newCategoryName.trim() === '') return;
        const newCategory = {
            id: Date.now(),
            name: newCategoryName,
            color: newCategoryColor,
            todos: []
        };
        const updatedCategories = [...categories, newCategory];
        setCategories(updatedCategories);
        saveDataForDate(selectedDate, updatedCategories);
        setNewCategoryName('');
    };

    const handleDeleteCategory = (categoryId) => {
        const updatedCategories = categories.filter(c => c.id !== categoryId);
        setCategories(updatedCategories);
        saveDataForDate(selectedDate, updatedCategories);
    };

    const handleAddTodo = (categoryId, todoText) => {
        const newTodo = { id: Date.now(), text: todoText, completed: false };
        const updatedCategories = categories.map(c => {
            if (c.id === categoryId) {
                return { ...c, todos: [...c.todos, newTodo] };
            }
            return c;
        });
        setCategories(updatedCategories);
        saveDataForDate(selectedDate, updatedCategories);
    };

    const handleToggleTodo = (categoryId, todoId) => {
        const updatedCategories = categories.map(c => {
            if (c.id === categoryId) {
                return {
                    ...c,
                    todos: c.todos.map(t =>
                        t.id === todoId ? { ...t, completed: !t.completed } : t
                    )
                };
            }
            return c;
        });
        setCategories(updatedCategories);
        saveDataForDate(selectedDate, updatedCategories);
    };
    
    const handleDeleteTodo = (categoryId, todoId) => {
        const updatedCategories = categories.map(c => {
            if (c.id === categoryId) {
                return { ...c, todos: c.todos.filter(t => t.id !== todoId) };
            }
            return c;
        });
        setCategories(updatedCategories);
        saveDataForDate(selectedDate, updatedCategories);
    };


    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const WeekCalendar = ({ selectedDate, setSelectedDate, today }) => {
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
        const weekDays = Array.from({ length: 7 }).map((_, i) => {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            return day;
        });

        return (
            <div className="week-calendar">
                {weekDays.map(day => {
                    const dayBgColor = getDayBackgroundColor(day);
                    const style = dayBgColor ? { '--day-bg-color': hexToRgba(dayBgColor, 0.5) } : {};
                    const dayClasses = `day-item ${isSameDay(day, selectedDate) ? 'selected' : ''} ${isSameDay(day, today) ? 'today' : ''}`;
                    return (
                        <div
                            key={day.toISOString()}
                            className={dayClasses}
                            onClick={() => setSelectedDate(day)}
                            // FIX: Cast style object to React.CSSProperties to allow for CSS custom properties.
                            style={style as React.CSSProperties}
                        >
                            <div className="day-name">{['일', '월', '화', '수', '목', '금', '토'][day.getDay()]}</div>
                            <div className="date-number">{day.getDate()}</div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const MonthCalendar = ({ selectedDate, setSelectedDate, today }) => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const cells = [];
        for (let i = 0; i < startDayOfWeek; i++) {
            cells.push(<div key={`empty-${i}`} className="month-day-cell empty"></div>);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const day = new Date(year, month, i);
            const dayBgColor = getDayBackgroundColor(day);
            const style = dayBgColor ? { '--day-bg-color': hexToRgba(dayBgColor, 0.5) } : {};
            const dayClasses = `month-day-cell ${isSameDay(day, selectedDate) ? 'selected' : ''} ${isSameDay(day, today) ? 'today' : ''}`;
            cells.push(
                <div
                    key={day.toISOString()}
                    className={dayClasses}
                    onClick={() => { setSelectedDate(day); setView('week'); }}
                    // FIX: Cast style object to React.CSSProperties to allow for CSS custom properties.
                    style={style as React.CSSProperties}
                >
                    <span className="date-number-month">{i}</span>
                </div>
            );
        }

        return (
            <div className="month-calendar">
                <div className="month-calendar-header">
                    <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
                </div>
                <div className="month-calendar-grid">{cells}</div>
            </div>
        );
    };
    
    const CategoryCard = ({ category }) => {
        const [newTodoText, setNewTodoText] = useState('');
    
        const handleAdd = (e) => {
            e.preventDefault();
            if (newTodoText.trim()) {
                handleAddTodo(category.id, newTodoText);
                setNewTodoText('');
            }
        };
    
        return (
            <div className="category-card" style={{ borderLeftColor: category.color }}>
                <div className="category-header">
                    <h3>{category.name}</h3>
                    <div className="item-actions">
                        <button onClick={() => handleDeleteCategory(category.id)}>🗑️</button>
                    </div>
                </div>
                <ul className="todo-list">
                    {category.todos.map(todo => (
                        <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                            <div className="todo-checkbox" style={{ borderColor: category.color, backgroundColor: todo.completed ? category.color : 'transparent' }} onClick={() => handleToggleTodo(category.id, todo.id)}>
                                {todo.completed && '✓'}
                            </div>
                            <span>{todo.text}</span>
                            <div className="todo-actions item-actions">
                               <button onClick={() => handleDeleteTodo(category.id, todo.id)}>🗑️</button>
                            </div>
                        </li>
                    ))}
                </ul>
                <form className="add-todo-form" onSubmit={handleAdd}>
                    <input
                        type="text"
                        value={newTodoText}
                        onChange={(e) => setNewTodoText(e.target.value)}
                        placeholder="할 일 추가..."
                    />
                    <button type="submit" className="add-todo-btn" style={{ backgroundColor: category.color }}>+</button>
                </form>
            </div>
        );
    };

    const colorPalette = ['#FF6B6B', '#FFA07A', '#FFEE58', '#81C784', '#4FC3F7', '#5C6BC0', '#9575CD', '#F06292'];

    return (
        <div className="content planner-container">
            <header className="planner-header">
                <button className="planner-title" onClick={() => setView(view === 'week' ? 'month' : 'week')}>
                    <h2>{`${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월`}</h2>
                </button>
            </header>
            
            {view === 'week' ? (
                <WeekCalendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} today={today} />
            ) : (
                <MonthCalendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} today={today} />
            )}
            
            {view === 'week' && (
                <>
                    <div className="category-list">
                        {categories.map(cat => <CategoryCard key={cat.id} category={cat} />)}
                    </div>
                    
                    <form className="add-category-form" onSubmit={handleAddCategory}>
                        <div className="color-palette">
                            {colorPalette.map(color => (
                                <div
                                    key={color}
                                    className={`color-dot ${newCategoryColor === color ? 'selected' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setNewCategoryColor(color)}
                                />
                            ))}
                        </div>
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="새 카테고리 추가..."
                        />
                        <button type="submit" className="btn">추가</button>
                    </form>
                </>
            )}
        </div>
    );
};

const LoginPage = ({ onLogin }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin();
    };

    return (
        <div className="content login-container">
            <h1>학습 나침반 AI</h1>
            <p>로그인하고 맞춤 학습 전략을<br/>확인해보세요.</p>
            <form className="login-form" onSubmit={handleSubmit}>
                <input className="login-input" type="text" placeholder="아이디" aria-label="아이디" />
                <input className="login-input" type="password" placeholder="비밀번호" aria-label="비밀번호" />
                <button type="submit" className="btn login-btn">로그인</button>
            </form>
            <div className="divider">또는</div>
            <div className="social-login">
                 <button className="social-btn google" onClick={onLogin} aria-label="Google로 로그인"><i className="fab fa-google"></i></button>
                 <button className="social-btn kakao" onClick={onLogin} aria-label="카카오로 로그인"><i className="fas fa-comment"></i></button>
                 <button className="social-btn naver" onClick={onLogin} aria-label="네이버로 로그인">N</button>
            </div>
        </div>
    );
};

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [page, setPage] = useState('hub'); // hub, compass, habit, planner

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    const renderPage = () => {
        switch(page) {
            case 'compass':
                return <StudyCompass onFinish={() => setPage('hub')} />;
            case 'habit':
                return <HabitChecker onFinish={() => setPage('hub')} />;
            case 'planner':
                return <Planner />;
            case 'hub':
            default:
                return <DiagnosticHub onSelect={setPage} />;
        }
    };

    const handlePageChange = (newPage) => {
        // Do not allow navigation while a quiz is in progress
        if (page === 'compass' || page === 'habit') return;
        setPage(newPage);
    }

    return (
        <div className="app-container">
            {!isLoggedIn ? (
                <LoginPage onLogin={handleLogin} />
            ) : (
                <>
                    {renderPage()}
                    <nav className="nav-bar">
                        <button className={`nav-btn ${page === 'hub' || page === 'compass' || page === 'habit' ? 'active' : ''}`} onClick={() => handlePageChange('hub')}>진단</button>
                        <button className={`nav-btn ${page === 'planner' ? 'active' : ''}`} onClick={() => handlePageChange('planner')}>플래너</button>
                    </nav>
                </>
            )}
        </div>
    );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);