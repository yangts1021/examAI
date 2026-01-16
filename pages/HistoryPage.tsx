import React, { useEffect, useState } from 'react';
import { fetchQuizHistory, HistoryRecord, fetchQuizQuestions } from '../services/gasService';
import Button from '../components/Button';
// However, App.tsx passes 'onNavigate' to Layout, but specific pages might need hook if router is available.
// Checking App.tsx (Step 175) shows it uses simple state routing: const [route, setRoute] = useState<AppRoute>(AppRoute.HOME);
// So this page should accept `onNavigate` prop or we need to access the setter. 
// Given the existing structure (App.tsx renders pages), we should prop drill `onNavigate`.

interface HistoryPageProps {
    onNavigate: (page: any, state?: any) => void;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate }) => {
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [reviewingId, setReviewingId] = useState<string | null>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        const data = await fetchQuizHistory();
        setHistory(data);
        setLoading(false);
    };

    const handleReview = async (record: HistoryRecord) => {
        // 1. Identify wrong answers (Question Number)
        const wrongNumbers = record.results
            .filter((r: any) => !r.isCorrect)
            .map((r: any) => r.questionNumber);

        if (wrongNumbers.length === 0) {
            alert("恭喜！這次測驗全對，沒有需要複習的題目。");
            return;
        }

        if (!confirm(`確認要複習 ${record.subject} 範圍 ${record.scope} 的 ${wrongNumbers.length} 題錯題嗎？`)) {
            return;
        }

        setReviewingId(record.timestamp); // Just to show loading state on specific button if we want

        // 2. Fetch ALL questions for that Subject & Scope
        // Note: This relies on the fact that Questions are fetched by Subject+Scope
        const allQuestions = await fetchQuizQuestions(record.subject, record.scope);

        if (allQuestions.length === 0) {
            alert("無法讀取題目失敗。可能是網路問題或題庫已變更。");
            setReviewingId(null);
            return;
        }

        // 3. Filter for wrong questions
        const reviewQuestions = allQuestions.filter(q =>
            wrongNumbers.includes(q.questionNumber)
        );

        if (reviewQuestions.length === 0) {
            alert("找不到對應的錯題 (可能題號已變更)。");
            setReviewingId(null);
            return;
        }

        // 4. Navigate to QuizPage with questions
        // We need to pass data to QuizPage. 
        // Since we are using simple state routing in App.tsx, we need to pass this via the onNavigate param.
        // We assume App.tsx's navigate function handles a second 'state' argument or we need to Modify App.tsx.
        onNavigate('quiz', {
            reviewQuestions,
            subject: record.subject,
            scope: record.scope
        });
        setReviewingId(null);
    };

    if (loading) {
        return <div className="p-8 text-center">讀取紀錄中...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">測驗紀錄</h1>

            {history.length === 0 ? (
                <div className="text-center text-gray-500 py-10 bg-white rounded-xl shadow-sm">
                    尚無測驗紀錄
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm">
                                    <th className="p-4 font-semibold">時間</th>
                                    <th className="p-4 font-semibold">科目</th>
                                    <th className="p-4 font-semibold">範圍</th>
                                    <th className="p-4 font-semibold">分數</th>
                                    <th className="p-4 font-semibold text-center">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {history.map((record, idx) => {
                                    const dateObj = new Date(record.timestamp);
                                    const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-sm text-gray-600">{dateStr}</td>
                                            <td className="p-4 font-medium text-gray-800">{record.subject}</td>
                                            <td className="p-4 text-sm text-gray-600">{record.scope}</td>
                                            <td className="p-4 font-bold text-blue-600">{record.score}</td>
                                            <td className="p-4 text-center">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    isLoading={reviewingId === record.timestamp}
                                                    onClick={() => handleReview(record)}
                                                >
                                                    錯題複習
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
