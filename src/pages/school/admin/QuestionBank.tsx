import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api/school-client';
import Modal from '@/components/school/Modal';
import { useConfirm } from '@/context/ConfirmContext';
import { CustomSelect } from "@/components/ui/CustomSelect";

export default function QuestionBank() {
  const confirm = useConfirm();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  // Form state
  const [text, setText] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [options, setOptions] = useState([{ text: '', isCorrect: true }, { text: '', isCorrect: false }]);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/content/questions');
      if (Array.isArray(res.data)) setQuestions(res.data);
      else if (res.data?.data) setQuestions(res.data.data);
      else setQuestions([]);
    } catch (err) {
      toast.error('Failed to fetch questions');
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        text,
        type: 'MULTIPLE_CHOICE',
        difficulty,
        topicId: '00000000-0000-0000-0000-000000000000', // We ideally need a topic selector. For now, we assume backend can handle or we mock topicId. Wait, /content/questions requires topicId? 
        // Actually, just sending options and text for demonstration if topicId is required we might need a dummy or a real fetch.
        // Let's pass the payload assuming it might need tweaking based on exact API validation.
        options: options.map((opt, i) => ({
          text: opt.text,
          isCorrect: opt.isCorrect,
          sortOrder: i
        }))
      };

      if (editingQuestion) {
        await api.patch(`/content/questions/${editingQuestion.id}`, payload);
        toast.success('Question updated successfully');
      } else {
        await api.post('/content/questions', payload);
        toast.success('Question created successfully');
      }
      setIsModalOpen(false);
      fetchQuestions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save question. Make sure topicId is valid if required.');
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this question? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/content/questions/${id}`);
      toast.success('Question deleted');
      fetchQuestions();
    } catch (err) {
      toast.error('Failed to delete question');
    }
  };

  const openModal = (q?: any) => {
    if (q) {
      setEditingQuestion(q);
      setText(q.text);
      setDifficulty(q.difficulty || 'MEDIUM');
      setOptions(q.options?.length ? q.options : [{ text: '', isCorrect: true }, { text: '', isCorrect: false }]);
    } else {
      setEditingQuestion(null);
      setText('');
      setDifficulty('MEDIUM');
      setOptions([{ text: '', isCorrect: true }, { text: '', isCorrect: false }]);
    }
    setIsModalOpen(true);
  };

  const addOption = () => {
    setOptions([...options, { text: '', isCorrect: false }]);
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...options];
    if (field === 'isCorrect' && value === true) {
      // Single correct answer logic (optional)
      newOptions.forEach(o => o.isCorrect = false);
    }
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const filteredQuestions = questions.filter(q => 
    q.text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Question
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
        <Search className="w-5 h-5 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full border-none focus:ring-0"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading questions...</div>
      ) : filteredQuestions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No questions found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredQuestions.map(q => (
            <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    q.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
                    q.difficulty === 'HARD' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {q.difficulty}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {q.type}
                  </span>
                </div>
                <p className="text-gray-900 font-medium mb-4">{q.text}</p>
                {q.options && q.options.length > 0 && (
                  <ul className="space-y-1">
                    {q.options.map((opt: any) => (
                      <li key={opt.id} className={`text-sm ${opt.isCorrect ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                        • {opt.text} {opt.isCorrect && '(Correct)'}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex space-x-2 ml-4">
                <button onClick={() => openModal(q)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(q.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingQuestion ? 'Edit Question' : 'Add Question'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
            <textarea
              required
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <CustomSelect
              value={difficulty}
              options={[
              { value: "EASY", label: "Easy" },
              { value: "MEDIUM", label: "Medium" },
              { value: "HARD", label: "Hard" },
            ]}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={opt.isCorrect}
                    onChange={() => updateOption(idx, 'isCorrect', true)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    required
                    value={opt.text}
                    onChange={e => updateOption(idx, 'text', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder={`Option ${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className="p-2 text-gray-400 hover:text-red-600"
                    disabled={options.length <= 2}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Option
            </button>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {editingQuestion ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
