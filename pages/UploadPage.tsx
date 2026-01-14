import React, { useState, useRef } from 'react';
import Button from '../components/Button';
import { analyzeExamImage } from '../services/geminiService';
import { uploadExamData } from '../services/gasService';
import { ExamPaperData, Question } from '../types';

const UploadPage: React.FC = () => {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<ExamPaperData | null>(null);
  
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // 圖片壓縮與調整大小函式
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_DIMENSION = 1600; // 限制最大邊長，避免 Payload 過大導致 API 錯誤

          if (width > height) {
            if (width > MAX_DIMENSION) {
              height *= MAX_DIMENSION / width;
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width *= MAX_DIMENSION / height;
              height = MAX_DIMENSION;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
             ctx.drawImage(img, 0, 0, width, height);
             // 使用 JPEG 0.8 品質大幅減少體積
             resolve(canvas.toDataURL('image/jpeg', 0.8)); 
          } else {
             // 降級處理
             resolve(e.target?.result as string);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resizedImage = await resizeImage(file);
        if (side === 'front') {
          setFrontImage(resizedImage);
        } else {
          setBackImage(resizedImage);
        }
      } catch (err) {
        console.error("Image processing error:", err);
        alert("圖片處理失敗，請重試。");
      }
    }
  };

  const cropDiagrams = async (originalBase64: string, examData: ExamPaperData): Promise<ExamPaperData> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(examData);
          return;
        }

        const newQuestions = examData.questions.map(q => {
          // 如果有座標 [ymin, xmin, ymax, xmax] (0-1000 scale)
          if (q.diagramCoordinates && q.diagramCoordinates.length === 4) {
            const [ymin, xmin, ymax, xmax] = q.diagramCoordinates;
            
            // 轉換 0-1000 比例為實際像素
            const x = (xmin / 1000) * img.width;
            const y = (ymin / 1000) * img.height;
            const w = ((xmax - xmin) / 1000) * img.width;
            const h = ((ymax - ymin) / 1000) * img.height;

            // 設定 Canvas 大小為裁切區域大小
            canvas.width = w;
            canvas.height = h;

            // 繪製裁切區域
            ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
            
            // 轉換為 Base64
            return { ...q, diagramUrl: canvas.toDataURL('image/png') };
          }
          return q;
        });

        resolve({ ...examData, questions: newQuestions });
      };
      img.src = originalBase64;
    });
  };

  const handleAnalyze = async () => {
    if (!frontImage && !backImage) {
      alert("請至少上傳一面試卷圖片。");
      return;
    }

    setIsAnalyzing(true);
    try {
      const processImage = async (base64Image: string) => {
        const base64Data = base64Image.split(',')[1];
        const mimeType = base64Image.split(';')[0].split(':')[1];
        
        // 1. Gemini 分析
        let result = await analyzeExamImage(base64Data, mimeType);
        
        // 2. 針對該圖片進行裁切
        result = await cropDiagrams(base64Image, result);
        return result;
      };

      let combinedQuestions: Question[] = [];
      let finalSubject = '';
      let finalScope = '';

      // 處理正面
      if (frontImage) {
        const frontData = await processImage(frontImage);
        combinedQuestions = [...combinedQuestions, ...frontData.questions];
        finalSubject = frontData.subject;
        finalScope = frontData.scope;
      }

      // 處理背面
      if (backImage) {
        const backData = await processImage(backImage);
        combinedQuestions = [...combinedQuestions, ...backData.questions];
        // 若正面沒抓到科目資訊，使用背面的
        if (!finalSubject) finalSubject = backData.subject;
        if (!finalScope) finalScope = backData.scope;
      }

      // 依照題號重新排序
      combinedQuestions.sort((a, b) => (a.questionNumber || 0) - (b.questionNumber || 0));

      setData({
        subject: finalSubject,
        scope: finalScope,
        questions: combinedQuestions
      });

    } catch (err) {
      console.error(err);
      alert("圖片分析失敗，請確認圖片清晰度或網路連線。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!data) return;
    setIsSaving(true);
    try {
      const success = await uploadExamData(data);
      if (success) {
        alert("考題資料已成功儲存至 Google Sheets！");
        setData(null);
        setFrontImage(null);
        setBackImage(null);
        if (frontInputRef.current) frontInputRef.current.value = '';
        if (backInputRef.current) backInputRef.current.value = '';
      }
    } catch (err) {
      alert("儲存資料時發生錯誤。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDataChange = <K extends keyof ExamPaperData>(field: K, value: ExamPaperData[K]) => {
    if (data) {
      setData({ ...data, [field]: value });
    }
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    if (data) {
      const newQuestions = [...data.questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      setData({ ...data, questions: newQuestions });
    }
  };

  const removeQuestion = (index: number) => {
    if (data) {
      const newQuestions = data.questions.filter((_, i) => i !== index);
      setData({ ...data, questions: newQuestions });
    }
  }

  const renderUploadBox = (side: 'front' | 'back', title: string, image: string | null, inputRef: React.RefObject<HTMLInputElement>) => (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">{title}</h3>
      <div 
        className={`flex-1 border-2 border-dashed rounded-xl p-4 text-center transition-colors relative min-h-[200px] flex flex-col justify-center items-center ${
          image ? 'border-blue-300 bg-blue-50' : 'border-slate-300 hover:bg-slate-50'
        }`}
      >
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => handleFileChange(e, side)} 
          ref={inputRef}
          className="hidden" 
          id={`upload-${side}`}
        />
        
        {image ? (
          <div className="relative w-full h-full flex items-center justify-center group">
            <img src={image} alt={`${title} Preview`} className="max-h-64 max-w-full object-contain" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
               <label htmlFor={`upload-${side}`} className="cursor-pointer bg-white text-slate-800 px-4 py-2 rounded-full font-medium text-sm hover:bg-blue-50">
                 更換圖片
               </label>
            </div>
          </div>
        ) : (
          <label htmlFor={`upload-${side}`} className="cursor-pointer flex flex-col items-center w-full h-full justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-400 mb-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-blue-600 font-medium hover:underline">上傳{title}</span>
          </label>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">上傳試卷</h2>
        
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
             {/* 雙欄上傳區 */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderUploadBox('front', '正面 (Front)', frontImage, frontInputRef)}
                {renderUploadBox('back', '背面 (Back)', backImage, backInputRef)}
             </div>

             <div className="text-slate-500 text-sm bg-slate-50 p-3 rounded border border-slate-100">
                <p>💡 提示：同時上傳正反兩面，系統會自動合併分析並排序題目。</p>
             </div>

             <div className="flex justify-end">
                <Button 
                  onClick={handleAnalyze} 
                  disabled={(!frontImage && !backImage) || isAnalyzing}
                  isLoading={isAnalyzing}
                  className="w-full md:w-auto"
                >
                  {isAnalyzing ? 'Gemini 分析中...' : '開始分析試卷'}
                </Button>
             </div>
          </div>

          {/* Results Editor */}
          {data && (
            <div className="flex-1 space-y-6 animate-fade-in border-t lg:border-t-0 lg:border-l lg:pl-8 border-slate-200 pt-6 lg:pt-0">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">試卷資訊</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">科目</label>
                    <input 
                      type="text" 
                      value={data.subject}
                      onChange={(e) => handleDataChange('subject', e.target.value)}
                      className="w-full rounded-md border-blue-200 focus:ring-blue-500 focus:border-blue-500 p-2 bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">範圍</label>
                    <input 
                      type="text" 
                      value={data.scope}
                      onChange={(e) => handleDataChange('scope', e.target.value)}
                      className="w-full rounded-md border-blue-200 focus:ring-blue-500 focus:border-blue-500 p-2 bg-white text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                 <h3 className="font-bold text-slate-700">解析結果 ({data.questions.length} 題)</h3>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {data.questions.map((q, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative group transition-all hover:shadow-md">
                    <button 
                      onClick={() => removeQuestion(idx)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="刪除此題"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>
                    
                    {/* 顯示裁切後的圖片 */}
                    {q.diagramUrl && (
                      <div className="mb-3 p-2 border border-slate-200 bg-white rounded flex justify-center">
                         <img src={q.diagramUrl} alt={`Diagram for Q${q.questionNumber || idx+1}`} className="max-h-40 object-contain" />
                      </div>
                    )}

                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold uppercase text-slate-500">第 {q.questionNumber || idx + 1} 題</label>
                        {/* 顯示題組 ID 輸入欄 */}
                         <div className="flex items-center gap-1">
                            <label className="text-xs text-slate-400">Group ID:</label>
                            <input 
                              type="text" 
                              value={q.groupId || ''}
                              placeholder="無"
                              onChange={(e) => handleQuestionChange(idx, 'groupId', e.target.value)}
                              className="w-16 text-xs p-1 border border-slate-200 rounded text-slate-600 bg-white"
                            />
                         </div>
                      </div>
                      
                      <textarea 
                        value={q.text}
                        onChange={(e) => handleQuestionChange(idx, 'text', e.target.value)}
                        className="w-full mt-1 rounded border-slate-300 text-sm p-2 bg-white text-slate-900 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                      />
                    </div>

                    {/* 題組文章編輯區塊 */}
                    <div className="mb-3">
                       <details className="group/details">
                          <summary className="text-xs font-semibold text-slate-500 cursor-pointer hover:text-blue-600 select-none flex items-center gap-1">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 transition-transform group-open/details:rotate-90">
                               <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                             </svg>
                             閱讀測驗 / 題組文章內容 (Group Content) {q.groupContent ? '✅' : ''}
                          </summary>
                          <textarea 
                             value={q.groupContent || ''}
                             onChange={(e) => handleQuestionChange(idx, 'groupContent', e.target.value)}
                             className="w-full mt-2 rounded border-slate-300 text-xs p-2 bg-slate-50 text-slate-800 focus:ring-blue-500 focus:border-blue-500"
                             rows={4}
                             placeholder="若此題為閱讀測驗的一部分，請在此貼上文章內容。同一題組的題目應有相同的 Group ID 與文章內容。"
                          />
                       </details>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {['A', 'B', 'C', 'D'].map((opt) => (
                        <div key={opt}>
                          <span className="text-xs font-semibold text-slate-500">{opt}.</span>
                          <input 
                            type="text"
                            // @ts-ignore
                            value={q[`option${opt}`]}
                            // @ts-ignore
                            onChange={(e) => handleQuestionChange(idx, `option${opt}`, e.target.value)}
                            className="w-full mt-1 rounded border-slate-300 text-xs p-1 bg-white text-slate-900 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                       <div>
                          <label className="block text-xs font-bold text-slate-500">正確答案</label>
                          <select 
                            value={q.correctAnswer}
                            onChange={(e) => handleQuestionChange(idx, 'correctAnswer', e.target.value)}
                            className="w-full mt-1 rounded border-slate-300 text-sm p-1 bg-white text-slate-900 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {['A', 'B', 'C', 'D'].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-slate-500">詳解</label>
                          <input 
                             type="text"
                             value={q.explanation}
                             onChange={(e) => handleQuestionChange(idx, 'explanation', e.target.value)}
                             className="w-full mt-1 rounded border-slate-300 text-xs p-1 bg-white text-slate-900 focus:ring-blue-500 focus:border-blue-500"
                          />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <Button onClick={handleSave} variant="secondary" isLoading={isSaving}>
                  儲存至資料庫
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
